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
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { call_id } = await req.json();

    console.log('Summarizing call:', call_id);

    // Fetch the call record with transcript
    const { data: call, error: callError } = await supabase
      .from('calls')
      .select('*, deals(*), contacts(*)')
      .eq('id', call_id)
      .single();

    if (callError || !call) {
      throw new Error(`Call not found: ${callError?.message}`);
    }

    if (!call.transcript) {
      console.log('No transcript available for call:', call_id);
      return new Response(
        JSON.stringify({ message: 'No transcript available' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate AI summary using OpenAI
    console.log('Generating AI summary...');
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a sales call analyst. Summarize call transcripts professionally, highlighting key points, decisions, next steps, and any concerns. Keep summaries concise but informative (3-5 sentences).'
          },
          {
            role: 'user',
            content: `Summarize this sales call transcript:\n\n${call.transcript}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`Failed to generate summary: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices[0].message.content;

    console.log('Generated summary:', summary);

    // Save summary as a note
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .insert({
        deal_id: call.related_deal_id,
        contact_id: call.related_contact_id,
        company_id: call.related_company_id,
        content: `📞 **Call Summary** (${new Date(call.call_timestamp).toLocaleString()})\n\n${summary}`,
        note_type: 'ai_summary',
        source_call_id: call_id,
      })
      .select()
      .single();

    if (noteError) {
      console.error('Error saving note:', noteError);
      throw noteError;
    }

    console.log('Summary saved as note:', note.id);

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        note_id: note.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Summarize call error:', error);
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
