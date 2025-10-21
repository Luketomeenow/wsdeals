import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Phone, X, Minimize2, Maximize2, PhoneOff, Mic, MicOff } from "lucide-react";

interface CustomDialerProps {
  phoneNumber: string;
  fromNumber: string;
  contactId?: string;
  dealId?: string;
  onClose?: () => void;
}

/**
 * Custom In-App Dialer
 * 
 * This component provides a native-looking dialer interface without using
 * Dialpad's web interface, preventing the desktop app from being triggered.
 * 
 * It uses Dialpad's REST API to initiate calls which ring your Dialpad device
 * (browser extension, mobile app, or desk phone) without opening the desktop app.
 */
export function CustomDialer({ 
  phoneNumber,
  fromNumber,
  contactId, 
  dealId, 
  onClose 
}: CustomDialerProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callId, setCallId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Auto-initiate call when component mounts
    initiateCall();
  }, []);

  useEffect(() => {
    // Update call duration every second when connected
    let interval: NodeJS.Timeout;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callStatus]);

  const initiateCall = async () => {
    setCallStatus('calling');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Get Dialpad access token
      const { data: tokenData } = await (supabase as any)
        .from('dialpad_tokens')
        .select('access_token, expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!tokenData?.access_token) {
        throw new Error('Dialpad not connected');
      }

      // Check token validity
      const expiresAt = new Date(tokenData.expires_at);
      if (expiresAt <= new Date()) {
        throw new Error('Dialpad token expired');
      }

      console.log('Initiating call via Dialpad API:', {
        to: phoneNumber,
        from: fromNumber,
      });

      // Call Dialpad API to initiate call
      // This will ring your Dialpad device (browser extension, mobile, or desk phone)
      const response = await fetch('https://dialpad.com/api/v2/calls', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to_number: phoneNumber,
          from_number: fromNumber,
          external_id: dealId || contactId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Dialpad API error:', response.status, errorText);
        throw new Error(`Failed to initiate call: ${response.status}`);
      }

      const callData = await response.json();
      console.log('Call initiated successfully:', callData);
      
      setCallId(callData.id);
      setCallStatus('connected');

      toast({
        title: "Call Initiated",
        description: "Your Dialpad device is ringing...",
      });

      // Log call to database
      await logCallToDatabase(user.id, callData.id, 'initiated');

    } catch (error: any) {
      console.error('Error initiating call:', error);
      toast({
        title: "Call Failed",
        description: error.message || "Could not initiate call",
        variant: "destructive",
      });
      setCallStatus('ended');
      
      // Auto-close after showing error
      setTimeout(() => {
        onClose?.();
      }, 2000);
    }
  };

  const logCallToDatabase = async (userId: string, dialpadCallId: string, status: string) => {
    try {
      await supabase.from('calls').insert({
        outbound_type: 'outbound call',
        call_outcome: 'introduction',
        call_direction: 'outbound',
        caller_number: fromNumber,
        callee_number: phoneNumber,
        call_status: status,
        call_timestamp: new Date().toISOString(),
        rep_id: userId,
        related_contact_id: contactId || null,
        related_deal_id: dealId || null,
        dialpad_call_id: dialpadCallId,
      } as any);
    } catch (error) {
      console.error('Error logging call:', error);
    }
  };

  const endCall = () => {
    setCallStatus('ended');
    toast({
      title: "Call Ended",
      description: `Duration: ${formatDuration(callDuration)}`,
    });
    
    // Close the dialer after a short delay
    setTimeout(() => {
      onClose?.();
    }, 1500);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'idle':
        return 'Preparing...';
      case 'calling':
        return 'Calling...';
      case 'connected':
        return 'Connected';
      case 'ended':
        return 'Call Ended';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (callStatus) {
      case 'calling':
        return 'text-yellow-500';
      case 'connected':
        return 'text-green-500';
      case 'ended':
        return 'text-gray-500';
      default:
        return 'text-muted-foreground';
    }
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
            <div className={`rounded-full p-2 ${callStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-primary-foreground/20'}`}>
              <Phone className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">
                {isMinimized ? 'Active Call' : phoneNumber}
              </span>
              {!isMinimized && (
                <>
                  <span className="text-xs opacity-90">
                    From: {fromNumber}
                  </span>
                  <span className={`text-xs font-medium ${getStatusColor()}`}>
                    {getStatusText()}
                  </span>
                </>
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
            {callStatus === 'ended' && (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Dialer Content */}
        {!isMinimized && (
          <div className="p-8 bg-gradient-to-b from-background to-muted/20">
            {/* Call Status Display */}
            <div className="text-center space-y-4 mb-8">
              {/* Phone Number Display */}
              <div className="text-3xl font-bold text-foreground">
                {phoneNumber}
              </div>
              
              {/* Status */}
              <div className={`text-lg font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </div>

              {/* Duration */}
              {callStatus === 'connected' && (
                <div className="text-4xl font-mono font-bold text-primary">
                  {formatDuration(callDuration)}
                </div>
              )}

              {/* Calling Animation */}
              {callStatus === 'calling' && (
                <div className="flex justify-center gap-2 mt-6">
                  <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              )}

              {/* Instructions */}
              {callStatus === 'calling' && (
                <p className="text-sm text-muted-foreground mt-4">
                  Answer on your Dialpad device<br />
                  (Browser extension, mobile app, or desk phone)
                </p>
              )}
            </div>

            {/* Call Controls */}
            {(callStatus === 'calling' || callStatus === 'connected') && (
              <div className="flex justify-center gap-4">
                {/* Mute Button */}
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full w-16 h-16"
                  onClick={() => setIsMuted(!isMuted)}
                  disabled={callStatus !== 'connected'}
                >
                  {isMuted ? (
                    <MicOff className="h-6 w-6" />
                  ) : (
                    <Mic className="h-6 w-6" />
                  )}
                </Button>

                {/* End Call Button */}
                <Button
                  size="lg"
                  variant="destructive"
                  className="rounded-full w-16 h-16"
                  onClick={endCall}
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </div>
            )}

            {/* Call Ended */}
            {callStatus === 'ended' && (
              <div className="text-center">
                <Button
                  onClick={onClose}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Minimized View */}
        {isMinimized && (
          <div className="flex items-center justify-between px-4 h-full">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">
                {callStatus === 'connected' ? formatDuration(callDuration) : 'Calling...'}
              </span>
            </div>
            {callStatus !== 'ended' && (
              <Button
                size="sm"
                variant="destructive"
                onClick={endCall}
              >
                End
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

