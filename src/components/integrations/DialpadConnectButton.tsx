import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

function base64UrlEncode(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generatePKCE() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const verifier = base64UrlEncode(array.buffer); // Pass the underlying ArrayBuffer
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const challenge = base64UrlEncode(digest);
  return { verifier, challenge };
}

export function DialpadConnectButton() {
  const { toast } = useToast();
  const onClick = async () => {
    const clientId = (window as any).env?.DIALPAD_CLIENT_ID || import.meta.env.VITE_DIALPAD_CLIENT_ID;
    const redirectUri = (window as any).env?.DIALPAD_REDIRECT_URL || import.meta.env.VITE_DIALPAD_REDIRECT_URL;

    if (!clientId) {
      toast({ title: 'Missing Dialpad Client ID', description: 'Set VITE_DIALPAD_CLIENT_ID in your env and rebuild.', variant: 'destructive' });
      return;
    }
    if (!redirectUri) {
      toast({ title: 'Missing Dialpad Redirect URL', description: 'Set VITE_DIALPAD_REDIRECT_URL to your /oauth/dialpad/callback URL.', variant: 'destructive' });
      return;
    }

    const { verifier, challenge } = await generatePKCE();
    const state = crypto.randomUUID();
    localStorage.setItem('dialpad_pkce_verifier', verifier);
    localStorage.setItem('dialpad_oauth_state', state);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'calls:write users:read',
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });

    window.location.href = `https://dialpad.com/oauth2/authorize?${params.toString()}`;
  };

  return <Button onClick={onClick}>Connect Dialpad</Button>;
}



