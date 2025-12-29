import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest, corsJsonResponse, corsErrorResponse } from "../_shared/cors.ts";

interface CreateOfferRequest {
  nftId: string;
  amount: string;
  currency: 'ETH' | 'MATIC' | 'VIDC';
  duration: number; // In seconds
}

interface RespondOfferRequest {
  offerId: string;
  action: 'accept' | 'reject';
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

    if (req.method === 'POST' && path === 'create') {
      const body: CreateOfferRequest = await req.json();

      if (!body.nftId || !body.amount || !body.currency || !body.duration) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get user's wallet
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

      // Get NFT and current owner
      const { data: nft, error: nftError } = await supabaseClient
        .from('video_nfts')
        .select('*, current_owner:users(id, wallet_address)')
        .eq('id', body.nftId)
        .single();

      if (nftError || !nft) {
        return new Response(
          JSON.stringify({ error: 'NFT not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Can't offer on your own NFT
      if (nft.current_owner_id === user.id) {
        return new Response(
          JSON.stringify({ error: 'Cannot make offer on your own NFT' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check for existing active listing
      const { data: listing } = await supabaseClient
        .from('marketplace_listings')
        .select('id, accepts_offers, seller_id, seller_address')
        .eq('nft_id', body.nftId)
        .eq('status', 'active')
        .single();

      // If there's a listing, check if it accepts offers
      if (listing && !listing.accepts_offers) {
        return new Response(
          JSON.stringify({ error: 'This listing does not accept offers' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const expiresAt = new Date(Date.now() + body.duration * 1000).toISOString();

      // Create offer
      const { data: offer, error: offerError } = await supabaseClient
        .from('marketplace_offers')
        .insert({
          nft_id: body.nftId,
          listing_id: listing?.id || null,
          buyer_id: user.id,
          buyer_address: userData.wallet_address,
          seller_id: listing?.seller_id || nft.current_owner_id,
          seller_address: listing?.seller_address || nft.current_owner_address,
          amount: body.amount,
          currency: body.currency,
          expires_at: expiresAt,
          status: 'active',
        })
        .select()
        .single();

      if (offerError) {
        console.error('Error creating offer:', offerError);
        return new Response(
          JSON.stringify({ error: 'Failed to create offer' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log transaction
      await supabaseClient.from('crypto_transactions').insert({
        user_id: user.id,
        wallet_address: userData.wallet_address,
        transaction_type: 'offer_made',
        currency: body.currency,
        amount: body.amount,
        nft_id: body.nftId,
        status: 'pending',
        metadata: { offerId: offer.id },
      });

      // Update offer count on listing if exists
      if (listing) {
        await supabaseClient.rpc('increment_offer_count', { listing_id: listing.id });
      }

      return new Response(
        JSON.stringify({ success: true, offer }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST' && path === 'respond') {
      const body: RespondOfferRequest = await req.json();

      if (!body.offerId || !body.action) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get offer
      const { data: offer, error: offerError } = await supabaseClient
        .from('marketplace_offers')
        .select('*')
        .eq('id', body.offerId)
        .eq('status', 'active')
        .single();

      if (offerError || !offer) {
        return new Response(
          JSON.stringify({ error: 'Offer not found or no longer active' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user is the seller/owner
      if (offer.seller_id !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Not authorized to respond to this offer' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if offer has expired
      if (new Date(offer.expires_at) < new Date()) {
        await supabaseClient
          .from('marketplace_offers')
          .update({ status: 'expired' })
          .eq('id', body.offerId);

        return new Response(
          JSON.stringify({ error: 'Offer has expired' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (body.action === 'reject') {
        const { error: updateError } = await supabaseClient
          .from('marketplace_offers')
          .update({
            status: 'rejected',
            responded_at: new Date().toISOString(),
          })
          .eq('id', body.offerId);

        if (updateError) {
          return new Response(
            JSON.stringify({ error: 'Failed to reject offer' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Offer rejected' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (body.action === 'accept') {
        // TODO: This should trigger smart contract interaction
        // For now, we'll just update the database state

        // Get user wallet
        const { data: userData } = await supabaseClient
          .from('users')
          .select('wallet_address')
          .eq('id', user.id)
          .single();

        // Update offer status
        const { error: updateError } = await supabaseClient
          .from('marketplace_offers')
          .update({
            status: 'accepted',
            responded_at: new Date().toISOString(),
          })
          .eq('id', body.offerId);

        if (updateError) {
          return new Response(
            JSON.stringify({ error: 'Failed to accept offer' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Cancel any active listing for this NFT
        if (offer.listing_id) {
          await supabaseClient
            .from('marketplace_listings')
            .update({ status: 'sold' })
            .eq('id', offer.listing_id);
        }

        // Create sale record
        const platformFeeBps = 250; // 2.5%
        const royaltyBps = 500; // 5% default

        const salePrice = parseFloat(offer.amount);
        const platformFee = (salePrice * platformFeeBps) / 10000;
        const royaltyFee = (salePrice * royaltyBps) / 10000;
        const sellerProceeds = salePrice - platformFee - royaltyFee;

        await supabaseClient.from('marketplace_sales').insert({
          listing_id: offer.listing_id,
          offer_id: offer.id,
          nft_id: offer.nft_id,
          seller_id: offer.seller_id,
          seller_address: offer.seller_address,
          buyer_id: offer.buyer_id,
          buyer_address: offer.buyer_address,
          sale_price: offer.amount,
          currency: offer.currency,
          platform_fee: platformFee.toString(),
          royalty_fee: royaltyFee.toString(),
          seller_proceeds: sellerProceeds.toString(),
          transaction_hash: 'pending', // Will be updated after blockchain tx
        });

        // Update NFT ownership
        await supabaseClient
          .from('video_nfts')
          .update({
            current_owner_id: offer.buyer_id,
            current_owner_address: offer.buyer_address,
            last_sale_price: offer.amount,
            last_sale_currency: offer.currency,
            last_sale_at: new Date().toISOString(),
            total_sales: supabaseClient.rpc('increment', { x: 1 }),
          })
          .eq('id', offer.nft_id);

        // Log transactions
        await supabaseClient.from('crypto_transactions').insert([
          {
            user_id: offer.seller_id,
            wallet_address: offer.seller_address,
            transaction_type: 'offer_accepted',
            currency: offer.currency,
            amount: sellerProceeds.toString(),
            nft_id: offer.nft_id,
            status: 'confirmed',
          },
          {
            user_id: offer.buyer_id,
            wallet_address: offer.buyer_address,
            transaction_type: 'offer_accepted',
            currency: offer.currency,
            amount: `-${offer.amount}`,
            nft_id: offer.nft_id,
            status: 'confirmed',
          },
        ]);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Offer accepted',
            sale: {
              nftId: offer.nft_id,
              price: offer.amount,
              currency: offer.currency,
            },
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (req.method === 'POST' && path === 'cancel') {
      const { offerId } = await req.json();

      if (!offerId) {
        return new Response(
          JSON.stringify({ error: 'Missing offer ID' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get offer
      const { data: offer } = await supabaseClient
        .from('marketplace_offers')
        .select('*')
        .eq('id', offerId)
        .eq('buyer_id', user.id)
        .eq('status', 'active')
        .single();

      if (!offer) {
        return new Response(
          JSON.stringify({ error: 'Offer not found or cannot be cancelled' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error: updateError } = await supabaseClient
        .from('marketplace_offers')
        .update({ status: 'cancelled' })
        .eq('id', offerId);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: 'Failed to cancel offer' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Offer cancelled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET') {
      const nftId = url.searchParams.get('nftId');
      const userId = url.searchParams.get('userId') || user.id;
      const type = url.searchParams.get('type'); // 'made' or 'received'

      let query = supabaseClient
        .from('marketplace_offers')
        .select(`
          *,
          nft:video_nfts(
            id,
            token_id,
            video:videos(id, title, thumbnail_url)
          ),
          buyer:users!buyer_id(id, full_name, avatar_url),
          seller:users!seller_id(id, full_name, avatar_url)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (nftId) {
        query = query.eq('nft_id', nftId);
      }

      if (type === 'made') {
        query = query.eq('buyer_id', userId);
      } else if (type === 'received') {
        query = query.eq('seller_id', userId);
      }

      const { data: offers, error: queryError } = await query;

      if (queryError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch offers' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ offers }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in marketplace-offer function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
