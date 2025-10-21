import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Phone, X, Minimize2, Maximize2, Loader2 } from "lucide-react";

interface DialpadEmbeddedDialerProps {
  phoneNumber?: string;
  fromNumber?: string;
  contactId?: string;
  dealId?: string;
  onClose?: () => void;
}

/**
 * Dialpad Embedded Dialer Component
 * 
 * This component uses Dialpad's web-based calling through their official app.
 * It embeds the Dialpad web interface directly in your application.
 */
export function DialpadEmbeddedDialer({ 
  phoneNumber,
  fromNumber,
  contactId, 
  dealId, 
  onClose 
}: DialpadEmbeddedDialerProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dialpadUrl, setDialpadUrl] = useState<string>("");
  const [accessToken, setAccessToken] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    initializeDialer();
  }, [phoneNumber, fromNumber]);

  const initializeDialer = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to make calls",
          variant: "destructive",
        });
        onClose?.();
        return;
      }

      // Check for Dialpad token
      const { data: tokenData } = await (supabase as any)
        .from('dialpad_tokens')
        .select('access_token, expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!tokenData || !tokenData.access_token) {
        toast({
          title: "Dialpad Not Connected",
          description: "Please connect your Dialpad account first",
          variant: "destructive",
        });
        onClose?.();
        return;
      }

      // Check token validity
      const expiresAt = new Date(tokenData.expires_at);
      if (expiresAt <= new Date()) {
        toast({
          title: "Token Expired",
          description: "Please reconnect your Dialpad account",
          variant: "destructive",
        });
        onClose?.();
        return;
      }

      // Store access token
      setAccessToken(tokenData.access_token);

      // Build Dialpad URL with BOTH to and from numbers in the URL
      // This keeps everything in the browser without triggering desktop app
      let url = 'https://dialpad.com/app/calls';
      if (phoneNumber) {
        // Include both to and from parameters
        url = `https://dialpad.com/app/calls/new?to=${encodeURIComponent(phoneNumber)}`;
        if (fromNumber) {
          url += `&from=${encodeURIComponent(fromNumber)}`;
        }
      }
      
      console.log('Loading Dialpad with URL:', url);
      console.log('From number:', fromNumber);
      
      setDialpadUrl(url);
      
      // Log call initiation
      await logCallInitiation();
      
      toast({
        title: "Dialpad Loading",
        description: fromNumber ? `Using ${fromNumber}` : "Preparing call...",
      });
      
      setTimeout(() => setIsLoading(false), 2000);
    } catch (error) {
      console.error('Error initializing Dialpad:', error);
      toast({
        title: "Error",
        description: "Failed to initialize dialer",
        variant: "destructive",
      });
      onClose?.();
    }
  };

  const logCallInitiation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('calls').insert({
        outbound_type: 'outbound call',
        call_outcome: 'introduction',
        call_direction: 'outbound',
        caller_number: fromNumber || null,
        callee_number: phoneNumber || null,
        call_status: 'initiated',
        call_timestamp: new Date().toISOString(),
        rep_id: user.id,
        related_contact_id: contactId || null,
        related_deal_id: dealId || null,
      } as any);
    } catch (error) {
      console.error('Error logging call initiation:', error);
    }
  };

  if (!dialpadUrl) return null;

  return (
    <div 
      className={`fixed ${
        isMinimized 
          ? 'bottom-4 right-4 w-80 h-20' 
          : 'inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm'
      }`}
    >
      <Card 
        className={`${
          isMinimized 
            ? 'w-80 h-20' 
            : 'w-full max-w-2xl h-[80vh]'
        } shadow-2xl border-2 transition-all duration-300 ease-in-out`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-primary to-primary/80">
          <div className="flex items-center gap-2 text-white">
            <Phone className="h-5 w-5" />
            <div className="flex flex-col">
              <span className="font-semibold">
                {isMinimized 
                  ? 'Dialpad Call' 
                  : phoneNumber 
                    ? `Calling ${phoneNumber}` 
                    : 'Dialpad'
                }
              </span>
              {!isMinimized && fromNumber && (
                <span className="text-xs opacity-90">
                  From: {fromNumber}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Dialer Content */}
        {!isMinimized && (
          <div className="relative h-[calc(100%-60px)] bg-muted/30">
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/95 z-10">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">Connecting to Dialpad...</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {phoneNumber && `Preparing to call ${phoneNumber}`}
                </p>
              </div>
            )}
            
            <iframe
              src={dialpadUrl}
              className="w-full h-full border-0 rounded-b-lg"
              title="Dialpad Dialer"
              allow="microphone; camera; autoplay; clipboard-read; clipboard-write; display-capture"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-popups-to-escape-sandbox"
              onLoad={() => setIsLoading(false)}
            />
          </div>
        )}

        {isMinimized && (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Call in progress...
          </div>
        )}
      </Card>
    </div>
  );
}

