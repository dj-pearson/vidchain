import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest, corsJsonResponse, corsErrorResponse } from "../_shared/cors.ts";

interface DMCAClaimRequest {
  // Content info
  contentId: string;
  contentType: 'video' | 'listing' | 'nft';
  contentUrl?: string;

  // Claimant info
  claimantName: string;
  claimantEmail: string;
  claimantPhone?: string;
  claimantAddress: string;
  claimantCompany?: string;
  isAuthorizedAgent: boolean;
  rightsOwnerName?: string;

  // Copyright info
  copyrightedWorkDescription: string;
  copyrightedWorkUrl?: string;
  copyrightRegistrationNumber?: string;
  infringementDescription: string;

  // Required statements
  goodFaithStatement: boolean;
  accuracyStatement: boolean;
  authorizationStatement: boolean;

  // Signature
  signatureName: string;
}

interface CounterNotificationRequest {
  originalClaimId: string;
  respondentName: string;
  respondentEmail: string;
  respondentPhone?: string;
  respondentAddress: string;
  removedContentDescription: string;
  mistakeStatement: string;
  goodFaithStatement: boolean;
  jurisdictionConsent: boolean;
  jurisdictionDistrict: string;
  serviceConsent: boolean;
  signatureName: string;
}

serve(async (req) => {
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Use service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Use anon key with auth for user operations
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization') || '' },
      },
    });

    const { data: { user } } = await supabaseClient.auth.getUser();

    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(Boolean).pop();

    // Get client IP for logging
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] ||
                     req.headers.get('x-real-ip') ||
                     'unknown';

    // ==========================================
    // SUBMIT DMCA TAKEDOWN NOTICE
    // ==========================================
    if (req.method === 'POST' && path === 'submit') {
      const body: DMCAClaimRequest = await req.json();

      // Validate required fields
      const requiredFields = [
        'contentId', 'contentType', 'claimantName', 'claimantEmail',
        'claimantAddress', 'copyrightedWorkDescription', 'infringementDescription',
        'signatureName'
      ];

      for (const field of requiredFields) {
        if (!body[field as keyof DMCAClaimRequest]) {
          return new Response(
            JSON.stringify({ error: `Missing required field: ${field}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Validate required statements
      if (!body.goodFaithStatement || !body.accuracyStatement || !body.authorizationStatement) {
        return new Response(
          JSON.stringify({ error: 'All required statements must be checked' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get content details
      let contentTitle = '';
      let contentOwnerId = null;

      if (body.contentType === 'video') {
        const { data: video } = await supabaseAdmin
          .from('videos')
          .select('title, user_id')
          .eq('id', body.contentId)
          .single();

        if (video) {
          contentTitle = video.title;
          contentOwnerId = video.user_id;
        }
      } else if (body.contentType === 'listing') {
        const { data: listing } = await supabaseAdmin
          .from('marketplace_listings')
          .select('title, seller_id')
          .eq('id', body.contentId)
          .single();

        if (listing) {
          contentTitle = listing.title;
          contentOwnerId = listing.seller_id;
        }
      }

      // Create DMCA claim
      const { data: claim, error: claimError } = await supabaseAdmin
        .from('dmca_claims')
        .insert({
          content_id: body.contentId,
          content_type: body.contentType,
          content_url: body.contentUrl,
          content_title: contentTitle,
          content_owner_id: contentOwnerId,
          claimant_name: body.claimantName,
          claimant_email: body.claimantEmail,
          claimant_phone: body.claimantPhone,
          claimant_address: body.claimantAddress,
          claimant_company: body.claimantCompany,
          is_authorized_agent: body.isAuthorizedAgent,
          rights_owner_name: body.rightsOwnerName,
          copyrighted_work_description: body.copyrightedWorkDescription,
          copyrighted_work_url: body.copyrightedWorkUrl,
          copyright_registration_number: body.copyrightRegistrationNumber,
          infringement_description: body.infringementDescription,
          good_faith_statement: body.goodFaithStatement,
          accuracy_statement: body.accuracyStatement,
          authorization_statement: body.authorizationStatement,
          signature_name: body.signatureName,
          signature_date: new Date().toISOString().split('T')[0],
          signature_ip_address: clientIP,
          status: 'pending',
          submission_source: 'web',
          user_agent: req.headers.get('user-agent'),
        })
        .select()
        .single();

      if (claimError) {
        console.error('Error creating DMCA claim:', claimError);
        return new Response(
          JSON.stringify({ error: 'Failed to submit DMCA claim' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log communication
      await supabaseAdmin.from('dmca_communications').insert({
        claim_id: claim.id,
        direction: 'inbound',
        communication_type: 'notice_received',
        sender_email: body.claimantEmail,
        subject: `DMCA Takedown Notice - ${claim.claim_number}`,
        body: JSON.stringify(body),
      });

      // Send acknowledgment email (in production)
      // await sendEmail('dmca_acknowledgment', { ... });

      return new Response(
        JSON.stringify({
          success: true,
          claimNumber: claim.claim_number,
          message: 'Your DMCA takedown notice has been received. You will receive an acknowledgment email shortly.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // SUBMIT COUNTER-NOTIFICATION
    // ==========================================
    if (req.method === 'POST' && path === 'counter') {
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body: CounterNotificationRequest = await req.json();

      // Validate required fields
      const requiredFields = [
        'originalClaimId', 'respondentName', 'respondentEmail',
        'respondentAddress', 'removedContentDescription', 'mistakeStatement',
        'jurisdictionDistrict', 'signatureName'
      ];

      for (const field of requiredFields) {
        if (!body[field as keyof CounterNotificationRequest]) {
          return new Response(
            JSON.stringify({ error: `Missing required field: ${field}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Validate required statements
      if (!body.goodFaithStatement || !body.jurisdictionConsent || !body.serviceConsent) {
        return new Response(
          JSON.stringify({ error: 'All required statements must be accepted' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify the original claim exists and user is content owner
      const { data: originalClaim } = await supabaseAdmin
        .from('dmca_claims')
        .select('*')
        .eq('id', body.originalClaimId)
        .single();

      if (!originalClaim) {
        return new Response(
          JSON.stringify({ error: 'Original claim not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (originalClaim.content_owner_id !== user.id) {
        return new Response(
          JSON.stringify({ error: 'You can only file counter-notifications for your own content' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if counter already exists
      const { data: existingCounter } = await supabaseAdmin
        .from('dmca_counter_notifications')
        .select('id')
        .eq('original_claim_id', body.originalClaimId)
        .single();

      if (existingCounter) {
        return new Response(
          JSON.stringify({ error: 'A counter-notification has already been filed for this claim' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create counter-notification
      const { data: counter, error: counterError } = await supabaseAdmin
        .from('dmca_counter_notifications')
        .insert({
          original_claim_id: body.originalClaimId,
          respondent_name: body.respondentName,
          respondent_email: body.respondentEmail,
          respondent_phone: body.respondentPhone,
          respondent_address: body.respondentAddress,
          removed_content_description: body.removedContentDescription,
          original_content_url: originalClaim.content_url,
          mistake_statement: body.mistakeStatement,
          good_faith_statement: body.goodFaithStatement,
          jurisdiction_consent: body.jurisdictionConsent,
          jurisdiction_district: body.jurisdictionDistrict,
          service_consent: body.serviceConsent,
          signature_name: body.signatureName,
          signature_date: new Date().toISOString().split('T')[0],
          signature_ip_address: clientIP,
          status: 'pending',
        })
        .select()
        .single();

      if (counterError) {
        console.error('Error creating counter-notification:', counterError);
        return new Response(
          JSON.stringify({ error: 'Failed to submit counter-notification' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update original claim status
      await supabaseAdmin
        .from('dmca_claims')
        .update({
          status: 'counter_received',
          counter_claim_id: counter.id,
        })
        .eq('id', body.originalClaimId);

      // Log communication
      await supabaseAdmin.from('dmca_communications').insert({
        claim_id: body.originalClaimId,
        direction: 'inbound',
        communication_type: 'counter_received',
        sender_email: body.respondentEmail,
        subject: `Counter-Notification - ${originalClaim.claim_number}`,
        body: JSON.stringify(body),
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Your counter-notification has been received. We will forward it to the original claimant.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // GET USER'S DMCA CLAIMS/STRIKES
    // ==========================================
    if (req.method === 'GET' && path === 'my-claims') {
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get claims against user's content
      const { data: claims } = await supabaseClient
        .from('dmca_claims')
        .select('*')
        .eq('content_owner_id', user.id)
        .order('created_at', { ascending: false });

      // Get user's strikes
      const { data: strikes } = await supabaseClient
        .from('dmca_strikes')
        .select('*, claim:dmca_claims(claim_number, content_title)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      return new Response(
        JSON.stringify({ claims: claims || [], strikes: strikes || [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // ADMIN: GET DMCA QUEUE
    // ==========================================
    if (req.method === 'GET' && path === 'queue') {
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify admin role
      const { data: userData } = await supabaseClient
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!userData || !['admin', 'moderator'].includes(userData.role)) {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const status = url.searchParams.get('status') || 'pending';

      const { data: claims } = await supabaseAdmin
        .from('dmca_claims')
        .select(`
          *,
          content_owner:users!content_owner_id(id, email, display_name),
          counter:dmca_counter_notifications(*)
        `)
        .eq('status', status)
        .order('created_at', { ascending: true });

      return new Response(
        JSON.stringify({ claims: claims || [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // ADMIN: PROCESS DMCA CLAIM
    // ==========================================
    if (req.method === 'POST' && path === 'process') {
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify admin role
      const { data: userData } = await supabaseClient
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!userData || !['admin', 'moderator'].includes(userData.role)) {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      const { claimId, action, notes } = body;

      if (!claimId || !action) {
        return new Response(
          JSON.stringify({ error: 'Claim ID and action required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get claim
      const { data: claim } = await supabaseAdmin
        .from('dmca_claims')
        .select('*')
        .eq('id', claimId)
        .single();

      if (!claim) {
        return new Response(
          JSON.stringify({ error: 'Claim not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'approve') {
        // Mark claim as valid and take action
        await supabaseAdmin
          .from('dmca_claims')
          .update({
            status: 'actioned',
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            actioned_at: new Date().toISOString(),
            status_reason: notes,
          })
          .eq('id', claimId);

        // Remove/hide content
        if (claim.content_type === 'video') {
          await supabaseAdmin
            .from('videos')
            .update({ moderation_status: 'removed' })
            .eq('id', claim.content_id);
        } else if (claim.content_type === 'listing') {
          await supabaseAdmin
            .from('marketplace_listings')
            .update({ status: 'removed' })
            .eq('id', claim.content_id);
        }

        // Update content DMCA status
        await supabaseAdmin
          .from('dmca_content_status')
          .upsert({
            content_id: claim.content_id,
            content_type: claim.content_type,
            current_claim_id: claimId,
            status: 'taken_down',
            taken_down_at: new Date().toISOString(),
          });

        // Apply strike to content owner
        if (claim.content_owner_id) {
          await supabaseAdmin.rpc('apply_dmca_penalty', {
            target_user_id: claim.content_owner_id,
            claim_id_param: claimId,
          });
        }

        // Send notification to content owner
        // await sendEmail('dmca_takedown_notification', { ... });

        return new Response(
          JSON.stringify({
            success: true,
            message: 'DMCA claim approved. Content has been removed and strike applied.',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } else if (action === 'reject') {
        // Mark claim as invalid
        await supabaseAdmin
          .from('dmca_claims')
          .update({
            status: 'invalid',
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            status_reason: notes || 'Notice does not meet DMCA requirements',
          })
          .eq('id', claimId);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'DMCA claim rejected as invalid.',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } else if (action === 'forward_counter') {
        // Forward counter-notification to original claimant
        const { data: counter } = await supabaseAdmin
          .from('dmca_counter_notifications')
          .select('*')
          .eq('original_claim_id', claimId)
          .single();

        if (!counter) {
          return new Response(
            JSON.stringify({ error: 'No counter-notification found' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const waitingPeriodEnds = new Date();
        waitingPeriodEnds.setDate(waitingPeriodEnds.getDate() + 14);

        await supabaseAdmin
          .from('dmca_counter_notifications')
          .update({
            status: 'forwarded',
            forwarded_to_claimant_at: new Date().toISOString(),
            waiting_period_ends: waitingPeriodEnds.toISOString(),
          })
          .eq('id', counter.id);

        await supabaseAdmin
          .from('dmca_claims')
          .update({
            status: 'counter_pending',
            counter_deadline: waitingPeriodEnds.toISOString(),
          })
          .eq('id', claimId);

        // Log communication
        await supabaseAdmin.from('dmca_communications').insert({
          claim_id: claimId,
          direction: 'outbound',
          communication_type: 'counter_forwarded',
          recipient_email: claim.claimant_email,
          sent_at: new Date().toISOString(),
          sent_by: user.id,
        });

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Counter-notification forwarded to claimant.',
            waitingPeriodEnds: waitingPeriodEnds.toISOString(),
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } else if (action === 'restore') {
        // Restore content after waiting period
        await supabaseAdmin
          .from('dmca_claims')
          .update({
            status: 'restored',
            resolved_at: new Date().toISOString(),
          })
          .eq('id', claimId);

        // Restore content
        if (claim.content_type === 'video') {
          await supabaseAdmin
            .from('videos')
            .update({ moderation_status: 'approved' })
            .eq('id', claim.content_id);
        } else if (claim.content_type === 'listing') {
          await supabaseAdmin
            .from('marketplace_listings')
            .update({ status: 'active' })
            .eq('id', claim.content_id);
        }

        // Update DMCA status
        await supabaseAdmin
          .from('dmca_content_status')
          .update({
            status: 'restored',
            restored_at: new Date().toISOString(),
          })
          .eq('content_id', claim.content_id)
          .eq('content_type', claim.content_type);

        // Reverse strike
        await supabaseAdmin
          .from('dmca_strikes')
          .update({
            is_active: false,
            reversed: true,
            reversed_reason: 'counter_notification',
            reversed_at: new Date().toISOString(),
          })
          .eq('claim_id', claimId);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Content restored and strike reversed.',
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // CHECK CONTENT DMCA STATUS
    // ==========================================
    if (req.method === 'GET' && path === 'status') {
      const contentId = url.searchParams.get('contentId');
      const contentType = url.searchParams.get('contentType');

      if (!contentId || !contentType) {
        return new Response(
          JSON.stringify({ error: 'Content ID and type required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: status } = await supabaseAdmin
        .from('dmca_content_status')
        .select('*')
        .eq('content_id', contentId)
        .eq('content_type', contentType)
        .single();

      return new Response(
        JSON.stringify({
          hasDMCAClaim: !!status && status.status !== 'none',
          status: status?.status || 'none',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in DMCA function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
