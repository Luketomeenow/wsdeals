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
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured, skipping email notification');
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { eod_id, user_email, user_name } = await req.json();

    if (!eod_id) {
      throw new Error('eod_id is required');
    }

    // Fetch EOD report details
    const { data: report } = await supabase
      .from('eod_reports')
      .select('*, user_profiles!inner(first_name, last_name, email)')
      .eq('id', eod_id)
      .single();

    if (!report) {
      throw new Error('Report not found');
    }

    const userName = user_name || `${report.user_profiles?.first_name} ${report.user_profiles?.last_name}`;
    const userEmail = user_email || report.user_profiles?.email;

    // Send email to admin/manager (configure recipient email in env)
    const adminEmail = Deno.env.get('EOD_ADMIN_EMAIL') || 'admin@stafflyhub.com';
    
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'StafflyHub EOD <noreply@stafflyhub.com>',
        to: [adminEmail],
        subject: `EOD Report Submitted - ${userName}`,
        html: `
          <h2>EOD Report Submitted</h2>
          <p><strong>${userName}</strong> (${userEmail}) has submitted their End of Day report.</p>
          <p><strong>Date:</strong> ${report.report_date}</p>
          <p><strong>Time:</strong> ${report.started_at ? new Date(report.started_at).toLocaleTimeString() : 'N/A'} - ${report.ended_at ? new Date(report.ended_at).toLocaleTimeString() : 'In Progress'}</p>
          ${report.summary ? `<p><strong>Summary:</strong><br/>${report.summary.replace(/\n/g, '<br/>')}</p>` : ''}
          <p><a href="${supabaseUrl.replace('supabase.co', 'stafflyhub.com')}/eod-dashboard">View Dashboard</a></p>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error('Resend API error:', errText);
      throw new Error(`Failed to send email: ${errText}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('EOD notify error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

