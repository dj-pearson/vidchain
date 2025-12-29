// VidChain Email Notification Edge Function
// Sends transactional emails using Resend

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailPayload {
  to: string;
  toName?: string;
  template: string;
  data: Record<string, unknown>;
  userId?: string;
  contextType?: string;
  contextId?: string;
}

// Render template with variables
function renderTemplate(template: string, data: Record<string, unknown>): string {
  let rendered = template;
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    rendered = rendered.replace(regex, String(value ?? ''));
  }
  return rendered;
}

// Email layout wrapper
function wrapInLayout(content: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      padding: 40px;
    }
    .logo {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo h1 {
      color: #22c55e;
      font-size: 28px;
      margin: 0;
    }
    h1, h2, h3 {
      color: #111;
    }
    .button {
      display: inline-block;
      background: #22c55e;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 8px;
      font-weight: 600;
      margin: 20px 0;
    }
    .button:hover {
      background: #16a34a;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      color: #666;
      font-size: 13px;
    }
    .footer a {
      color: #22c55e;
    }
    code {
      background: #f0f0f0;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 13px;
    }
    .info-box {
      background: #f8f9fa;
      border-left: 4px solid #22c55e;
      padding: 16px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }
    .warning-box {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 16px;
      margin: 20px 0;
      border-radius: 0 8px 8px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <h1>VidChain</h1>
        <p style="color: #666; margin: 5px 0;">Proof of Media Authenticity</p>
      </div>
      ${content}
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} VidChain. All rights reserved.</p>
        <p>
          <a href="https://vidchain.io">vidchain.io</a> |
          <a href="https://vidchain.io/privacy">Privacy</a> |
          <a href="https://vidchain.io/terms">Terms</a>
        </p>
        <p style="font-size: 11px; color: #999;">
          You received this email because you have a VidChain account.<br>
          <a href="https://vidchain.io/settings/notifications">Manage notification preferences</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// Built-in templates for common notifications
const builtInTemplates: Record<string, { subject: string; html: string }> = {
  verification_complete: {
    subject: 'Your media has been verified on VidChain',
    html: `
      <h2>Verification Complete</h2>
      <p>Great news! Your {{media_type}} <strong>"{{title}}"</strong> has been successfully verified and recorded on the blockchain.</p>

      <div class="info-box">
        <p><strong>Token ID:</strong> #{{token_id}}</p>
        <p><strong>Transaction:</strong> <code>{{transaction_hash}}</code></p>
        <p><strong>Verified on:</strong> {{verification_date}}</p>
      </div>

      <p style="text-align: center;">
        <a href="{{verification_url}}" class="button">View Verification Certificate</a>
      </p>

      <p>Your media now has immutable proof of authenticity on the blockchain. You can share your verification certificate or embed the verification badge on your website.</p>
    `,
  },

  nft_minted: {
    subject: 'Your VidChain NFT has been minted',
    html: `
      <h2>NFT Minted Successfully</h2>
      <p>Your verification has been minted as an NFT on the Polygon network.</p>

      <div class="info-box">
        <p><strong>Token ID:</strong> #{{token_id}}</p>
        <p><strong>Contract:</strong> <code>{{contract_address}}</code></p>
        <p><strong>Transaction:</strong> <code>{{transaction_hash}}</code></p>
      </div>

      <p style="text-align: center;">
        <a href="{{nft_url}}" class="button">View Your NFT</a>
      </p>

      <p>Your NFT includes immutable proof of creation, ownership rights, and verification status. You can transfer, sell, or license your verified content through the VidChain marketplace.</p>
    `,
  },

  duplicate_detected: {
    subject: 'Duplicate content detected',
    html: `
      <h2>Duplicate Content Detected</h2>
      <div class="warning-box">
        <p>The {{media_type}} you uploaded appears to match existing verified content on VidChain.</p>
      </div>

      <p><strong>Original verification:</strong></p>
      <p><a href="{{original_url}}">{{original_title}}</a></p>
      <p>Verified on: {{original_date}}</p>

      <p>If you believe this is an error or you have rights to this content, please contact us with proof of ownership.</p>

      <p style="text-align: center;">
        <a href="https://vidchain.io/support" class="button">Contact Support</a>
      </p>
    `,
  },

  dmca_notice: {
    subject: 'DMCA Notice Received - Action Required',
    html: `
      <h2>DMCA Takedown Notice</h2>
      <div class="warning-box">
        <p>We have received a DMCA takedown notice regarding your content.</p>
      </div>

      <p><strong>Claim Number:</strong> {{claim_number}}</p>
      <p><strong>Content:</strong> {{content_title}}</p>
      <p><strong>Claimant:</strong> {{claimant_name}}</p>

      <p>In accordance with the Digital Millennium Copyright Act, the content has been temporarily removed pending resolution.</p>

      <h3>Your Options</h3>
      <ol>
        <li>If you believe this notice was sent in error, you may file a counter-notification</li>
        <li>You may contact the claimant directly to resolve the dispute</li>
        <li>If no action is taken, the content will remain removed</li>
      </ol>

      <p style="text-align: center;">
        <a href="{{dmca_url}}" class="button">View Details & Respond</a>
      </p>

      <p><strong>Deadline:</strong> You have 10-14 business days to file a counter-notification.</p>
    `,
  },

  security_alert: {
    subject: 'Security Alert for Your VidChain Account',
    html: `
      <h2>Security Alert</h2>
      <div class="warning-box">
        <p>{{alert_message}}</p>
      </div>

      <p><strong>Time:</strong> {{alert_time}}</p>
      <p><strong>IP Address:</strong> {{ip_address}}</p>
      <p><strong>Location:</strong> {{location}}</p>

      <p>If this was you, you can safely ignore this email. If you didn't perform this action, please secure your account immediately:</p>

      <ol>
        <li>Change your password</li>
        <li>Enable two-factor authentication</li>
        <li>Review recent account activity</li>
      </ol>

      <p style="text-align: center;">
        <a href="https://vidchain.io/settings/security" class="button">Secure My Account</a>
      </p>
    `,
  },

  welcome: {
    subject: 'Welcome to VidChain',
    html: `
      <h2>Welcome to VidChain!</h2>
      <p>Hi {{name}},</p>

      <p>Thank you for joining VidChain, the trusted platform for media authenticity verification.</p>

      <h3>Getting Started</h3>
      <ol>
        <li><strong>Upload your content</strong> - Verify videos and photos with blockchain-backed proof</li>
        <li><strong>Mint NFTs</strong> - Protect your intellectual property with verified NFTs</li>
        <li><strong>Share with confidence</strong> - Embed verification badges on your content</li>
      </ol>

      <p style="text-align: center;">
        <a href="https://vidchain.io/dashboard" class="button">Go to Dashboard</a>
      </p>

      <p>If you have any questions, our support team is here to help.</p>
    `,
  },

  weekly_report: {
    subject: 'Your Weekly VidChain Activity Report',
    html: `
      <h2>Weekly Activity Report</h2>
      <p>Here's a summary of your VidChain activity for the week of {{week_start}} - {{week_end}}.</p>

      <div class="info-box">
        <p><strong>Verifications:</strong> {{verification_count}}</p>
        <p><strong>NFTs Minted:</strong> {{nft_count}}</p>
        <p><strong>Badge Views:</strong> {{badge_views}}</p>
      </div>

      <p style="text-align: center;">
        <a href="https://vidchain.io/dashboard" class="button">View Full Report</a>
      </p>
    `,
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const payload: EmailPayload = await req.json();
    const { to, toName, template, data, userId, contextType, contextId } = payload;

    if (!to || !template) {
      return new Response(
        JSON.stringify({ error: 'to and template are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get template
    let emailTemplate = builtInTemplates[template];

    if (!emailTemplate) {
      // Try to get from database
      const { data: dbTemplate } = await supabaseClient
        .from('email_templates')
        .select('*')
        .eq('name', template)
        .eq('enabled', true)
        .single();

      if (dbTemplate) {
        emailTemplate = {
          subject: dbTemplate.subject,
          html: dbTemplate.html_body,
        };
      }
    }

    if (!emailTemplate) {
      return new Response(
        JSON.stringify({ error: `Template "${template}" not found` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Render template
    const subject = renderTemplate(emailTemplate.subject, data);
    const htmlContent = renderTemplate(emailTemplate.html, data);
    const fullHtml = wrapInLayout(htmlContent, subject);

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'VidChain <notifications@vidchain.io>',
        to: toName ? `${toName} <${to}>` : to,
        subject,
        html: fullHtml,
      }),
    });

    const result = await response.json();

    // Log the email
    await supabaseClient.from('email_logs').insert({
      to_email: to,
      to_name: toName,
      user_id: userId,
      subject,
      context_type: contextType,
      context_id: contextId,
      status: response.ok ? 'sent' : 'failed',
      sent_at: response.ok ? new Date().toISOString() : null,
      provider: 'resend',
      provider_message_id: result.id,
      provider_response: result,
      error_message: result.error?.message,
    });

    if (!response.ok) {
      console.error('Resend error:', result);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: result }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Email sending error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
