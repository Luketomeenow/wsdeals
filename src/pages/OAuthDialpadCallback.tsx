import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function OAuthDialpadCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const doExchange = async () => {
      const code = params.get('code');
      const state = params.get('state');
      const savedState = localStorage.getItem('dialpad_oauth_state');
      if (!code || !state || state !== savedState) {
        toast({ title: 'Invalid OAuth state', variant: 'destructive' });
        navigate('/');
        return;
      }
      try {
        const verifier = localStorage.getItem('dialpad_pkce_verifier');
        const { data, error } = await supabase.functions.invoke('dialpad-oauth-exchange', {
          body: { code, code_verifier: verifier },
        });
        if (error) throw error;
        toast({ title: 'Dialpad connected' });
      } catch (e: any) {
        toast({ title: 'Failed to connect Dialpad', description: e.message || 'Error', variant: 'destructive' });
      } finally {
        navigate('/');
      }
    };
    doExchange();
  }, [params, navigate, toast]);

  return <div className="flex items-center justify-center h-64">Connecting Dialpad...</div>;
}



