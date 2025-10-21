import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Phone, PhoneOff, Minimize2, Maximize2 } from "lucide-react";

interface DialpadCTIProps {
  onCallStart?: (callData: any) => void;
  onCallEnd?: (callData: any) => void;
  onCallStatusChange?: (status: string) => void;
}

export function DialpadCTI({ onCallStart, onCallEnd, onCallStatusChange }: DialpadCTIProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [currentCall, setCurrentCall] = useState<any>(null);
  const [fromNumber, setFromNumber] = useState<string>(() =>
    typeof window !== 'undefined' ? (localStorage.getItem('dialpad_from_number') || '+16612139593') : '+16612139593'
  );
  const { toast } = useToast();

  // Hardcoded available outbound numbers for quick selection; replace with dynamic fetch if needed
  const availableFromNumbers: Array<{ value: string; label: string }> = [
    { value: '+16049002048', label: 'Main (+16049002048)' },
    { value: '+16612139593', label: 'California (+16612139593)' },
    { value: '+16463960687', label: 'New York (+16463960687)' },
  ];

  useEffect(() => {
    checkAuthentication();
    setupMessageListener();
  }, []);

  const checkAuthentication = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("No authenticated user");
        return;
      }

      // Check if user has Dialpad token
      const { data: tokenData } = await (supabase as any)
        .from('dialpad_tokens')
        .select('access_token, expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (tokenData && tokenData.access_token) {
        // Check if token is still valid
        const expiresAt = new Date(tokenData.expires_at);
        const now = new Date();
        
        if (expiresAt > now) {
          setIsAuthenticated(true);
          loadDialpadCTI(tokenData.access_token);
        } else {
          console.log("Dialpad token expired");
          setIsAuthenticated(false);
        }
      } else {
        console.log("No Dialpad token found");
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Error checking Dialpad authentication:", error);
      setIsAuthenticated(false);
    }
  };

  const loadDialpadCTI = (accessToken: string) => {
    // CTI is now using popup windows instead of iframe
    // This function is kept for compatibility but doesn't load an iframe
    console.log('Dialpad CTI ready - calls will open in popup windows');
  };

  const setupMessageListener = () => {
    window.addEventListener('message', handleDialpadMessage);
    return () => {
      window.removeEventListener('message', handleDialpadMessage);
    };
  };

  const handleDialpadMessage = (event: MessageEvent) => {
    // Only accept messages from Dialpad
    if (!event.origin.includes('dialpad.com')) return;

    const { type, data } = event.data;

    switch (type) {
      case 'call.started':
        console.log('Call started:', data);
        setCurrentCall(data);
        setIsMinimized(false);
        onCallStart?.(data);
        onCallStatusChange?.('active');
        toast({
          title: 'Call Started',
          description: `Calling ${data.to || 'number'}`,
        });
        logCallToDatabase(data, 'started');
        break;

      case 'call.ended':
        console.log('Call ended:', data);
        onCallEnd?.(data);
        onCallStatusChange?.('ended');
        toast({
          title: 'Call Ended',
          description: `Duration: ${formatDuration(data.duration)}`,
        });
        logCallToDatabase(data, 'ended');
        setCurrentCall(null);
        break;

      case 'call.ringing':
        console.log('Call ringing:', data);
        onCallStatusChange?.('ringing');
        break;

      case 'call.answered':
        console.log('Call answered:', data);
        onCallStatusChange?.('answered');
        break;

      case 'call.failed':
        console.log('Call failed:', data);
        onCallStatusChange?.('failed');
        toast({
          title: 'Call Failed',
          description: data.reason || 'Unable to connect',
          variant: 'destructive',
        });
        setCurrentCall(null);
        break;

      default:
        console.log('Dialpad message:', type, data);
    }
  };

  const logCallToDatabase = async (callData: any, status: 'started' | 'ended') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (status === 'started') {
        // Create a new call record (align with typed schema)
        await supabase.from('calls').insert({
          outbound_type: 'outbound call',
          call_outcome: 'introduction',
          call_direction: 'outbound',
          caller_number: callData.from || fromNumber || null,
          callee_number: callData.to || null,
          call_status: 'in-progress',
          call_timestamp: new Date().toISOString(),
          rep_id: user.id,
          related_contact_id: callData.contact_id || null,
          related_deal_id: callData.deal_id || null,
        } as any);
      } else if (status === 'ended' && callData.duration) {
        // Update the call record with end data
        await supabase
          .from('calls')
          .update({
            call_status: 'completed',
            duration_seconds: callData.duration,
            call_outcome: callData.outcome || 'introduction',
          })
          .eq('callee_number', callData.to)
          .eq('call_status', 'in-progress')
          .order('call_timestamp', { ascending: false })
          .limit(1);
      }
    } catch (error) {
      console.error('Error logging call to database:', error);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const makeCall = async (phoneNumber: string, contactId?: string, dealId?: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'Not Connected',
        description: 'Please connect to Dialpad first',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's access token
      const { data: tokenData } = await (supabase as any)
        .from('dialpad_tokens')
        .select('access_token')
        .eq('user_id', user.id)
        .single();

      if (!tokenData?.access_token) {
        throw new Error('No access token found');
      }

      // Persist current selection
      try { localStorage.setItem('dialpad_from_number', fromNumber); } catch {}

      // Use Dialpad API to initiate the call with selected caller ID
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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to initiate call');
      }

      const callData = await response.json();

      // Log the call to database
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
        dialpad_call_id: callData.id,
      } as any);

      toast({
        title: 'Call Initiated',
        description: `Calling ${phoneNumber} via Dialpad`,
      });

      setCurrentCall({ to: phoneNumber, contact_id: contactId, deal_id: dealId, id: callData.id });
    } catch (error: any) {
      console.error('Error making call:', error);
      toast({
        title: 'Call Failed',
        description: error.message || 'Unable to initiate call',
        variant: 'destructive',
      });
    }
  };

  // Expose makeCall and from-number accessors globally for ClickToCall component
  useEffect(() => {
    if (isAuthenticated) {
      (window as any).dialpadCTI = {
        makeCall,
        getFromNumber: () => fromNumber,
        setFromNumber: (val: string) => setFromNumber(val),
      };
    }
  }, [isAuthenticated, fromNumber]);

  if (!isAuthenticated) {
    return null; // CTI widget only shows when authenticated
  }

  return (
    <>
    {/* Outbound number selector */}
    <div className="fixed bottom-[88px] right-4 z-50 w-[260px]">
      <Label htmlFor="dp-from-number" className="text-xs">Outbound number</Label>
      <Select value={fromNumber} onValueChange={setFromNumber}>
        <SelectTrigger id="dp-from-number" className="h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableFromNumbers.map((n) => (
            <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div className="fixed bottom-4 right-4 z-50">
      <div 
        className={`bg-card border-2 rounded-full shadow-2xl transition-all duration-300 ${
          currentCall ? 'border-primary animate-pulse' : 'border-border'
        }`}
        style={{ width: '60px', height: '60px' }}
      >
        <div className="w-full h-full flex items-center justify-center relative">
          {currentCall ? (
            <>
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <PhoneOff className="h-6 w-6 text-primary relative z-10" />
            </>
          ) : (
            <Phone className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        {/* Connected Indicator */}
        <div className="absolute -top-1 -right-1">
          <div className="bg-success rounded-full h-4 w-4 border-2 border-card flex items-center justify-center">
            <div className="bg-success-foreground rounded-full h-2 w-2" />
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

