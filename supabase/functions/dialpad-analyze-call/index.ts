import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { call_id } = await req.json();

    if (!call_id) {
      throw new Error('call_id is required');
    }

    // Fetch call with transcript
    const { data: call, error: callError } = await supabase
      .from('calls')
      .select('*')
      .eq('id', call_id)
      .single();

    if (callError || !call) {
      throw new Error('Call not found');
    }

    if (!call.transcript) {
      throw new Error('No transcript available for analysis');
    }

    console.log('Analyzing call:', call_id);

    // Simple sentiment analysis based on keywords
    const transcript = call.transcript.toLowerCase();
    const positiveWords = ['great', 'excellent', 'perfect', 'love', 'interested', 'definitely', 'yes', 'awesome'];
    const negativeWords = ['no', 'not', 'issue', 'problem', 'disappointed', 'cancel', 'difficult'];

    let sentimentScore = 0;
    positiveWords.forEach(word => {
      const matches = transcript.split(word).length - 1;
      sentimentScore += matches * 0.1;
    });
    negativeWords.forEach(word => {
      const matches = transcript.split(word).length - 1;
      sentimentScore -= matches * 0.1;
    });

    // Clamp to -1 to 1
    sentimentScore = Math.max(-1, Math.min(1, sentimentScore));

    const sentimentLabel = sentimentScore > 0.2 ? 'positive' : 
                          sentimentScore < -0.2 ? 'negative' : 'neutral';

    // Extract potential action items (sentences with "will", "should", "need to")
    const actionWords = ['will', 'should', 'need to', 'going to', 'plan to'];
    const sentences = call.transcript.split(/[.!?]+/);
    const actionItems = sentences.filter(s => 
      actionWords.some(word => s.toLowerCase().includes(word))
    ).map(s => s.trim()).filter(s => s.length > 10);

    // Extract key topics (common nouns/phrases)
    const keyTopics = ['pricing', 'timeline', 'features', 'integration', 'support', 'contract']
      .filter(topic => transcript.includes(topic));

    // Calculate call quality score (based on duration, sentiment, and interaction)
    const durationScore = Math.min(call.duration_seconds / 600 * 50, 50); // Max 50 points for 10 min+
    const sentimentPoints = (sentimentScore + 1) * 25; // 0-50 points
    const callQualityScore = Math.round(durationScore + sentimentPoints);

    // Store analytics
    const { data: analytics, error: analyticsError } = await supabase
      .from('call_analytics')
      .upsert([{
        call_id,
        sentiment_score: sentimentScore.toFixed(2),
        sentiment_label: sentimentLabel,
        key_topics: keyTopics,
        action_items: actionItems.slice(0, 5), // Top 5 action items
        call_quality_score: callQualityScore,
        talk_time_ratio: 0.5, // Default 50/50 - would need audio analysis for accurate ratio
      }], {
        onConflict: 'call_id'
      })
      .select()
      .single();

    if (analyticsError) {
      throw analyticsError;
    }

    // Auto-create an AI notes entry linked to the call's deal/contact/company
    try {
      // Find the deal/contact/company for this call if present
      const { data: callLinks } = await supabase
        .from('calls')
        .select('id, related_deal_id, related_contact_id, related_company_id')
        .eq('id', call_id)
        .maybeSingle();

      const summary = [
        `Sentiment: ${sentimentLabel} (${(Number(sentimentScore)*100).toFixed(0)}%)`,
        keyTopics.length ? `Topics: ${keyTopics.join(', ')}` : '',
        actionItems.length ? `Actions: ${actionItems.slice(0,5).join(' | ')}` : '',
        `Quality: ${callQualityScore}/100`,
      ].filter(Boolean).join('\n');

      await supabase.from('notes').insert([{
        deal_id: callLinks?.related_deal_id || null,
        contact_id: callLinks?.related_contact_id || null,
        company_id: callLinks?.related_company_id || null,
        content: `AI Call Summary\n${summary}`,
        note_type: 'ai_summary',
        source_call_id: call_id,
      }]);
    } catch (e) {
      console.error('AI note creation failed:', e);
    }

    return new Response(
      JSON.stringify({
        success: true,
        analytics,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Analyze call error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
