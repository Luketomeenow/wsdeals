import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SendSMSDialogProps {
  phoneNumber: string;
  contactId?: string;
  dealId?: string;
  companyId?: string;
  children?: React.ReactNode;
}

export function SendSMSDialog({
  phoneNumber,
  contactId,
  dealId,
  companyId,
  children,
}: SendSMSDialogProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('dialpad-send-sms', {
        body: {
          to_number: phoneNumber,
          message: message.trim(),
          contact_id: contactId,
          deal_id: dealId,
          company_id: companyId,
        },
      });

      if (error) throw error;

      toast({
        title: "SMS Sent",
        description: `Message sent to ${phoneNumber}`,
      });

      setMessage("");
      setOpen(false);
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast({
        title: "Error",
        description: "Failed to send SMS. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <MessageSquare className="mr-2 h-4 w-4" />
            Send SMS
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send SMS to {phoneNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={160}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {message.length}/160 characters
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={sending || !message.trim()}>
              {sending ? 'Sending...' : 'Send SMS'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
