import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser } } = await supabase.auth.getUser(jwt);
    if (!requestingUser) throw new Error('Unauthorized');

    const { data: adminProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .single();

    if (adminProfile?.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Only admins can create EOD users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, first_name, last_name, password, role = 'eod_user' } = await req.json();

    if (!email || !first_name || !last_name) {
      throw new Error('Email, first_name, and last_name are required');
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: password || `${first_name.toLowerCase()}${Math.floor(Math.random() * 10000)}`,
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
      },
    });

    if (authError) throw authError;

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert([{
        user_id: authData.user.id,
        first_name,
        last_name,
        email,
        role,
        is_active: true,
      }]);

    if (profileError) {
      // Rollback: delete the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    // Send password reset email so user can set their own password
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://dealdashai.netlify.app/eod-login',
    });

    if (resetError) {
      console.error('Failed to send password reset email:', resetError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          first_name,
          last_name,
        },
        message: 'User created successfully. Password reset email sent.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Create EOD user error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

