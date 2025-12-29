import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest, corsJsonResponse, corsErrorResponse } from "../_shared/cors.ts";

// 1 VIDC per 10 MB
const VIDC_PER_10MB = 1;

interface UploadFeeRequest {
  videoId: string;
  fileSizeMB: number;
  paymentCurrency: 'VIDC' | 'ETH' | 'MATIC';
  transactionHash?: string;
}

interface FeeQuoteRequest {
  fileSizeMB: number;
}

serve(async (req) => {
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // Get fee quote without paying
    if (req.method === 'POST' && path === 'quote') {
      const body: FeeQuoteRequest = await req.json();

      if (!body.fileSizeMB || body.fileSizeMB <= 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid file size' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate VIDC fee (1 per 10 MB, rounded up)
      const vidcFee = Math.ceil(body.fileSizeMB / 10) * VIDC_PER_10MB;

      // Burn amount (50% of fee)
      const burnAmount = vidcFee * 0.5;
      const treasuryAmount = vidcFee - burnAmount;

      // Get current exchange rates (mock for now, would integrate with price oracle)
      const exchangeRates = {
        VIDC_USD: 0.10, // $0.10 per VIDC
        ETH_USD: 2450,
        MATIC_USD: 0.85,
      };

      const usdEquivalent = vidcFee * exchangeRates.VIDC_USD;
      const ethEquivalent = usdEquivalent / exchangeRates.ETH_USD;
      const maticEquivalent = usdEquivalent / exchangeRates.MATIC_USD;

      return new Response(
        JSON.stringify({
          fileSizeMB: body.fileSizeMB,
          fees: {
            VIDC: {
              amount: vidcFee.toString(),
              burnAmount: burnAmount.toString(),
              treasuryAmount: treasuryAmount.toString(),
            },
            ETH: {
              amount: ethEquivalent.toFixed(8),
              usdValue: usdEquivalent.toFixed(2),
            },
            MATIC: {
              amount: maticEquivalent.toFixed(4),
              usdValue: usdEquivalent.toFixed(2),
            },
          },
          exchangeRates,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Pay upload fee
    if (req.method === 'POST' && path === 'pay') {
      const body: UploadFeeRequest = await req.json();

      if (!body.videoId || !body.fileSizeMB || !body.paymentCurrency) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get user wallet
      const { data: userData } = await supabaseClient
        .from('users')
        .select('wallet_address')
        .eq('id', user.id)
        .single();

      if (!userData?.wallet_address) {
        return new Response(
          JSON.stringify({ error: 'Wallet not connected' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify video exists and belongs to user
      const { data: video, error: videoError } = await supabaseClient
        .from('videos')
        .select('*')
        .eq('id', body.videoId)
        .eq('user_id', user.id)
        .single();

      if (videoError || !video) {
        return new Response(
          JSON.stringify({ error: 'Video not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if already paid
      const { data: existingPayment } = await supabaseClient
        .from('upload_payments')
        .select('id')
        .eq('video_id', body.videoId)
        .eq('status', 'confirmed')
        .single();

      if (existingPayment) {
        return new Response(
          JSON.stringify({ error: 'Upload fee already paid' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate fee
      const vidcFee = Math.ceil(body.fileSizeMB / 10) * VIDC_PER_10MB;
      let feeAmount: string;
      let burnAmount = '0';
      let treasuryAmount: string;

      if (body.paymentCurrency === 'VIDC') {
        feeAmount = vidcFee.toString();
        burnAmount = (vidcFee * 0.5).toString();
        treasuryAmount = (vidcFee * 0.5).toString();

        // TODO: Verify VIDC balance on-chain and execute transfer/burn
        // For now, we'll just record the payment

      } else {
        // For ETH/MATIC, verify transaction hash
        if (!body.transactionHash) {
          return new Response(
            JSON.stringify({ error: 'Transaction hash required for crypto payments' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // TODO: Verify transaction on-chain
        // Check amount, recipient, confirmation status

        const exchangeRates = {
          VIDC_USD: 0.10,
          ETH_USD: 2450,
          MATIC_USD: 0.85,
        };

        const usdEquivalent = vidcFee * exchangeRates.VIDC_USD;

        if (body.paymentCurrency === 'ETH') {
          feeAmount = (usdEquivalent / exchangeRates.ETH_USD).toFixed(8);
        } else {
          feeAmount = (usdEquivalent / exchangeRates.MATIC_USD).toFixed(4);
        }

        treasuryAmount = feeAmount;
      }

      // Create payment record
      const { data: payment, error: paymentError } = await supabaseClient
        .from('upload_payments')
        .insert({
          user_id: user.id,
          video_id: body.videoId,
          file_size_mb: body.fileSizeMB,
          fee_amount: feeAmount,
          currency: body.paymentCurrency,
          burn_amount: burnAmount,
          treasury_amount: treasuryAmount,
          transaction_hash: body.transactionHash || null,
          status: 'confirmed',
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Error creating payment:', paymentError);
        return new Response(
          JSON.stringify({ error: 'Failed to record payment' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log transaction
      await supabaseClient.from('crypto_transactions').insert({
        user_id: user.id,
        wallet_address: userData.wallet_address,
        transaction_type: 'upload_fee',
        currency: body.paymentCurrency,
        amount: `-${feeAmount}`,
        video_id: body.videoId,
        transaction_hash: body.transactionHash,
        status: 'confirmed',
        metadata: {
          fileSizeMB: body.fileSizeMB,
          burnAmount,
          treasuryAmount,
        },
      });

      // Update video status to allow processing
      await supabaseClient
        .from('videos')
        .update({ status: 'processing' })
        .eq('id', body.videoId);

      return new Response(
        JSON.stringify({
          success: true,
          payment: {
            id: payment.id,
            amount: feeAmount,
            currency: body.paymentCurrency,
            burnAmount,
          },
          message: 'Upload fee paid successfully. Video is now processing.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's upload payment history
    if (req.method === 'GET') {
      const { data: payments, error: queryError } = await supabaseClient
        .from('upload_payments')
        .select(`
          *,
          video:videos(id, title, thumbnail_url, status)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (queryError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch payments' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ payments }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in upload-crypto function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
