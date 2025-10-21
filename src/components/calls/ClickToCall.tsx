import { useState } from "react";
import { Phone, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SimpleDialer } from "./SimpleDialer";

interface ClickToCallProps {
  phoneNumber: string;
  contactId?: string;
  dealId?: string;
  companyId?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  showIcon?: boolean;
  label?: string;
}

export function ClickToCall({
  phoneNumber,
  contactId,
  dealId,
  companyId,
  variant = "outline",
  size = "sm",
  showIcon = true,
  label,
}: ClickToCallProps) {
  const [calling, setCalling] = useState(false);
  const [showDialer, setShowDialer] = useState(false);
  const [selectedFromNumber, setSelectedFromNumber] = useState<string>("");
  const { toast } = useToast();

  // Available outbound numbers (configure as needed)
  const availableFromNumbers: Array<{ value: string; label: string }> = [
    { value: "+16049002048", label: "Main (+16049002048)" },
    { value: "+16612139593", label: "California (+16612139593)" },
    { value: "+16463960687", label: "New York (+16463960687)" },
  ];

  const getInitialFrom = () => {
    try {
      return (window as any).dialpadCTI?.getFromNumber?.() || localStorage.getItem('dialpad_from_number') || availableFromNumbers[0].value;
    } catch {
      return availableFromNumbers[0].value;
    }
  };
  const [fromNumber, setFromNumber] = useState<string>(getInitialFrom());

  const normalizeToE164 = (raw: string) => {
    const digits = (raw || '').replace(/\D/g, '');
    if (!digits) return '';
    if (raw.startsWith('+')) return `+${digits}`; // assume already E.164
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`; // US 11 with country
    if (digits.length === 10) return `+1${digits}`; // default to US if no country provided
    return `+${digits}`; // best-effort
  };

  const startCall = async (selectedFrom: string) => {
    if (!phoneNumber) {
      toast({
        title: "Error",
        description: "No phone number available",
        variant: "destructive",
      });
      return;
    }

    setCalling(true);
    try {
      const to = normalizeToE164(phoneNumber);
      if (!to.startsWith('+')) {
        throw new Error('Invalid phone number. Please use a valid number (e.g., +15551234567)');
      }

      // Persist selection
      try { localStorage.setItem('dialpad_from_number', selectedFrom); } catch {}

      // Ensure user is authenticated
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('You must be signed in to place calls');
      }

      // Check if user has Dialpad connected
      const { data: tokenData } = await (supabase as any)
        .from('dialpad_tokens')
        .select('access_token')
        .eq('user_id', sessionData.session.user.id)
        .maybeSingle();

      if (tokenData?.access_token) {
        // Store the selected from number and open embedded Dialpad dialer
        setSelectedFromNumber(selectedFrom);
        setShowDialer(true);
        toast({ 
          title: 'Opening Dialpad', 
          description: `Calling from ${selectedFrom}`,
        });
      } else {
        // No Dialpad connected, use tel: link
        window.location.href = `tel:${to}`;
        toast({ 
          title: 'Opening Phone', 
          description: `Calling ${to}...`,
        });
      }

    } catch (error: any) {
      console.error('Error initiating call:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to initiate call",
        variant: "destructive",
      });
    } finally {
      setCalling(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            disabled={calling || !phoneNumber}
            title={phoneNumber ? `Call ${phoneNumber}` : "No phone number"}
            onClick={() => setFromNumber(getInitialFrom())}
          >
            {showIcon && <Phone className={label ? "mr-2 h-4 w-4" : "h-4 w-4"} />}
            {label || (size === "icon" ? "" : calling ? "Calling..." : "Call")}
            <ChevronDown className="ml-2 h-3 w-3 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {availableFromNumbers.map((n) => (
            <DropdownMenuItem key={n.value} onClick={() => startCall(n.value)}>
              {n.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {showDialer && selectedFromNumber && (
        <SimpleDialer
          phoneNumber={phoneNumber}
          fromNumber={selectedFromNumber}
          contactId={contactId}
          dealId={dealId}
          onClose={() => setShowDialer(false)}
        />
      )}
    </>
  );
}
