import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, X, Minimize2, Maximize2, PhoneOff, Mic, MicOff, ExternalLink } from "lucide-react";

interface SimpleDialerProps {
  phoneNumber: string;
  fromNumber: string;
  contactId?: string;
  dealId?: string;
  onClose?: () => void;
}

/**
 * Simple In-Browser Dialer
 * 
 * This component provides a simple dialer that opens Dialpad's web app
 * in a NEW TAB (not iframe) to completely avoid desktop app triggers.
 * 
 * It logs the call intent and provides a clean UI, then opens Dialpad web
 * in a way that won't trigger the desktop protocol handler.
 */
export function SimpleDialer({ 
  phoneNumber,
  fromNumber,
  contactId, 
  dealId, 
  onClose 
}: SimpleDialerProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isDialpadOpen, setIsDialpadOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Log the call intent immediately
    logCallIntent();
    
    // Show instructions
    toast({
      title: "Opening Dialpad Web",
      description: "Click 'Open Dialpad Web' to make your call",
      duration: 5000,
    });
  }, []);

  useEffect(() => {
    // Track duration if call is active
    let interval: NodeJS.Timeout;
    if (isDialpadOpen) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isDialpadOpen]);

  const logCallIntent = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('calls').insert({
        outbound_type: 'outbound call',
        call_outcome: 'introduction',
        call_direction: 'outbound',
        caller_number: fromNumber,
        callee_number: phoneNumber,
        call_status: 'initiated',
        call_timestamp: new Date().toISOString(),
        rep_id: user.id,
        related_contact_id: contactId || null,
        related_deal_id: dealId || null,
        notes: 'Call initiated via web interface',
      } as any);
    } catch (error) {
      console.error('Error logging call:', error);
    }
  };

  const openDialpadWeb = () => {
    // Build clean Dialpad web URL - NO API calls, NO deep links
    // Just a regular HTTPS URL that opens in new tab
    const dialpadWebUrl = `https://dialpad.com/app/calls/new?to=${encodeURIComponent(phoneNumber)}`;
    
    console.log('Opening Dialpad web in new tab:', dialpadWebUrl);
    
    // Open in NEW TAB using window.open with specific features
    // This prevents desktop app protocol from being triggered
    const dialpadWindow = window.open(
      dialpadWebUrl,
      '_blank',
      'noopener,noreferrer,width=400,height=600,left=100,top=100'
    );
    
    if (dialpadWindow) {
      setHasOpened(true);
      setIsDialpadOpen(true);
      
      toast({
        title: "Dialpad Web Opened",
        description: "Make your call in the new window",
      });

      // Focus the new window
      dialpadWindow.focus();
    } else {
      toast({
        title: "Popup Blocked",
        description: "Please allow popups for this site",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
            : 'w-full max-w-md'
        } shadow-2xl border-2 transition-all duration-300 ease-in-out overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary to-primary/80">
          <div className="flex items-center gap-3 text-white">
            <div className={`rounded-full p-2 ${isDialpadOpen ? 'bg-green-500 animate-pulse' : 'bg-primary-foreground/20'}`}>
              <Phone className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">
                {isMinimized ? 'Call Active' : phoneNumber}
              </span>
              {!isMinimized && (
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
          <div className="p-8 bg-gradient-to-b from-background to-muted/20 space-y-6">
            {/* Phone Number Display */}
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-foreground">
                {phoneNumber}
              </div>
              <Badge variant="outline" className="text-sm">
                Calling from: {fromNumber}
              </Badge>
            </div>

            {/* Status */}
            {!hasOpened && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  📞 Ready to Call
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Click the button below to open Dialpad in a new window
                </p>
              </div>
            )}

            {isDialpadOpen && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  ✓ Dialpad Web Opened
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Make your call in the Dialpad window
                </p>
                {callDuration > 0 && (
                  <div className="text-2xl font-mono font-bold text-green-600 dark:text-green-400 text-center mt-2">
                    {formatDuration(callDuration)}
                  </div>
                )}
              </div>
            )}

            {/* Call Action Button */}
            {!hasOpened ? (
              <Button
                onClick={openDialpadWeb}
                size="lg"
                className="w-full h-14 text-lg"
              >
                <ExternalLink className="mr-2 h-5 w-5" />
                Open Dialpad Web
              </Button>
            ) : (
              <div className="space-y-3">
                <Button
                  onClick={openDialpadWeb}
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  <ExternalLink className="mr-2 h-5 w-5" />
                  Reopen Dialpad Window
                </Button>
                <Button
                  onClick={onClose}
                  variant="secondary"
                  size="lg"
                  className="w-full"
                >
                  Close This Panel
                </Button>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-xs text-muted-foreground">
              <p className="font-medium">💡 How it works:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Dialpad opens in a new browser window</li>
                <li>Phone number is already filled in</li>
                <li>Click the call button in Dialpad</li>
                <li>Your call will be made through Dialpad's web app</li>
                <li>No desktop app required!</li>
              </ul>
            </div>

            {/* Alternative: Use Browser */}
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground text-center mb-2">
                Or use your device's phone:
              </p>
              <Button
                onClick={() => {
                  window.location.href = `tel:${phoneNumber}`;
                  toast({
                    title: "Opening Phone",
                    description: "Using your device's phone app",
                  });
                }}
                variant="ghost"
                size="sm"
                className="w-full"
              >
                <Phone className="mr-2 h-4 w-4" />
                Use Device Phone
              </Button>
            </div>
          </div>
        )}

        {/* Minimized View */}
        {isMinimized && (
          <div className="flex items-center justify-between px-4 h-full">
            <div className="flex items-center gap-2 text-sm">
              {isDialpadOpen && (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">
                    {formatDuration(callDuration)}
                  </span>
                </>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

