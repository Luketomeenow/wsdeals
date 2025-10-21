import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DialpadCall {
  id: string;
  direction: 'inbound' | 'outbound';
  duration: number;
  from_number: string;
  to_number: string;
  state: string;
  recording_url?: string;
  transcript?: string;
  contact_id?: string;
  started_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const dialpadApiKey = Deno.env.get('DIALPAD_API_KEY');
    if (!dialpadApiKey) {
      throw new Error('DIALPAD_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch calls from Dialpad API
    const { start_time, end_time, limit = 100 } = await req.json();
    
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(start_time && { start_time }),
      ...(end_time && { end_time }),
    });

    console.log('Fetching calls from Dialpad API...');
    const dialpadResponse = await fetch(
      `https://dialpad.com/api/v2/calls?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${dialpadApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!dialpadResponse.ok) {
      const errorText = await dialpadResponse.text();
      console.error('Dialpad API error:', errorText);
      throw new Error(`Dialpad API error: ${dialpadResponse.status} - ${errorText}`);
    }

    const dialpadData = await dialpadResponse.json();
    const calls: DialpadCall[] = dialpadData.items || [];
    
    console.log(`Syncing ${calls.length} calls from Dialpad`);

    // Process and insert/update calls
    const processedCalls = [];
    for (const call of calls) {
      // Check if call already exists
      const { data: existing } = await supabase
        .from('calls')
        .select('id')
        .eq('dialpad_call_id', call.id)
        .maybeSingle();

      const callData = {
        dialpad_call_id: call.id,
        call_direction: call.direction,
        duration_seconds: Math.floor(call.duration / 1000),
        caller_number: call.from_number,
        callee_number: call.to_number,
        call_status: call.state,
        recording_url: call.recording_url,
        transcript: call.transcript,
        dialpad_contact_id: call.contact_id,
        call_timestamp: call.started_at,
        outbound_type: call.direction === 'outbound' ? 'cold call' : 'inbound',
        call_outcome: call.state === 'completed' ? 'answered' : 'no answer',
        dialpad_metadata: call,
      };

      if (existing) {
        const { error } = await supabase
          .from('calls')
          .update(callData)
          .eq('id', existing.id);
        
        if (error) {
          console.error('Error updating call:', error);
        } else {
          processedCalls.push({ ...callData, action: 'updated' });
        }
      } else {
        const { error } = await supabase
          .from('calls')
          .insert([callData]);
        
        if (error) {
          console.error('Error inserting call:', error);
        } else {
          processedCalls.push({ ...callData, action: 'created' });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced: processedCalls.length,
        total: calls.length,
        calls: processedCalls,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Sync error:', error);
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