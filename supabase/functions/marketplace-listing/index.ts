import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest, corsJsonResponse, corsErrorResponse } from "../_shared/cors.ts";

interface CreateListingRequest {
  nftId: string;
  listingType: 'fixed_price' | 'auction';
  price: string;
  currency: 'ETH' | 'MATIC' | 'VIDC';
  reservePrice?: string;
  duration?: number; // For auctions, in seconds
  acceptsOffers?: boolean;
}

interface UpdateListingRequest {
  listingId: string;
  action: 'update_price' | 'cancel';
  newPrice?: string;
}

serve(async (req) => {
  // Handle CORS preflight
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

    // Verify user is authenticated
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
      // Create new listing
      const body: CreateListingRequest = await req.json();

      // Validate request
      if (!body.nftId || !body.listingType || !body.price || !body.currency) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get user's wallet address
      const { data: userData, error: userError } = await supabaseClient
        .from('users')
        .select('wallet_address')
        .eq('id', user.id)
        .single();

      if (userError || !userData?.wallet_address) {
        return new Response(
          JSON.stringify({ error: 'Wallet not connected' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify user owns the NFT
      const { data: nft, error: nftError } = await supabaseClient
        .from('video_nfts')
        .select('*')
        .eq('id', body.nftId)
        .eq('current_owner_id', user.id)
        .single();

      if (nftError || !nft) {
        return new Response(
          JSON.stringify({ error: 'NFT not found or you are not the owner' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check for existing active listing
      const { data: existingListing } = await supabaseClient
        .from('marketplace_listings')
        .select('id')
        .eq('nft_id', body.nftId)
        .eq('status', 'active')
        .single();

      if (existingListing) {
        return new Response(
          JSON.stringify({ error: 'NFT already has an active listing' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate end time for auctions
      let endTime = null;
      if (body.listingType === 'auction') {
        if (!body.duration || body.duration < 3600) {
          return new Response(
            JSON.stringify({ error: 'Auction duration must be at least 1 hour' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        endTime = new Date(Date.now() + body.duration * 1000).toISOString();
      }

      // Create listing
      const { data: listing, error: listingError } = await supabaseClient
        .from('marketplace_listings')
        .insert({
          nft_id: body.nftId,
          seller_id: user.id,
          seller_address: userData.wallet_address,
          listing_type: body.listingType,
          payment_currency: body.currency,
          price: body.price,
          reserve_price: body.reservePrice || null,
          end_time: endTime,
          accepts_offers: body.acceptsOffers ?? true,
        })
        .select()
        .single();

      if (listingError) {
        console.error('Error creating listing:', listingError);
        return new Response(
          JSON.stringify({ error: 'Failed to create listing' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log transaction
      await supabaseClient.from('crypto_transactions').insert({
        user_id: user.id,
        wallet_address: userData.wallet_address,
        transaction_type: 'listing_created',
        currency: body.currency,
        amount: '0',
        nft_id: body.nftId,
        listing_id: listing.id,
        status: 'confirmed',
        metadata: { listingType: body.listingType, price: body.price },
      });

      return new Response(
        JSON.stringify({ success: true, listing }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST' && path === 'update') {
      // Update or cancel listing
      const body: UpdateListingRequest = await req.json();

      if (!body.listingId || !body.action) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify user owns the listing
      const { data: listing, error: listingError } = await supabaseClient
        .from('marketplace_listings')
        .select('*')
        .eq('id', body.listingId)
        .eq('seller_id', user.id)
        .eq('status', 'active')
        .single();

      if (listingError || !listing) {
        return new Response(
          JSON.stringify({ error: 'Listing not found or not owned by you' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (body.action === 'cancel') {
        // For auctions, check if there are bids
        if (listing.listing_type === 'auction') {
          const { data: bids } = await supabaseClient
            .from('auction_bids')
            .select('id')
            .eq('listing_id', body.listingId)
            .limit(1);

          if (bids && bids.length > 0) {
            return new Response(
              JSON.stringify({ error: 'Cannot cancel auction with existing bids' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        // Cancel listing
        const { error: updateError } = await supabaseClient
          .from('marketplace_listings')
          .update({ status: 'cancelled' })
          .eq('id', body.listingId);

        if (updateError) {
          return new Response(
            JSON.stringify({ error: 'Failed to cancel listing' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Listing cancelled' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (body.action === 'update_price') {
        if (!body.newPrice || listing.listing_type !== 'fixed_price') {
          return new Response(
            JSON.stringify({ error: 'Invalid price update request' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error: updateError } = await supabaseClient
          .from('marketplace_listings')
          .update({ price: body.newPrice })
          .eq('id', body.listingId);

        if (updateError) {
          return new Response(
            JSON.stringify({ error: 'Failed to update price' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Price updated' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (req.method === 'GET') {
      // Get listings with optional filters
      const status = url.searchParams.get('status') || 'active';
      const type = url.searchParams.get('type');
      const seller = url.searchParams.get('seller');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      let query = supabaseClient
        .from('marketplace_listings')
        .select(`
          *,
          nft:video_nfts(
            id,
            token_id,
            sha256_hash,
            original_creator_id,
            current_owner_address,
            video:videos(id, title, thumbnail_url, duration)
          ),
          seller:users(id, full_name, avatar_url, wallet_address)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (type) {
        query = query.eq('listing_type', type);
      }

      if (seller) {
        query = query.eq('seller_id', seller);
      }

      const { data: listings, error: queryError } = await query;

      if (queryError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch listings' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ listings }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in marketplace-listing function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
