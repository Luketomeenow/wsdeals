import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Phone, PhoneOff, Minimize2, Maximize2, X } from "lucide-react";

interface DialpadWebDialerProps {
  phoneNumber?: string;
  contactId?: string;
  dealId?: string;
  onClose?: () => void;
}

export function DialpadWebDialer({ phoneNumber, contactId, dealId, onClose }: DialpadWebDialerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDialpadToken();
  }, []);

  useEffect(() => {
    if (accessToken && iframeRef.current) {
      setupMessageListener();
      initializeDialer();
    }
  }, [accessToken]);

  const loadDialpadToken = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to make calls",
          variant: "destructive",
        });
        return;
      }

      const { data: tokenData, error } = await (supabase as any)
        .from('dialpad_tokens')
        .select('access_token, expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (tokenData && tokenData.access_token) {
        const expiresAt = new Date(tokenData.expires_at);
        const now = new Date();
        
        if (expiresAt > now) {
          setAccessToken(tokenData.access_token);
        } else {
          toast({
            title: "Dialpad Token Expired",
            description: "Please reconnect your Dialpad account",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Dialpad Not Connected",
          description: "Please connect your Dialpad account in settings",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading Dialpad token:", error);
      toast({
        title: "Error",
        description: "Failed to load Dialpad connection",
        variant: "destructive",
      });
    }
  };

  const initializeDialer = () => {
    if (!iframeRef.current || !accessToken) return;

    // Send initialization message to the iframe
    setTimeout(() => {
      const iframe = iframeRef.current;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'dialpad.init',
          token: accessToken,
          phoneNumber: phoneNumber,
        }, 'https://dialpad.com');
      }
      setIsLoading(false);
    }, 2000);
  };

  const setupMessageListener = () => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from Dialpad
      if (!event.origin.includes('dialpad.com')) return;

      const { type, data } = event.data;
      console.log('Dialpad Web Dialer message:', type, data);

      switch (type) {
        case 'dialpad.ready':
          console.log('Dialpad dialer ready');
          if (phoneNumber) {
            // Auto-dial the number
            initiateCall(phoneNumber);
          }
          break;
        case 'dialpad.call.started':
          logCallToDatabase('started', data);
          toast({
            title: "Call Started",
            description: `Calling ${phoneNumber || 'number'}`,
          });
          break;
        case 'dialpad.call.ended':
          logCallToDatabase('ended', data);
          toast({
            title: "Call Ended",
            description: data?.duration ? `Duration: ${formatDuration(data.duration)}` : "Call completed",
          });
          break;
        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  };

  const initiateCall = (number: string) => {
    if (!iframeRef.current) return;
    
    iframeRef.current.contentWindow?.postMessage({
      type: 'dialpad.call',
      phoneNumber: number,
    }, 'https://dialpad.com');
  };

  const logCallToDatabase = async (status: 'started' | 'ended', callData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (status === 'started') {
        await supabase.from('calls').insert({
          outbound_type: 'outbound call',
          call_outcome: 'introduction',
          call_direction: 'outbound',
          callee_number: phoneNumber || callData?.to || null,
          call_status: 'in-progress',
          call_timestamp: new Date().toISOString(),
          rep_id: user.id,
          related_contact_id: contactId || null,
          related_deal_id: dealId || null,
        } as any);
      } else if (status === 'ended') {
        await supabase
          .from('calls')
          .update({
            call_status: 'completed',
            duration_seconds: callData?.duration || 0,
          })
          .eq('callee_number', phoneNumber)
          .eq('call_status', 'in-progress')
          .order('call_timestamp', { ascending: false })
          .limit(1);
      }
    } catch (error) {
      console.error('Error logging call:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!accessToken) {
    return null;
  }

  return (
    <div className={`fixed ${isMinimized ? 'bottom-4 right-4' : 'inset-0 z-50 flex items-center justify-center bg-black/50'}`}>
      <Card className={`${isMinimized ? 'w-64 h-16' : 'w-full max-w-md h-[600px]'} shadow-2xl transition-all duration-300`}>
        <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">
              {isMinimized ? 'Dialpad' : `Calling ${phoneNumber || '...'}`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <div className="relative h-[calc(100%-52px)]">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <div className="text-center space-y-2">
                  <Phone className="h-8 w-8 animate-pulse mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">Loading Dialpad...</p>
                </div>
              </div>
            )}
            <iframe
              ref={iframeRef}
              src="https://dialpad.com/app/calls"
              className="w-full h-full border-0"
              allow="microphone; camera; autoplay; clipboard-read; clipboard-write"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
            />
          </div>
        )}
      </Card>
    </div>
  );
}

