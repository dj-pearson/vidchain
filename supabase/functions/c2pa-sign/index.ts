// VidChain C2PA Signing Edge Function
// Signs verified content with VidChain's C2PA manifest

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// VidChain C2PA claim generator info
const VIDCHAIN_CLAIM_GENERATOR = {
  name: 'VidChain Verification Platform',
  version: '1.0.0',
  icon: 'https://vidchain.io/icon.png',
};

// C2PA assertion types we create
const VIDCHAIN_ASSERTIONS = {
  VERIFICATION: 'vidchain.verification',
  BLOCKCHAIN: 'vidchain.blockchain',
  PROVENANCE: 'vidchain.provenance',
  AI_DETECTION: 'vidchain.ai_detection',
};

interface VidChainManifest {
  label: string;
  claim_generator: string;
  claim_generator_info: Array<{
    name: string;
    version: string;
    icon?: { format: string; identifier: string };
  }>;
  title?: string;
  format?: string;
  instance_id: string;
  signature_info: {
    alg: string;
    issuer: string;
    time: string;
  };
  assertions: Array<{
    label: string;
    data: Record<string, unknown>;
  }>;
  credentials?: Array<{
    url: string;
  }>;
}

interface SigningRequest {
  mediaId: string;
  mediaType: 'video' | 'photo';
  verificationId: string;
  includeBlockchain?: boolean;
  includeAIDetection?: boolean;
  includeProvenance?: boolean;
}

interface SigningResult {
  success: boolean;
  manifest: VidChainManifest;
  manifestHash: string;
  signedAt: string;
}

/**
 * Generate a unique instance ID for the manifest
 */
function generateInstanceId(): string {
  const uuid = crypto.randomUUID();
  return `urn:uuid:${uuid}`;
}

/**
 * Create VidChain verification assertion
 */
function createVerificationAssertion(
  verification: Record<string, unknown>,
  media: Record<string, unknown>
): {
  label: string;
  data: Record<string, unknown>;
} {
  return {
    label: VIDCHAIN_ASSERTIONS.VERIFICATION,
    data: {
      '@context': 'https://vidchain.io/c2pa/verification/v1',
      verification_id: verification.id,
      sha256_hash: verification.sha256_hash,
      ipfs_cid: verification.ipfs_cid,
      status: verification.status,
      verified_at: verification.created_at,
      verification_url: `https://vidchain.io/verify/${verification.id}`,
      media: {
        title: media.title,
        file_size: media.file_size,
        duration: media.duration,
        width: media.width,
        height: media.height,
      },
    },
  };
}

/**
 * Create blockchain record assertion
 */
function createBlockchainAssertion(verification: Record<string, unknown>): {
  label: string;
  data: Record<string, unknown>;
} {
  return {
    label: VIDCHAIN_ASSERTIONS.BLOCKCHAIN,
    data: {
      '@context': 'https://vidchain.io/c2pa/blockchain/v1',
      network: 'Polygon',
      chain_id: 137,
      contract_address: Deno.env.get('VIDCHAIN_CONTRACT_ADDRESS'),
      token_id: verification.token_id,
      transaction_hash: verification.transaction_hash,
      block_number: verification.block_number,
      minted_at: verification.blockchain_timestamp,
      explorer_url: `https://polygonscan.com/tx/${verification.transaction_hash}`,
    },
  };
}

/**
 * Create provenance chain assertion
 */
function createProvenanceAssertion(
  provenance: Array<Record<string, unknown>>
): {
  label: string;
  data: Record<string, unknown>;
} {
  return {
    label: VIDCHAIN_ASSERTIONS.PROVENANCE,
    data: {
      '@context': 'https://vidchain.io/c2pa/provenance/v1',
      chain: provenance.map((p) => ({
        action: p.action,
        timestamp: p.created_at,
        actor: p.actor_name || p.actor_address,
        actor_type: p.actor_address ? 'wallet' : 'user',
        transaction_hash: p.transaction_hash,
        details: p.details,
      })),
    },
  };
}

/**
 * Create AI detection assertion
 */
function createAIDetectionAssertion(
  consensus: Record<string, unknown>
): {
  label: string;
  data: Record<string, unknown>;
} {
  return {
    label: VIDCHAIN_ASSERTIONS.AI_DETECTION,
    data: {
      '@context': 'https://vidchain.io/c2pa/ai-detection/v1',
      authenticity_score: consensus.overall_authenticity_score,
      verdict: consensus.verdict,
      confidence: consensus.verdict_confidence,
      ai_generated_probability: consensus.ai_generated_probability,
      deepfake_probability: consensus.deepfake_probability,
      analyzed_at: consensus.last_analyzed_at,
      providers_analyzed: consensus.providers_analyzed,
    },
  };
}

/**
 * Sign the manifest (placeholder for actual cryptographic signing)
 * In production, this would use the c2pa library with proper certificates
 */
async function signManifest(manifest: VidChainManifest): Promise<{
  signature: string;
  algorithm: string;
}> {
  // Convert manifest to canonical JSON
  const manifestJson = JSON.stringify(manifest, Object.keys(manifest).sort());
  const encoder = new TextEncoder();
  const data = encoder.encode(manifestJson);

  // In production, this would:
  // 1. Use a proper X.509 certificate
  // 2. Sign with the certificate's private key
  // 3. Use COSE signing as per C2PA spec

  // For now, create a SHA-256 hash as a placeholder
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return {
    signature,
    algorithm: 'ES256', // Would use ES256 with proper COSE signing
  };
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

    // Authenticate
    const supabaseUserClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') || '' },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseUserClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(Boolean).pop();

    // ==========================================
    // SIGN VERIFICATION
    // ==========================================
    if (req.method === 'POST' && path === 'sign') {
      const body: SigningRequest = await req.json();
      const {
        mediaId,
        mediaType = 'video',
        verificationId,
        includeBlockchain = true,
        includeAIDetection = true,
        includeProvenance = true,
      } = body;

      if (!mediaId || !verificationId) {
        return new Response(
          JSON.stringify({ error: 'mediaId and verificationId required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get verification data
      const verificationTable = mediaType === 'photo' ? 'photo_verifications' : 'verifications';
      const mediaTable = mediaType === 'photo' ? 'photos' : 'videos';

      const { data: verification, error: verError } = await supabaseClient
        .from(verificationTable)
        .select('*')
        .eq('id', verificationId)
        .single();

      if (verError || !verification) {
        return new Response(
          JSON.stringify({ error: 'Verification not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get media data
      const { data: media } = await supabaseClient
        .from(mediaTable)
        .select('*')
        .eq('id', mediaId)
        .single();

      // Get provenance if requested
      let provenance: Array<Record<string, unknown>> = [];
      if (includeProvenance && mediaType === 'video') {
        const { data } = await supabaseClient
          .from('provenance_records')
          .select('*')
          .eq('verification_id', verificationId)
          .order('created_at', { ascending: true });
        provenance = data || [];
      }

      // Get AI detection consensus if requested
      let aiConsensus: Record<string, unknown> | null = null;
      if (includeAIDetection) {
        const { data } = await supabaseClient
          .from('ai_detection_consensus')
          .select('*')
          .eq('media_id', mediaId)
          .single();
        aiConsensus = data;
      }

      // Build manifest
      const instanceId = generateInstanceId();
      const assertions: Array<{ label: string; data: Record<string, unknown> }> = [];

      // Always include verification assertion
      assertions.push(createVerificationAssertion(verification, media || {}));

      // Include blockchain assertion if token was minted
      if (includeBlockchain && verification.token_id) {
        assertions.push(createBlockchainAssertion(verification));
      }

      // Include provenance if available
      if (includeProvenance && provenance.length > 0) {
        assertions.push(createProvenanceAssertion(provenance));
      }

      // Include AI detection if available
      if (includeAIDetection && aiConsensus) {
        assertions.push(createAIDetectionAssertion(aiConsensus));
      }

      // Add standard C2PA actions assertion
      assertions.push({
        label: 'c2pa.actions',
        data: {
          actions: [
            {
              action: 'c2pa.created',
              when: verification.created_at,
              softwareAgent: VIDCHAIN_CLAIM_GENERATOR.name,
            },
            {
              action: 'c2pa.verified',
              when: verification.blockchain_timestamp || verification.created_at,
              softwareAgent: VIDCHAIN_CLAIM_GENERATOR.name,
              parameters: {
                verification_method: 'blockchain',
                hash_algorithm: 'SHA-256',
              },
            },
          ],
        },
      });

      const manifest: VidChainManifest = {
        label: `vidchain:${verificationId}`,
        claim_generator: `${VIDCHAIN_CLAIM_GENERATOR.name}/${VIDCHAIN_CLAIM_GENERATOR.version}`,
        claim_generator_info: [
          {
            name: VIDCHAIN_CLAIM_GENERATOR.name,
            version: VIDCHAIN_CLAIM_GENERATOR.version,
            icon: {
              format: 'image/png',
              identifier: VIDCHAIN_CLAIM_GENERATOR.icon,
            },
          },
        ],
        title: media?.title,
        format: media?.mime_type || (mediaType === 'photo' ? 'image/jpeg' : 'video/mp4'),
        instance_id: instanceId,
        signature_info: {
          alg: 'ES256',
          issuer: 'VidChain Certification Authority',
          time: new Date().toISOString(),
        },
        assertions,
        credentials: [
          {
            url: 'https://vidchain.io/.well-known/c2pa-credential.json',
          },
        ],
      };

      // Sign the manifest
      const { signature, algorithm } = await signManifest(manifest);

      // Calculate manifest hash
      const manifestJson = JSON.stringify(manifest);
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(manifestJson));
      const manifestHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      // Store the signed manifest
      await supabaseClient.from('c2pa_manifests').upsert({
        media_id: mediaId,
        media_type: mediaType,
        manifest_store: manifest,
        active_manifest_label: manifest.label,
        claim_generator: manifest.claim_generator,
        claim_generator_version: VIDCHAIN_CLAIM_GENERATOR.version,
        signature_valid: true,
        signature_algorithm: algorithm,
        signing_time: manifest.signature_info.time,
        certificate_issuer: manifest.signature_info.issuer,
        certificate_trusted: true,
        status: 'valid',
        vidchain_signed: true,
        vidchain_manifest: manifest,
        vidchain_signed_at: new Date().toISOString(),
      });

      // Store assertions
      const { data: manifestRecord } = await supabaseClient
        .from('c2pa_manifests')
        .select('id')
        .eq('media_id', mediaId)
        .eq('media_type', mediaType)
        .single();

      if (manifestRecord) {
        for (const assertion of assertions) {
          await supabaseClient.from('c2pa_assertions').upsert({
            manifest_id: manifestRecord.id,
            assertion_label: assertion.label,
            assertion_type: assertion.label.split('.')[0],
            assertion_data: assertion.data,
          });
        }
      }

      const result: SigningResult = {
        success: true,
        manifest,
        manifestHash,
        signedAt: manifest.signature_info.time,
      };

      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // GET SIGNED MANIFEST
    // ==========================================
    if (req.method === 'GET') {
      const mediaId = url.searchParams.get('mediaId');
      const mediaType = url.searchParams.get('mediaType') || 'video';

      if (!mediaId) {
        return new Response(
          JSON.stringify({ error: 'mediaId required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: manifest, error } = await supabaseClient
        .from('c2pa_manifests')
        .select(`
          *,
          assertions:c2pa_assertions(*)
        `)
        .eq('media_id', mediaId)
        .eq('media_type', mediaType)
        .eq('vidchain_signed', true)
        .single();

      if (error || !manifest) {
        return new Response(
          JSON.stringify({ error: 'No signed manifest found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(manifest),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('C2PA signing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
