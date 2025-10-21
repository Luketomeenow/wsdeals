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
    const dialpadApiKey = Deno.env.get('DIALPAD_API_KEY');
    if (!dialpadApiKey) {
      throw new Error('DIALPAD_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { to_number, message, contact_id, deal_id, company_id } = await req.json();

    if (!to_number || !message) {
      throw new Error('to_number and message are required');
    }

    console.log('Sending SMS to:', to_number);

    // Send SMS via Dialpad API
    const dialpadResponse = await fetch('https://dialpad.com/api/v2/sms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dialpadApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: to_number,
        text: message,
      }),
    });

    if (!dialpadResponse.ok) {
      const errorText = await dialpadResponse.text();
      console.error('Dialpad API error:', errorText);
      throw new Error(`Failed to send SMS: ${dialpadResponse.status} - ${errorText}`);
    }

    const smsData = await dialpadResponse.json();
    console.log('SMS sent:', smsData);

    // Store SMS in database
    const { error: dbError } = await supabase
      .from('sms_messages')
      .insert([{
        dialpad_message_id: smsData.id,
        contact_id,
        deal_id,
        company_id,
        direction: 'outbound',
        from_number: smsData.from || 'CRM',
        to_number,
        message_body: message,
        status: 'sent',
        sent_at: new Date().toISOString(),
        metadata: smsData,
      }]);

    if (dbError) {
      console.error('Error storing SMS:', dbError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message_id: smsData.id,
        sms: smsData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Send SMS error:', error);
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
