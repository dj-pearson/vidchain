// VidChain Photo Verification Edge Function
// Handles photo upload, verification, and analysis

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ethers } from 'https://esm.sh/ethers@6.9.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// VidChainNFT ABI for photo minting
const VIDCHAIN_NFT_ABI = [
  'function mintAuthenticated(bytes32 _sha256Hash, string memory _ipfsCid, address _royaltyReceiver, uint96 _royaltyFeeNumerator) external returns (uint256)',
  'function verifyByHash(bytes32 _sha256Hash) external view returns (uint256 tokenId, uint64 timestamp, address owner, bool exists)',
];

// Supported image types
const SUPPORTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/tiff',
  'image/bmp',
];

interface PhotoMetadata {
  cameraMake?: string;
  cameraModel?: string;
  lensMake?: string;
  lensModel?: string;
  focalLength?: number;
  aperture?: number;
  shutterSpeed?: string;
  iso?: number;
  flashFired?: boolean;
  captureTimestamp?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAltitude?: number;
  software?: string;
  copyright?: string;
  artist?: string;
}

// Parse EXIF data from image buffer
async function extractExifData(buffer: ArrayBuffer): Promise<PhotoMetadata> {
  const bytes = new Uint8Array(buffer);
  const metadata: PhotoMetadata = {};

  // Check for JPEG EXIF marker (0xFFD8 for JPEG, then look for APP1 marker 0xFFE1)
  if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
    let offset = 2;

    while (offset < bytes.length - 4) {
      if (bytes[offset] !== 0xFF) {
        offset++;
        continue;
      }

      const marker = bytes[offset + 1];

      // APP1 marker (EXIF)
      if (marker === 0xE1) {
        const length = (bytes[offset + 2] << 8) | bytes[offset + 3];

        // Check for "Exif\0\0" identifier
        if (
          bytes[offset + 4] === 0x45 && // E
          bytes[offset + 5] === 0x78 && // x
          bytes[offset + 6] === 0x69 && // i
          bytes[offset + 7] === 0x66 && // f
          bytes[offset + 8] === 0x00 &&
          bytes[offset + 9] === 0x00
        ) {
          // EXIF data found - in production, parse TIFF structure
          // This is a simplified parser
          console.log('EXIF data found at offset', offset);

          // For now, return empty metadata
          // A full implementation would parse the IFD structure
        }

        offset += 2 + length;
      } else if (marker === 0xDA) {
        // Start of scan - end of metadata
        break;
      } else {
        // Skip other markers
        const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
        offset += 2 + length;
      }
    }
  }

  return metadata;
}

// Calculate perceptual hash of image
async function calculatePerceptualHash(buffer: ArrayBuffer): Promise<{
  phash: string;
  dhash: string;
  ahash: string;
}> {
  // In production, this would use sharp or a similar library to:
  // 1. Resize image to 32x32 (for pHash) or 9x8 (for dHash)
  // 2. Convert to grayscale
  // 3. Apply DCT (for pHash) or compare adjacent pixels (for dHash)

  // For now, return placeholder hashes based on content
  const bytes = new Uint8Array(buffer);
  const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // Use parts of the SHA-256 as placeholder perceptual hashes
  const phash = hashArray.slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('');
  const dhash = hashArray.slice(8, 16).map((b) => b.toString(16).padStart(2, '0')).join('');
  const ahash = hashArray.slice(16, 24).map((b) => b.toString(16).padStart(2, '0')).join('');

  return { phash, dhash, ahash };
}

// Upload to IPFS via Pinata
async function uploadToIPFS(buffer: ArrayBuffer, filename: string): Promise<string | null> {
  const pinataJwt = Deno.env.get('PINATA_JWT');
  if (!pinataJwt) {
    console.error('PINATA_JWT not configured');
    return null;
  }

  try {
    const formData = new FormData();
    formData.append('file', new Blob([buffer]), filename);
    formData.append('pinataOptions', JSON.stringify({ cidVersion: 1 }));

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pinataJwt}`,
      },
      body: formData,
    });

    if (!response.ok) {
      console.error('Pinata upload failed:', await response.text());
      return null;
    }

    const result = await response.json();
    return result.IpfsHash;
  } catch (error) {
    console.error('IPFS upload error:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    const supabaseUserClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader || '' },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseUserClient.auth.getUser();

    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(Boolean).pop();

    // ==========================================
    // UPLOAD & VERIFY PHOTO
    // ==========================================
    if (req.method === 'POST' && (path === 'upload' || path === 'verify')) {
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const contentType = req.headers.get('content-type') || '';
      let photoBuffer: ArrayBuffer;
      let filename = 'photo.jpg';
      let mimeType = 'image/jpeg';
      let title = 'Untitled Photo';
      let description = '';
      let autoMint = false;

      if (contentType.includes('multipart/form-data')) {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
          return new Response(
            JSON.stringify({ error: 'No file uploaded' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!SUPPORTED_TYPES.includes(file.type)) {
          return new Response(
            JSON.stringify({ error: 'Unsupported image type', supported: SUPPORTED_TYPES }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        photoBuffer = await file.arrayBuffer();
        filename = file.name;
        mimeType = file.type;
        title = formData.get('title')?.toString() || file.name;
        description = formData.get('description')?.toString() || '';
        autoMint = formData.get('autoMint') === 'true';
      } else {
        // Raw binary upload
        photoBuffer = await req.arrayBuffer();
      }

      // Calculate SHA-256 hash
      const hashBuffer = await crypto.subtle.digest('SHA-256', photoBuffer);
      const sha256Hash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      // Check for existing verification
      const { data: existing } = await supabaseClient
        .from('photo_verifications')
        .select('id, token_id')
        .eq('sha256_hash', sha256Hash)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({
            error: 'Photo already verified',
            existingVerification: existing.id,
            tokenId: existing.token_id,
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Upload to Supabase Storage
      const storagePath = `photos/${user.id}/${Date.now()}_${filename}`;
      const { error: uploadError } = await supabaseClient.storage
        .from('media')
        .upload(storagePath, photoBuffer, {
          contentType: mimeType,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        return new Response(
          JSON.stringify({ error: 'Failed to upload photo' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Extract EXIF metadata
      const exifData = await extractExifData(photoBuffer);

      // Calculate perceptual hashes
      const perceptualHashes = await calculatePerceptualHash(photoBuffer);

      // Create photo record
      const { data: photo, error: photoError } = await supabaseClient
        .from('photos')
        .insert({
          user_id: user.id,
          title,
          description,
          file_path: storagePath,
          file_size: photoBuffer.byteLength,
          mime_type: mimeType,
          original_filename: filename,
          sha256_hash: sha256Hash,
          status: 'processing',
        })
        .select()
        .single();

      if (photoError) {
        console.error('Photo record error:', photoError);
        return new Response(
          JSON.stringify({ error: 'Failed to create photo record' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Store metadata
      if (Object.keys(exifData).length > 0) {
        await supabaseClient.from('photo_metadata').insert({
          photo_id: photo.id,
          camera_make: exifData.cameraMake,
          camera_model: exifData.cameraModel,
          lens_make: exifData.lensMake,
          lens_model: exifData.lensModel,
          focal_length: exifData.focalLength,
          aperture: exifData.aperture,
          shutter_speed: exifData.shutterSpeed,
          iso: exifData.iso,
          flash_fired: exifData.flashFired,
          capture_timestamp: exifData.captureTimestamp,
          gps_latitude: exifData.gpsLatitude,
          gps_longitude: exifData.gpsLongitude,
          gps_altitude: exifData.gpsAltitude,
          software: exifData.software,
          copyright: exifData.copyright,
          artist: exifData.artist,
          raw_exif: exifData,
        });
      }

      // Store perceptual hashes
      await supabaseClient.from('photo_perceptual_hashes').insert({
        photo_id: photo.id,
        phash: perceptualHashes.phash,
        dhash: perceptualHashes.dhash,
        ahash: perceptualHashes.ahash,
      });

      // Upload to IPFS
      const ipfsCid = await uploadToIPFS(photoBuffer, filename);

      // Create verification record
      const { data: verification, error: verificationError } = await supabaseClient
        .from('photo_verifications')
        .insert({
          photo_id: photo.id,
          user_id: user.id,
          sha256_hash: sha256Hash,
          ipfs_cid: ipfsCid,
          ipfs_url: ipfsCid ? `https://gateway.pinata.cloud/ipfs/${ipfsCid}` : null,
          status: ipfsCid ? 'verified' : 'pending',
        })
        .select()
        .single();

      if (verificationError) {
        console.error('Verification record error:', verificationError);
      }

      // Update photo status
      await supabaseClient
        .from('photos')
        .update({ status: 'verified' })
        .eq('id', photo.id);

      // Mint NFT if requested
      let mintResult = null;
      if (autoMint && ipfsCid) {
        try {
          const privateKey = Deno.env.get('MINTER_PRIVATE_KEY');
          const contractAddress = Deno.env.get('VIDCHAIN_CONTRACT_ADDRESS');
          const alchemyApiKey = Deno.env.get('ALCHEMY_API_KEY');

          if (privateKey && contractAddress && alchemyApiKey) {
            const provider = new ethers.JsonRpcProvider(
              `https://polygon-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
            );
            const wallet = new ethers.Wallet(privateKey, provider);
            const contract = new ethers.Contract(contractAddress, VIDCHAIN_NFT_ABI, wallet);

            const tx = await contract.mintAuthenticated(
              '0x' + sha256Hash,
              ipfsCid,
              user.user_metadata?.wallet_address || wallet.address,
              500 // 5% royalty
            );

            const receipt = await tx.wait();

            // Get token ID from event
            const transferEvent = receipt.logs.find(
              (log: { topics: string[] }) =>
                log.topics[0] === ethers.id('Transfer(address,address,uint256)')
            );
            const tokenId = transferEvent
              ? parseInt(transferEvent.topics[3], 16).toString()
              : null;

            mintResult = {
              transactionHash: receipt.hash,
              blockNumber: receipt.blockNumber,
              tokenId,
            };

            // Update verification with blockchain info
            if (verification) {
              await supabaseClient
                .from('photo_verifications')
                .update({
                  token_id: tokenId,
                  transaction_hash: receipt.hash,
                  block_number: receipt.blockNumber,
                  blockchain_timestamp: new Date().toISOString(),
                  contract_address: contractAddress,
                  status: 'minted',
                })
                .eq('id', verification.id);
            }
          }
        } catch (mintError) {
          console.error('Mint error:', mintError);
        }
      }

      // Check for duplicates
      const { data: similarPhotos } = await supabaseClient.rpc('find_similar_photos', {
        target_phash: perceptualHashes.phash,
        max_distance: 10,
        limit_count: 5,
      });

      return new Response(
        JSON.stringify({
          success: true,
          photo: {
            id: photo.id,
            title,
            sha256Hash,
            status: 'verified',
          },
          verification: verification
            ? {
                id: verification.id,
                ipfsCid,
                status: verification.status,
              }
            : null,
          mint: mintResult,
          similarPhotos: similarPhotos?.filter((p: { photo_id: string }) => p.photo_id !== photo.id) || [],
          metadata: exifData,
          perceptualHashes,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // GET PHOTO VERIFICATION
    // ==========================================
    if (req.method === 'GET') {
      const photoId = url.searchParams.get('photoId');
      const hash = url.searchParams.get('hash');

      let query = supabaseClient
        .from('photo_verifications')
        .select(`
          *,
          photo:photos(*),
          metadata:photo_metadata(*),
          hashes:photo_perceptual_hashes(*)
        `);

      if (photoId) {
        query = query.eq('photo_id', photoId);
      } else if (hash) {
        query = query.eq('sha256_hash', hash);
      } else {
        return new Response(
          JSON.stringify({ error: 'photoId or hash required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await query.single();

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: 'Verification not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Photo verification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
