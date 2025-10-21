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
    const { to_number, from_number, contact_id, deal_id } = await req.json();

    // Optional default outbound caller ID (Dialpad verified number or user's default DID)
    const defaultFromNumber = Deno.env.get('DIALPAD_FROM_NUMBER');
    const outboundCallerId = from_number || defaultFromNumber || undefined;

    if (!to_number) {
      throw new Error('to_number is required');
    }

    console.log('Initiating call to:', to_number);

    // Resolve user and tokens
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(jwt);
    if (!user) throw new Error('Unauthenticated');

    // Fetch tokens
    const { data: token } = await supabase
      .from('dialpad_tokens')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!token) {
      return new Response(JSON.stringify({ error: 'Dialpad not connected for this user' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Refresh if expired
    let accessToken = token.access_token;
    const now = new Date();
    if (new Date(token.expires_at) <= now) {
      const clientId = Deno.env.get('DIALPAD_CLIENT_ID')!;
      const clientSecret = Deno.env.get('DIALPAD_CLIENT_SECRET')!;
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refresh_token,
        client_id: clientId,
        client_secret: clientSecret,
      });
      const refreshRes = await fetch('https://dialpad.com/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      if (!refreshRes.ok) {
        const errT = await refreshRes.text();
        return new Response(JSON.stringify({ error: 'Failed to refresh token', details: errT }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const json = await refreshRes.json();
      accessToken = json.access_token;
      const newExpires = new Date(Date.now() + (json.expires_in || 3600) * 1000).toISOString();
      await supabase.from('dialpad_tokens').update({ access_token: accessToken, refresh_token: json.refresh_token || token.refresh_token, expires_at: newExpires, updated_at: new Date().toISOString() }).eq('user_id', user.id);
    }

    // Single, authoritative approach: /v2/calls with to/from
    if (!outboundCallerId) {
      return new Response(
        JSON.stringify({
          error: 'Missing outbound caller ID',
          hint: 'Set DIALPAD_FROM_NUMBER secret or pass from_number matching a verified Dialpad caller ID',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const callsResponse = await fetch('https://dialpad.com/api/v2/calls', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
        to: to_number,
        from: outboundCallerId,
        external_id: deal_id || contact_id || undefined,
              }),
            });

    if (!callsResponse.ok) {
      const errorText = await callsResponse.text();
      console.error('Calls endpoint failed:', callsResponse.status, errorText);
      return new Response(
        JSON.stringify({
          error: 'Dialpad calls API error',
          status: callsResponse.status,
          details: errorText,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const callData = await callsResponse.json();

    // Success path continues below

    return new Response(
      JSON.stringify({
        success: true,
        call: callData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Make call error:', error);
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