import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Severity thresholds
const THRESHOLDS = {
  AI_DETECTION: {
    LIKELY_AUTHENTIC: 20,
    UNCERTAIN: 50,
    REQUIRE_DISCLOSURE: 75,
    BLOCK_REVIEW: 90,
  },
  CONTENT_SAFETY: {
    AUTO_APPROVE: 20,
    FLAG_REVIEW: 50,
    AUTO_REMOVE: 85,
  },
};

// Mock AI detection scores (would integrate with real services)
async function analyzeContentWithAI(videoUrl: string): Promise<{
  aiScore: number;
  violenceScore: number;
  hateSpeechScore: number;
  nsfwScore: number;
  confidence: number;
}> {
  // In production, this would call external APIs:
  // - Hive Moderation
  // - Sensity AI
  // - Microsoft Video Authenticator
  // - Google Cloud Video Intelligence

  // Mock response for development
  return {
    aiScore: Math.random() * 30, // Most content is real
    violenceScore: Math.random() * 15,
    hateSpeechScore: Math.random() * 10,
    nsfwScore: Math.random() * 20,
    confidence: 85 + Math.random() * 10,
  };
}

// Check against hash databases
async function checkHashDatabases(videoHash: string): Promise<{
  csamMatch: boolean;
  terrorismMatch: boolean;
  nciiMatch: boolean;
}> {
  // In production, would check:
  // - PhotoDNA (CSAM)
  // - GIFCT (Terrorism)
  // - StopNCII.org

  // For now, return no matches
  return {
    csamMatch: false,
    terrorismMatch: false,
    nciiMatch: false,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

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

    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(Boolean).pop();

    // ==========================================
    // SCAN VIDEO CONTENT
    // ==========================================
    if (req.method === 'POST' && path === 'scan') {
      const body = await req.json();
      const { videoId } = body;

      if (!videoId) {
        return new Response(
          JSON.stringify({ error: 'Video ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get video details
      const { data: video, error: videoError } = await supabaseClient
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single();

      if (videoError || !video) {
        return new Response(
          JSON.stringify({ error: 'Video not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Run AI analysis
      const startTime = Date.now();
      const analysis = await analyzeContentWithAI(video.video_url);
      const hashChecks = await checkHashDatabases(video.sha256_hash || '');
      const scanDuration = Date.now() - startTime;

      // Determine auto-decision
      let autoDecision = 'approved';
      let autoDecisionReason = 'Content passed automated checks';
      let humanReviewRequired = false;
      let humanReviewPriority = 'low';

      // Critical violations - immediate escalation
      if (hashChecks.csamMatch) {
        autoDecision = 'rejected';
        autoDecisionReason = 'CSAM hash match detected';
        humanReviewRequired = true;
        humanReviewPriority = 'critical';

        // Log for law enforcement reporting
        await supabaseClient.from('moderation_actions').insert({
          action_type: 'escalated',
          target_type: 'video',
          target_id: videoId,
          performed_by_system: true,
          details: { reason: 'CSAM hash match', immediate_action: 'removed' },
        });
      } else if (hashChecks.terrorismMatch) {
        autoDecision = 'rejected';
        autoDecisionReason = 'Terrorism content hash match';
        humanReviewRequired = true;
        humanReviewPriority = 'critical';
      } else if (hashChecks.nciiMatch) {
        autoDecision = 'rejected';
        autoDecisionReason = 'NCII hash match detected';
        humanReviewRequired = true;
        humanReviewPriority = 'critical';
      }
      // High severity content
      else if (
        analysis.violenceScore > THRESHOLDS.CONTENT_SAFETY.AUTO_REMOVE ||
        analysis.hateSpeechScore > THRESHOLDS.CONTENT_SAFETY.AUTO_REMOVE
      ) {
        autoDecision = 'rejected';
        autoDecisionReason = 'Content safety scores exceed threshold';
        humanReviewRequired = true;
        humanReviewPriority = 'high';
      }
      // Flagged for review
      else if (
        analysis.violenceScore > THRESHOLDS.CONTENT_SAFETY.FLAG_REVIEW ||
        analysis.hateSpeechScore > THRESHOLDS.CONTENT_SAFETY.FLAG_REVIEW ||
        analysis.aiScore > THRESHOLDS.AI_DETECTION.BLOCK_REVIEW
      ) {
        autoDecision = 'flagged';
        autoDecisionReason = 'Content flagged for human review';
        humanReviewRequired = true;
        humanReviewPriority = 'medium';
      }
      // AI detection requires disclosure
      else if (analysis.aiScore > THRESHOLDS.AI_DETECTION.REQUIRE_DISCLOSURE) {
        autoDecision = 'flagged';
        autoDecisionReason = 'High AI detection score - disclosure required';
        humanReviewRequired = true;
        humanReviewPriority = 'low';
      }

      // Store moderation results
      const { data: moderation, error: modError } = await supabaseClient
        .from('content_moderation')
        .upsert({
          video_id: videoId,
          ai_detection_score: analysis.aiScore,
          ai_detection_model: 'vidchain-analyzer-v1',
          ai_detection_confidence: analysis.confidence,
          violence_score: analysis.violenceScore,
          hate_speech_score: analysis.hateSpeechScore,
          nsfw_score: analysis.nsfwScore,
          csam_hash_match: hashChecks.csamMatch,
          terrorism_hash_match: hashChecks.terrorismMatch,
          ncii_hash_match: hashChecks.nciiMatch,
          auto_decision: autoDecision,
          auto_decision_reason: autoDecisionReason,
          human_review_required: humanReviewRequired,
          human_review_priority: humanReviewPriority,
          scan_duration_ms: scanDuration,
          models_version: '1.0.0',
        })
        .select()
        .single();

      if (modError) {
        console.error('Error storing moderation:', modError);
        return new Response(
          JSON.stringify({ error: 'Failed to store moderation results' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update video status
      const newStatus = autoDecision === 'approved' ? 'approved' :
                        autoDecision === 'rejected' ? 'removed' : 'under_review';

      await supabaseClient
        .from('videos')
        .update({ moderation_status: newStatus })
        .eq('id', videoId);

      // Log the scan action
      await supabaseClient.from('moderation_actions').insert({
        action_type: 'content_scanned',
        target_type: 'video',
        target_id: videoId,
        performed_by_system: true,
        details: {
          ai_score: analysis.aiScore,
          violence_score: analysis.violenceScore,
          decision: autoDecision,
          duration_ms: scanDuration,
        },
      });

      // Apply automatic labels if needed
      if (analysis.aiScore > THRESHOLDS.AI_DETECTION.UNCERTAIN) {
        await supabaseClient.from('content_labels').upsert({
          video_id: videoId,
          label_type: analysis.aiScore > THRESHOLDS.AI_DETECTION.REQUIRE_DISCLOSURE ? 'ai_generated' : 'likely_ai',
          label_source: 'auto',
          confidence: analysis.aiScore,
          display_warning: true,
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          moderation: {
            id: moderation.id,
            decision: autoDecision,
            reason: autoDecisionReason,
            scores: {
              ai: analysis.aiScore,
              violence: analysis.violenceScore,
              hateSpeech: analysis.hateSpeechScore,
              nsfw: analysis.nsfwScore,
            },
            requiresReview: humanReviewRequired,
            reviewPriority: humanReviewPriority,
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // SUBMIT AUTHENTICITY VOTE
    // ==========================================
    if (req.method === 'POST' && path === 'vote') {
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      const { videoId, vote, confidence, reasoning } = body;

      if (!videoId || !vote || !confidence) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!['authentic', 'ai_generated', 'uncertain', 'deepfake'].includes(vote)) {
        return new Response(
          JSON.stringify({ error: 'Invalid vote type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate vote weight based on user reputation
      const { data: weightResult } = await supabaseClient.rpc('calculate_vote_weight', {
        voter_user_id: user.id,
      });

      const voteWeight = weightResult || 1.0;

      // Upsert the vote
      const { data: voteData, error: voteError } = await supabaseClient
        .from('authenticity_votes')
        .upsert({
          video_id: videoId,
          user_id: user.id,
          vote,
          confidence,
          reasoning,
          vote_weight: voteWeight,
        })
        .select()
        .single();

      if (voteError) {
        console.error('Error submitting vote:', voteError);
        return new Response(
          JSON.stringify({ error: 'Failed to submit vote' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get updated consensus
      const { data: consensus } = await supabaseClient.rpc('get_authenticity_consensus', {
        target_video_id: videoId,
      });

      // Check if we should auto-apply labels based on consensus
      if (consensus && consensus.total_votes >= 5) {
        if (consensus.consensus === 'ai_generated' && consensus.confidence >= 70) {
          await supabaseClient.from('content_labels').upsert({
            video_id: videoId,
            label_type: 'ai_generated',
            label_source: 'community',
            confidence: consensus.confidence,
            display_warning: true,
          });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          vote: {
            id: voteData.id,
            weight: voteWeight,
          },
          consensus: consensus?.[0] || null,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // SUBMIT CONTENT REPORT
    // ==========================================
    if (req.method === 'POST' && path === 'report') {
      if (!user) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      const { contentId, contentType, category, subcategory, description, evidenceUrls } = body;

      if (!contentId || !contentType || !category) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get reporter's accuracy history
      const { data: reputation } = await supabaseClient
        .from('voter_reputation')
        .select('accuracy_rate')
        .eq('user_id', user.id)
        .single();

      const reporterAccuracy = reputation?.accuracy_rate || 50;

      // Check for existing report from this user on this content
      const { data: existingReport } = await supabaseClient
        .from('content_reports')
        .select('id')
        .eq('content_id', contentId)
        .eq('reporter_id', user.id)
        .single();

      if (existingReport) {
        return new Response(
          JSON.stringify({ error: 'You have already reported this content' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create report
      const { data: report, error: reportError } = await supabaseClient
        .from('content_reports')
        .insert({
          content_id: contentId,
          content_type: contentType,
          reporter_id: user.id,
          reporter_accuracy: reporterAccuracy,
          category,
          subcategory,
          description,
          evidence_urls: evidenceUrls || [],
        })
        .select()
        .single();

      if (reportError) {
        console.error('Error creating report:', reportError);
        return new Response(
          JSON.stringify({ error: 'Failed to submit report' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // For critical categories, immediately flag content
      if (['csam', 'terrorism', 'ncii'].includes(category)) {
        if (contentType === 'video') {
          await supabaseClient
            .from('videos')
            .update({ moderation_status: 'under_review' })
            .eq('id', contentId);
        }

        // Alert admins (in production, would send notification)
        await supabaseClient.from('moderation_actions').insert({
          action_type: 'content_flagged',
          target_type: contentType,
          target_id: contentId,
          performed_by: user.id,
          details: {
            category,
            priority: report.priority,
            report_id: report.id,
          },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          report: {
            id: report.id,
            priority: report.priority,
            status: report.status,
          },
          message: 'Report submitted successfully. Our team will review it shortly.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // GET MODERATION QUEUE (Admin only)
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

      const priority = url.searchParams.get('priority');
      const status = url.searchParams.get('status') || 'pending';
      const limit = parseInt(url.searchParams.get('limit') || '50');

      let query = supabaseClient
        .from('content_reports')
        .select(`
          *,
          reporter:users!reporter_id(id, email, display_name)
        `)
        .eq('status', status)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(limit);

      if (priority) {
        query = query.eq('priority', priority);
      }

      const { data: reports, error: queryError } = await query;

      if (queryError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch queue' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Also get pending moderation reviews
      const { data: moderationQueue } = await supabaseClient
        .from('content_moderation')
        .select(`
          *,
          video:videos(id, title, user_id, thumbnail_url)
        `)
        .eq('human_review_required', true)
        .eq('human_review_completed', false)
        .order('human_review_priority', { ascending: false })
        .limit(limit);

      return new Response(
        JSON.stringify({
          reports,
          moderationQueue,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // SUBMIT MODERATION DECISION (Admin only)
    // ==========================================
    if (req.method === 'POST' && path === 'decide') {
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
      const { contentId, contentType, decision, notes, labels, strikeUser } = body;

      if (!contentId || !decision) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update content moderation record
      if (contentType === 'video') {
        await supabaseClient
          .from('content_moderation')
          .update({
            human_review_completed: true,
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            review_decision: decision,
            review_notes: notes,
          })
          .eq('video_id', contentId);

        // Update video status
        const statusMap: Record<string, string> = {
          approved: 'approved',
          removed: 'removed',
          labeled: 'approved',
        };

        await supabaseClient
          .from('videos')
          .update({ moderation_status: statusMap[decision] || 'approved' })
          .eq('id', contentId);

        // Apply labels if provided
        if (labels && Array.isArray(labels)) {
          for (const label of labels) {
            await supabaseClient.from('content_labels').upsert({
              video_id: contentId,
              label_type: label,
              label_source: 'moderator',
              applied_by: user.id,
            });
          }
        }

        // Issue strike if requested
        if (strikeUser) {
          const { data: video } = await supabaseClient
            .from('videos')
            .select('user_id')
            .eq('id', contentId)
            .single();

          if (video) {
            // Get current strike count
            const { data: strikeCount } = await supabaseClient.rpc('get_active_strike_count', {
              target_user_id: video.user_id,
            });

            const newStrikeNumber = (strikeCount || 0) + 1;

            // Determine penalty based on strike count
            let penalty = 'warning';
            let penaltyExpires = null;

            if (newStrikeNumber >= 5) {
              penalty = 'permanent_ban';
            } else if (newStrikeNumber === 4) {
              penalty = 'suspended_30d';
              penaltyExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
            } else if (newStrikeNumber === 3) {
              penalty = 'suspended_7d';
              penaltyExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            } else if (newStrikeNumber === 2) {
              penalty = 'posting_restricted';
              penaltyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            }

            await supabaseClient.from('user_strikes').insert({
              user_id: video.user_id,
              strike_number: newStrikeNumber,
              reason: strikeUser.reason || 'tos_violation',
              severity: strikeUser.severity || 'moderate',
              content_id: contentId,
              content_type: 'video',
              penalty,
              penalty_expires_at: penaltyExpires,
              issued_by: user.id,
              notes,
            });
          }
        }
      }

      // Log the action
      await supabaseClient.from('moderation_actions').insert({
        action_type: decision === 'removed' ? 'content_removed' : 'content_approved',
        target_type: contentType,
        target_id: contentId,
        performed_by: user.id,
        details: { decision, labels, strikeIssued: !!strikeUser },
        notes,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Content ${decision} successfully`,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in content-moderation function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
