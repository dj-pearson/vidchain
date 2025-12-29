// VidChain C2PA Validation Edge Function
// Validates C2PA manifests in uploaded media files

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// C2PA assertion types
const C2PA_ASSERTION_TYPES = {
  ACTIONS: 'c2pa.actions',
  HASH_DATA: 'c2pa.hash.data',
  HASH_BMFF: 'c2pa.hash.bmff',
  INGREDIENT: 'c2pa.ingredient',
  THUMBNAIL: 'c2pa.thumbnail.claim.jpeg',
  EXIF: 'stds.exif',
  IPTC: 'stds.iptc',
  XMP: 'stds.xmp',
  SCHEMA_ORG: 'stds.schema-org.CreativeWork',
};

// C2PA action types
const C2PA_ACTIONS = {
  CREATED: 'c2pa.created',
  EDITED: 'c2pa.edited',
  CONVERTED: 'c2pa.converted',
  CROPPED: 'c2pa.cropped',
  RESIZED: 'c2pa.resized',
  TRANSCODED: 'c2pa.transcoded',
  COLOR_ADJUSTED: 'c2pa.color_adjusted',
  FILTERED: 'c2pa.filtered',
  PLACED: 'c2pa.placed',
  DRAWING: 'c2pa.drawing',
  AI_GENERATED: 'c2pa.ai_generated',
  AI_TRAINED: 'c2pa.ai_trained',
};

interface C2PAManifest {
  label: string;
  claim_generator: string;
  claim_generator_info?: {
    name: string;
    version: string;
  }[];
  title?: string;
  format?: string;
  instance_id?: string;
  signature_info?: {
    issuer?: string;
    cert_serial_number?: string;
    time?: string;
    alg?: string;
  };
  assertions?: C2PAAssertion[];
  ingredients?: C2PAIngredient[];
  redactions?: string[];
}

interface C2PAAssertion {
  label: string;
  data: Record<string, unknown>;
  kind?: string;
}

interface C2PAIngredient {
  title?: string;
  format?: string;
  document_id?: string;
  instance_id?: string;
  c2pa_manifest?: C2PAManifest;
  validation_status?: string;
  relationship?: string;
}

interface C2PAValidationResult {
  status: 'valid' | 'invalid' | 'no_manifest' | 'expired_certificate' | 'untrusted_signer' | 'tampered';
  manifest: C2PAManifest | null;
  assertions: C2PAAssertion[];
  ingredients: C2PAIngredient[];
  signatureValid: boolean;
  certificateInfo: {
    issuer: string | null;
    subject: string | null;
    validFrom: string | null;
    validTo: string | null;
    trusted: boolean;
  } | null;
  errors: string[];
  warnings: string[];
}

// Trusted C2PA signers (major camera manufacturers, software vendors)
const TRUSTED_SIGNERS = [
  'Adobe Inc.',
  'Microsoft Corporation',
  'Canon Inc.',
  'Nikon Corporation',
  'Sony Corporation',
  'Leica Camera AG',
  'Truepic Inc.',
  'Witness',
  'The New York Times',
  'BBC',
  'Associated Press',
  'VidChain',
];

// Parse C2PA manifest from binary data
// In production, this would use c2pa-node or c2pa-rs via WASM
async function parseC2PAManifest(mediaBuffer: ArrayBuffer): Promise<C2PAManifest | null> {
  const bytes = new Uint8Array(mediaBuffer);

  // Check for JUMBF box in various container formats
  // JUMBF signature for C2PA: 'jumb'
  const jumbfSignature = [0x6A, 0x75, 0x6D, 0x62]; // 'jumb'
  const c2paSignature = [0x63, 0x32, 0x70, 0x61]; // 'c2pa'

  let manifestFound = false;
  let manifestStart = -1;

  // Search for JUMBF box with c2pa content
  for (let i = 0; i < bytes.length - 8; i++) {
    if (
      bytes[i] === jumbfSignature[0] &&
      bytes[i + 1] === jumbfSignature[1] &&
      bytes[i + 2] === jumbfSignature[2] &&
      bytes[i + 3] === jumbfSignature[3]
    ) {
      // Check if it contains c2pa
      for (let j = i; j < Math.min(i + 100, bytes.length - 4); j++) {
        if (
          bytes[j] === c2paSignature[0] &&
          bytes[j + 1] === c2paSignature[1] &&
          bytes[j + 2] === c2paSignature[2] &&
          bytes[j + 3] === c2paSignature[3]
        ) {
          manifestFound = true;
          manifestStart = i;
          break;
        }
      }
    }
    if (manifestFound) break;
  }

  if (!manifestFound) {
    return null;
  }

  // In a real implementation, we would parse the CBOR-encoded manifest
  // For now, we'll return a placeholder indicating manifest was found
  // The actual parsing would use c2pa-node library

  console.log(`C2PA manifest found at offset ${manifestStart}`);

  // This is a stub - real implementation would parse the manifest
  // Using c2pa-node: const manifest = await c2pa.read(mediaBuffer);
  return null;
}

// Validate a C2PA manifest
async function validateC2PAManifest(
  manifest: C2PAManifest,
  mediaHash: string
): Promise<C2PAValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let signatureValid = false;
  let certificateTrusted = false;

  // Validate signature
  if (manifest.signature_info) {
    // In production, verify the signature against the manifest
    // This would use cryptographic verification
    signatureValid = true; // Stub

    // Check if signer is trusted
    if (manifest.signature_info.issuer) {
      certificateTrusted = TRUSTED_SIGNERS.some(
        (trusted) => manifest.signature_info?.issuer?.includes(trusted)
      );
      if (!certificateTrusted) {
        warnings.push(`Signer "${manifest.signature_info.issuer}" is not in trusted list`);
      }
    }

    // Check signature time
    if (manifest.signature_info.time) {
      const signTime = new Date(manifest.signature_info.time);
      const now = new Date();
      if (signTime > now) {
        errors.push('Signature time is in the future');
        signatureValid = false;
      }
    }
  } else {
    errors.push('No signature information found');
  }

  // Validate hash binding
  const hashAssertions = manifest.assertions?.filter(
    (a) => a.label === C2PA_ASSERTION_TYPES.HASH_DATA || a.label === C2PA_ASSERTION_TYPES.HASH_BMFF
  );

  if (!hashAssertions || hashAssertions.length === 0) {
    warnings.push('No hash binding assertions found');
  }

  // Check for AI-generated disclosure
  const actionAssertions = manifest.assertions?.filter(
    (a) => a.label === C2PA_ASSERTION_TYPES.ACTIONS
  );

  if (actionAssertions) {
    for (const action of actionAssertions) {
      const actions = (action.data as { actions?: Array<{ action: string }> }).actions || [];
      for (const a of actions) {
        if (a.action === C2PA_ACTIONS.AI_GENERATED) {
          warnings.push('Content is disclosed as AI-generated');
        }
      }
    }
  }

  // Determine status
  let status: C2PAValidationResult['status'] = 'valid';
  if (errors.length > 0) {
    if (errors.some((e) => e.includes('tampered') || e.includes('hash'))) {
      status = 'tampered';
    } else if (errors.some((e) => e.includes('signature'))) {
      status = 'invalid';
    } else if (errors.some((e) => e.includes('expired'))) {
      status = 'expired_certificate';
    } else {
      status = 'invalid';
    }
  } else if (!certificateTrusted) {
    status = 'untrusted_signer';
  }

  return {
    status,
    manifest,
    assertions: manifest.assertions || [],
    ingredients: manifest.ingredients || [],
    signatureValid,
    certificateInfo: manifest.signature_info
      ? {
          issuer: manifest.signature_info.issuer || null,
          subject: null,
          validFrom: null,
          validTo: null,
          trusted: certificateTrusted,
        }
      : null,
    errors,
    warnings,
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

    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(Boolean).pop();

    // ==========================================
    // VALIDATE C2PA MANIFEST
    // ==========================================
    if (req.method === 'POST' && path === 'validate') {
      const contentType = req.headers.get('content-type') || '';

      let mediaBuffer: ArrayBuffer;
      let mediaId: string | null = null;
      let mediaType: 'video' | 'photo' = 'video';

      if (contentType.includes('application/json')) {
        // Validate by media ID - fetch from storage
        const body = await req.json();
        mediaId = body.mediaId;
        mediaType = body.mediaType || 'video';

        if (!mediaId) {
          return new Response(
            JSON.stringify({ error: 'mediaId required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get media file path
        const table = mediaType === 'photo' ? 'photos' : 'videos';
        const { data: media, error: mediaError } = await supabaseClient
          .from(table)
          .select('file_path')
          .eq('id', mediaId)
          .single();

        if (mediaError || !media) {
          return new Response(
            JSON.stringify({ error: 'Media not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Download from storage
        const { data: fileData, error: downloadError } = await supabaseClient
          .storage
          .from('media')
          .download(media.file_path);

        if (downloadError || !fileData) {
          return new Response(
            JSON.stringify({ error: 'Failed to download media file' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        mediaBuffer = await fileData.arrayBuffer();
      } else {
        // Direct file upload
        mediaBuffer = await req.arrayBuffer();
      }

      // Parse C2PA manifest
      const manifest = await parseC2PAManifest(mediaBuffer);

      if (!manifest) {
        // No C2PA manifest found
        const result: C2PAValidationResult = {
          status: 'no_manifest',
          manifest: null,
          assertions: [],
          ingredients: [],
          signatureValid: false,
          certificateInfo: null,
          errors: [],
          warnings: ['No C2PA manifest found in media file'],
        };

        // Store result if we have a media ID
        if (mediaId) {
          await supabaseClient.from('c2pa_manifests').upsert({
            media_id: mediaId,
            media_type: mediaType,
            status: 'no_manifest',
            manifest_store: {},
            validation_errors: result.warnings,
          });
        }

        return new Response(
          JSON.stringify(result),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate media hash for validation
      const hashBuffer = await crypto.subtle.digest('SHA-256', mediaBuffer);
      const mediaHash = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

      // Validate the manifest
      const result = await validateC2PAManifest(manifest, mediaHash);

      // Store the result
      if (mediaId) {
        const { data: manifestRecord, error: insertError } = await supabaseClient
          .from('c2pa_manifests')
          .upsert({
            media_id: mediaId,
            media_type: mediaType,
            manifest_store: manifest,
            active_manifest_label: manifest.label,
            claim_generator: manifest.claim_generator,
            claim_generator_version: manifest.claim_generator_info?.[0]?.version,
            signature_valid: result.signatureValid,
            signature_algorithm: manifest.signature_info?.alg,
            signing_time: manifest.signature_info?.time,
            certificate_issuer: result.certificateInfo?.issuer,
            certificate_trusted: result.certificateInfo?.trusted,
            status: result.status,
            validation_errors: result.errors,
          })
          .select()
          .single();

        // Store assertions
        if (manifestRecord && result.assertions.length > 0) {
          const assertions = result.assertions.map((a) => ({
            manifest_id: manifestRecord.id,
            assertion_label: a.label,
            assertion_type: a.label.split('.')[0] + '.' + a.label.split('.')[1],
            assertion_data: a.data,
            action_type: a.label === C2PA_ASSERTION_TYPES.ACTIONS
              ? (a.data as { actions?: Array<{ action: string }> }).actions?.[0]?.action
              : null,
          }));

          await supabaseClient.from('c2pa_assertions').insert(assertions);
        }

        // Store ingredients
        if (manifestRecord && result.ingredients.length > 0) {
          const ingredients = result.ingredients.map((i) => ({
            manifest_id: manifestRecord.id,
            ingredient_hash: i.document_id,
            ingredient_type: i.format,
            ingredient_title: i.title,
            relationship: i.relationship,
          }));

          await supabaseClient.from('c2pa_ingredients').insert(ingredients);
        }
      }

      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // GET C2PA MANIFEST BY MEDIA ID
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
          assertions:c2pa_assertions(*),
          ingredients:c2pa_ingredients(*)
        `)
        .eq('media_id', mediaId)
        .eq('media_type', mediaType)
        .single();

      if (error || !manifest) {
        return new Response(
          JSON.stringify({ error: 'No C2PA manifest found' }),
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
    console.error('C2PA validation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
