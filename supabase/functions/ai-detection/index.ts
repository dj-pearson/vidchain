// VidChain AI Detection Edge Function
// Integrates with multiple AI detection providers for deepfake and synthetic media detection

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreflightRequest, corsJsonResponse, corsErrorResponse } from "../_shared/cors.ts";

// AI Detection verdict types
type AIVerdict =
  | 'authentic'
  | 'likely_authentic'
  | 'uncertain'
  | 'likely_synthetic'
  | 'synthetic'
  | 'deepfake'
  | 'face_swap'
  | 'voice_clone';

interface AIDetectionResult {
  provider: string;
  aiGeneratedScore: number;
  deepfakeScore: number;
  faceSwapScore: number;
  voiceCloneScore: number;
  manipulationScore: number;
  confidence: number;
  verdict: AIVerdict;
  ganSignatureDetected: boolean;
  ganModelName: string | null;
  diffusionSignatureDetected: boolean;
  diffusionModelName: string | null;
  rawResponse: Record<string, unknown>;
  requestDurationMs: number;
}

interface AggregatedResult {
  overallAuthenticityScore: number;
  aiGeneratedProbability: number;
  deepfakeProbability: number;
  manipulationProbability: number;
  verdict: AIVerdict;
  verdictConfidence: number;
  providersAnalyzed: number;
  providersAgreed: number;
  recommendation: 'approve' | 'flag' | 'reject';
  requiresHumanReview: boolean;
  results: AIDetectionResult[];
}

// ==========================================
// HIVE AI INTEGRATION
// ==========================================
async function analyzeWithHiveAI(
  mediaUrl: string,
  mediaType: 'video' | 'photo'
): Promise<AIDetectionResult | null> {
  const apiKey = Deno.env.get('HIVE_API_KEY');
  if (!apiKey) {
    console.warn('HIVE_API_KEY not configured');
    return null;
  }

  const startTime = Date.now();

  try {
    const response = await fetch('https://api.thehive.ai/api/v2/task/sync', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: mediaUrl,
        models: {
          'ai_generated_media_detection': {},
          'deepfake_video': mediaType === 'video' ? {} : undefined,
          'deepfake_image': mediaType === 'photo' ? {} : undefined,
        },
      }),
    });

    if (!response.ok) {
      console.error('Hive AI request failed:', response.status);
      return null;
    }

    const data = await response.json();
    const requestDuration = Date.now() - startTime;

    // Parse Hive AI response
    const aiGenOutput = data.status?.[0]?.response?.output?.[0];
    const deepfakeOutput = data.status?.[1]?.response?.output?.[0];

    let aiGeneratedScore = 0;
    let deepfakeScore = 0;
    let confidence = 0;

    if (aiGenOutput?.classes) {
      const aiGenClass = aiGenOutput.classes.find(
        (c: { class: string }) => c.class === 'ai_generated'
      );
      aiGeneratedScore = (aiGenClass?.score || 0) * 100;
      confidence = Math.max(confidence, (aiGenClass?.score || 0) * 100);
    }

    if (deepfakeOutput?.classes) {
      const deepfakeClass = deepfakeOutput.classes.find(
        (c: { class: string }) => c.class === 'deepfake' || c.class === 'yes'
      );
      deepfakeScore = (deepfakeClass?.score || 0) * 100;
      confidence = Math.max(confidence, (deepfakeClass?.score || 0) * 100);
    }

    // Determine verdict
    let verdict: AIVerdict = 'authentic';
    const maxScore = Math.max(aiGeneratedScore, deepfakeScore);

    if (maxScore >= 80) verdict = deepfakeScore > aiGeneratedScore ? 'deepfake' : 'synthetic';
    else if (maxScore >= 60) verdict = 'likely_synthetic';
    else if (maxScore >= 40) verdict = 'uncertain';
    else if (maxScore >= 20) verdict = 'likely_authentic';

    return {
      provider: 'hive_ai',
      aiGeneratedScore,
      deepfakeScore,
      faceSwapScore: 0,
      voiceCloneScore: 0,
      manipulationScore: Math.max(aiGeneratedScore, deepfakeScore),
      confidence,
      verdict,
      ganSignatureDetected: false,
      ganModelName: null,
      diffusionSignatureDetected: aiGeneratedScore > 60,
      diffusionModelName: aiGeneratedScore > 60 ? 'detected' : null,
      rawResponse: data,
      requestDurationMs: requestDuration,
    };
  } catch (error) {
    console.error('Hive AI error:', error);
    return null;
  }
}

// ==========================================
// SENSITY AI INTEGRATION
// ==========================================
async function analyzeWithSensityAI(
  mediaUrl: string,
  mediaType: 'video' | 'photo'
): Promise<AIDetectionResult | null> {
  const apiKey = Deno.env.get('SENSITY_API_KEY');
  if (!apiKey) {
    console.warn('SENSITY_API_KEY not configured');
    return null;
  }

  const startTime = Date.now();

  try {
    const response = await fetch('https://api.sensity.ai/v1/detect', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: mediaUrl,
        detection_types: ['face_swap', 'deepfake', 'synthetic_media'],
      }),
    });

    if (!response.ok) {
      console.error('Sensity AI request failed:', response.status);
      return null;
    }

    const data = await response.json();
    const requestDuration = Date.now() - startTime;

    // Parse Sensity AI response
    const faceSwapScore = (data.detections?.face_swap?.probability || 0) * 100;
    const deepfakeScore = (data.detections?.deepfake?.probability || 0) * 100;
    const syntheticScore = (data.detections?.synthetic_media?.probability || 0) * 100;

    const maxScore = Math.max(faceSwapScore, deepfakeScore, syntheticScore);
    let verdict: AIVerdict = 'authentic';

    if (faceSwapScore >= 70) verdict = 'face_swap';
    else if (deepfakeScore >= 70) verdict = 'deepfake';
    else if (syntheticScore >= 70) verdict = 'synthetic';
    else if (maxScore >= 50) verdict = 'likely_synthetic';
    else if (maxScore >= 30) verdict = 'uncertain';
    else if (maxScore >= 15) verdict = 'likely_authentic';

    return {
      provider: 'sensity_ai',
      aiGeneratedScore: syntheticScore,
      deepfakeScore,
      faceSwapScore,
      voiceCloneScore: (data.detections?.voice_clone?.probability || 0) * 100,
      manipulationScore: maxScore,
      confidence: data.confidence ? data.confidence * 100 : maxScore,
      verdict,
      ganSignatureDetected: data.gan_detected || false,
      ganModelName: data.gan_model || null,
      diffusionSignatureDetected: data.diffusion_detected || false,
      diffusionModelName: data.diffusion_model || null,
      rawResponse: data,
      requestDurationMs: requestDuration,
    };
  } catch (error) {
    console.error('Sensity AI error:', error);
    return null;
  }
}

// ==========================================
// REALITY DEFENDER INTEGRATION
// ==========================================
async function analyzeWithRealityDefender(
  mediaUrl: string,
  mediaType: 'video' | 'photo'
): Promise<AIDetectionResult | null> {
  const apiKey = Deno.env.get('REALITY_DEFENDER_API_KEY');
  if (!apiKey) {
    console.warn('REALITY_DEFENDER_API_KEY not configured');
    return null;
  }

  const startTime = Date.now();

  try {
    // Reality Defender API
    const response = await fetch('https://api.realitydefender.com/v1/analyze', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        media_url: mediaUrl,
        media_type: mediaType,
        analysis_types: ['deepfake', 'gan', 'diffusion', 'manipulation'],
      }),
    });

    if (!response.ok) {
      console.error('Reality Defender request failed:', response.status);
      return null;
    }

    const data = await response.json();
    const requestDuration = Date.now() - startTime;

    // Parse Reality Defender response
    const deepfakeScore = (data.scores?.deepfake || 0) * 100;
    const ganScore = (data.scores?.gan || 0) * 100;
    const diffusionScore = (data.scores?.diffusion || 0) * 100;
    const manipulationScore = (data.scores?.manipulation || 0) * 100;

    const aiGeneratedScore = Math.max(ganScore, diffusionScore);
    const maxScore = Math.max(deepfakeScore, aiGeneratedScore, manipulationScore);

    let verdict: AIVerdict = 'authentic';
    if (deepfakeScore >= 75) verdict = 'deepfake';
    else if (aiGeneratedScore >= 75) verdict = 'synthetic';
    else if (maxScore >= 55) verdict = 'likely_synthetic';
    else if (maxScore >= 35) verdict = 'uncertain';
    else if (maxScore >= 15) verdict = 'likely_authentic';

    return {
      provider: 'reality_defender',
      aiGeneratedScore,
      deepfakeScore,
      faceSwapScore: (data.scores?.face_swap || 0) * 100,
      voiceCloneScore: (data.scores?.voice_clone || 0) * 100,
      manipulationScore,
      confidence: (data.confidence || 0.8) * 100,
      verdict,
      ganSignatureDetected: ganScore > 50,
      ganModelName: data.detected_models?.gan || null,
      diffusionSignatureDetected: diffusionScore > 50,
      diffusionModelName: data.detected_models?.diffusion || null,
      rawResponse: data,
      requestDurationMs: requestDuration,
    };
  } catch (error) {
    console.error('Reality Defender error:', error);
    return null;
  }
}

// ==========================================
// AGGREGATE RESULTS
// ==========================================
function aggregateResults(results: AIDetectionResult[]): AggregatedResult {
  if (results.length === 0) {
    return {
      overallAuthenticityScore: 50,
      aiGeneratedProbability: 0.5,
      deepfakeProbability: 0.5,
      manipulationProbability: 0.5,
      verdict: 'uncertain',
      verdictConfidence: 0,
      providersAnalyzed: 0,
      providersAgreed: 0,
      recommendation: 'flag',
      requiresHumanReview: true,
      results: [],
    };
  }

  // Calculate average scores
  const avgAiGenerated = results.reduce((sum, r) => sum + r.aiGeneratedScore, 0) / results.length;
  const avgDeepfake = results.reduce((sum, r) => sum + r.deepfakeScore, 0) / results.length;
  const avgManipulation = results.reduce((sum, r) => sum + r.manipulationScore, 0) / results.length;
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

  // Count verdict agreement
  const verdictCounts: Record<AIVerdict, number> = {
    authentic: 0,
    likely_authentic: 0,
    uncertain: 0,
    likely_synthetic: 0,
    synthetic: 0,
    deepfake: 0,
    face_swap: 0,
    voice_clone: 0,
  };

  for (const r of results) {
    verdictCounts[r.verdict]++;
  }

  // Find majority verdict
  let majorityVerdict: AIVerdict = 'uncertain';
  let maxCount = 0;
  for (const [verdict, count] of Object.entries(verdictCounts)) {
    if (count > maxCount) {
      maxCount = count;
      majorityVerdict = verdict as AIVerdict;
    }
  }

  // Calculate authenticity score (inverse of synthetic indicators)
  const overallAuthenticityScore = 100 - Math.max(avgAiGenerated, avgDeepfake, avgManipulation);

  // Determine recommendation
  let recommendation: 'approve' | 'flag' | 'reject' = 'approve';
  let requiresHumanReview = false;

  if (overallAuthenticityScore < 30) {
    recommendation = 'reject';
    requiresHumanReview = true;
  } else if (overallAuthenticityScore < 60) {
    recommendation = 'flag';
    requiresHumanReview = true;
  } else if (maxCount < results.length) {
    // Providers disagree
    recommendation = 'flag';
    requiresHumanReview = true;
  }

  return {
    overallAuthenticityScore,
    aiGeneratedProbability: avgAiGenerated / 100,
    deepfakeProbability: avgDeepfake / 100,
    manipulationProbability: avgManipulation / 100,
    verdict: majorityVerdict,
    verdictConfidence: avgConfidence,
    providersAnalyzed: results.length,
    providersAgreed: maxCount,
    recommendation,
    requiresHumanReview,
    results,
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
    // ANALYZE MEDIA
    // ==========================================
    if (req.method === 'POST' && path === 'analyze') {
      const body = await req.json();
      const { mediaId, mediaType = 'video', mediaUrl, providers } = body;

      if (!mediaId && !mediaUrl) {
        return new Response(
          JSON.stringify({ error: 'mediaId or mediaUrl required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get media URL if not provided
      let urlToAnalyze = mediaUrl;
      if (!urlToAnalyze && mediaId) {
        const table = mediaType === 'photo' ? 'photos' : 'videos';
        const { data: media } = await supabaseClient
          .from(table)
          .select('file_path')
          .eq('id', mediaId)
          .single();

        if (media?.file_path) {
          // Get signed URL for the media
          const { data: urlData } = await supabaseClient
            .storage
            .from('media')
            .createSignedUrl(media.file_path, 3600);

          urlToAnalyze = urlData?.signedUrl;
        }
      }

      if (!urlToAnalyze) {
        return new Response(
          JSON.stringify({ error: 'Could not get media URL' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Determine which providers to use
      const enabledProviders = providers || ['hive_ai', 'sensity_ai', 'reality_defender'];
      const results: AIDetectionResult[] = [];
      const analysisPromises: Promise<AIDetectionResult | null>[] = [];

      // Run analyses in parallel
      if (enabledProviders.includes('hive_ai')) {
        analysisPromises.push(analyzeWithHiveAI(urlToAnalyze, mediaType));
      }
      if (enabledProviders.includes('sensity_ai')) {
        analysisPromises.push(analyzeWithSensityAI(urlToAnalyze, mediaType));
      }
      if (enabledProviders.includes('reality_defender')) {
        analysisPromises.push(analyzeWithRealityDefender(urlToAnalyze, mediaType));
      }

      const analysisResults = await Promise.all(analysisPromises);

      // Filter out null results
      for (const result of analysisResults) {
        if (result) {
          results.push(result);

          // Store individual result
          if (mediaId) {
            await supabaseClient.from('ai_detection_results').insert({
              media_id: mediaId,
              media_type: mediaType,
              provider_name: result.provider,
              ai_generated_score: result.aiGeneratedScore,
              deepfake_score: result.deepfakeScore,
              face_swap_score: result.faceSwapScore,
              voice_clone_score: result.voiceCloneScore,
              manipulation_score: result.manipulationScore,
              confidence: result.confidence,
              verdict: result.verdict,
              gan_signature_detected: result.ganSignatureDetected,
              gan_model_name: result.ganModelName,
              diffusion_signature_detected: result.diffusionSignatureDetected,
              diffusion_model_name: result.diffusionModelName,
              raw_response: result.rawResponse,
              request_duration_ms: result.requestDurationMs,
            });
          }
        }
      }

      // Aggregate results
      const aggregated = aggregateResults(results);

      // Store consensus
      if (mediaId) {
        await supabaseClient.from('ai_detection_consensus').upsert({
          media_id: mediaId,
          media_type: mediaType,
          overall_authenticity_score: aggregated.overallAuthenticityScore,
          ai_generated_probability: aggregated.aiGeneratedProbability,
          deepfake_probability: aggregated.deepfakeProbability,
          manipulation_probability: aggregated.manipulationProbability,
          verdict: aggregated.verdict,
          verdict_confidence: aggregated.verdictConfidence,
          providers_analyzed: aggregated.providersAnalyzed,
          providers_agreed: aggregated.providersAgreed,
          recommendation: aggregated.recommendation,
          requires_human_review: aggregated.requiresHumanReview,
          last_analyzed_at: new Date().toISOString(),
        });

        // Update content moderation if exists
        await supabaseClient
          .from('content_moderation')
          .update({
            ai_detection_score: 100 - aggregated.overallAuthenticityScore,
            ai_detection_confidence: aggregated.verdictConfidence,
            deepfake_detected: aggregated.verdict === 'deepfake' || aggregated.deepfakeProbability > 0.7,
            manipulation_detected: aggregated.manipulationProbability > 0.5,
          })
          .eq('video_id', mediaId);
      }

      return new Response(
        JSON.stringify({
          success: true,
          mediaId,
          mediaType,
          ...aggregated,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // GET ANALYSIS RESULTS
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

      // Get consensus
      const { data: consensus } = await supabaseClient
        .from('ai_detection_consensus')
        .select('*')
        .eq('media_id', mediaId)
        .single();

      // Get individual results
      const { data: results } = await supabaseClient
        .from('ai_detection_results')
        .select('*')
        .eq('media_id', mediaId)
        .eq('media_type', mediaType)
        .order('analyzed_at', { ascending: false });

      if (!consensus && (!results || results.length === 0)) {
        return new Response(
          JSON.stringify({ error: 'No analysis found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          consensus,
          results,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('AI detection error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
