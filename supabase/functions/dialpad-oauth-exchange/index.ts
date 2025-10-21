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
    const DIALPAD_CLIENT_ID = Deno.env.get('DIALPAD_CLIENT_ID')!;
    const DIALPAD_CLIENT_SECRET = Deno.env.get('DIALPAD_CLIENT_SECRET')!;
    const DIALPAD_REDIRECT_URL = Deno.env.get('DIALPAD_REDIRECT_URL')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) throw new Error('Unauthenticated');

    const { code, code_verifier } = await req.json();
    if (!code) throw new Error('code is required');

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: DIALPAD_REDIRECT_URL,
      client_id: DIALPAD_CLIENT_ID,
      client_secret: DIALPAD_CLIENT_SECRET,
      ...(code_verifier ? { code_verifier } : {}),
    });

    const tokenRes = await fetch('https://dialpad.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      return new Response(JSON.stringify({ error: 'Token exchange failed', details: errText }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const tokenJson = await tokenRes.json();
    const expiresAt = new Date(Date.now() + (tokenJson.expires_in || 3600) * 1000).toISOString();

    await supabase.from('dialpad_tokens').upsert({
      user_id: user.id,
      access_token: tokenJson.access_token,
      refresh_token: tokenJson.refresh_token,
      token_type: tokenJson.token_type,
      scope: tokenJson.scope,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});



