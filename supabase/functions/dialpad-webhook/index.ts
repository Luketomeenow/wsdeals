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

    const webhookData = await req.json();
    console.log('Received Dialpad webhook:', JSON.stringify(webhookData, null, 2));

    // Store webhook for processing
    const { data: webhook, error: webhookError } = await supabase
      .from('dialpad_webhooks')
      .insert([{
        event_type: webhookData.type || 'unknown',
        event_id: webhookData.id || crypto.randomUUID(),
        payload: webhookData,
      }])
      .select()
      .single();

    if (webhookError) {
      console.error('Error storing webhook:', webhookError);
      throw webhookError;
    }

    // Process webhook based on event type
    if (webhookData.type === 'call.ended' || webhookData.type === 'call.completed') {
      const callData = webhookData.data || webhookData.call;
      
      if (callData) {
        const callRecord = {
          dialpad_call_id: callData.id,
          call_direction: callData.direction,
          duration_seconds: Math.floor(callData.duration / 1000),
          caller_number: callData.from_number,
          callee_number: callData.to_number,
          call_status: callData.state || 'completed',
          recording_url: callData.recording_url,
          transcript: callData.transcript,
          dialpad_contact_id: callData.contact_id,
          call_timestamp: callData.started_at || new Date().toISOString(),
          outbound_type: callData.direction === 'outbound' ? 'cold call' : 'inbound',
          call_outcome: callData.state === 'completed' ? 'answered' : 'no answer',
          dialpad_metadata: callData,
        };

        // Check if call exists
        const { data: existing } = await supabase
          .from('calls')
          .select('id')
          .eq('dialpad_call_id', callData.id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('calls')
            .update(callRecord)
            .eq('id', existing.id);
        } else {
          await supabase
            .from('calls')
            .insert([callRecord]);
        }

        // Get the call ID from inserted/updated record
        const { data: fetchedCall } = await supabase
          .from('calls')
          .select('id')
          .eq('dialpad_call_id', callData.id)
          .single();

        // Mark webhook as processed
        await supabase
          .from('dialpad_webhooks')
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq('id', webhook.id);

        // Trigger call analysis and summarization if transcript is available
        if (callData.transcript && fetchedCall) {
          console.log('Triggering call analysis and summarization for call:', fetchedCall.id);
          
          // Trigger analysis (don't await - run in background)
          supabase.functions.invoke('dialpad-analyze-call', {
            body: { call_id: fetchedCall.id }
          }).catch(err => console.error('Analysis trigger error:', err));

          // Trigger summarization (don't await - run in background)
          supabase.functions.invoke('dialpad-summarize-call', {
            body: { call_id: fetchedCall.id }
          }).catch(err => console.error('Summarization trigger error:', err));
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, webhook_id: webhook.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Webhook processing error:', error);
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