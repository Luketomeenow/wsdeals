import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Mail, Plus, Send, Eye, MousePointer, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Email {
  id: string;
  subject: string;
  body: string;
  from_email: string;
  to_email: string;
  status: string;
  sent_at: string;
  opened_at?: string;
  clicked_at?: string;
  created_at: string;
}

interface EmailManagerProps {
  dealId: string;
  contactId?: string;
  companyId?: string;
  contactEmail?: string;
}

const statusColors = {
  sent: "secondary",
  opened: "primary",
  clicked: "success",
  bounced: "destructive",
  failed: "destructive"
} as const;

export function EmailManager({ dealId, contactId, companyId, contactEmail }: EmailManagerProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [isComposing, setIsComposing] = useState(false);
  const [formData, setFormData] = useState({
    to_email: contactEmail || '',
    subject: '',
    body: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchEmails();
  }, [dealId]);

  useEffect(() => {
    if (contactEmail && !formData.to_email) {
      setFormData(prev => ({ ...prev, to_email: contactEmail }));
    }
  }, [contactEmail]);

  const fetchEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .eq('deal_id', dealId)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      setEmails(data || []);
    } catch (error) {
      console.error('Error fetching emails:', error);
      toast({
        title: "Error",
        description: "Failed to fetch emails",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!formData.to_email || !formData.subject || !formData.body) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('emails')
        .insert({
          ...formData,
          from_email: 'sales@company.com', // This would be dynamic in a real app
          deal_id: dealId,
          contact_id: contactId,
          company_id: companyId,
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setEmails([data, ...emails]);
      setIsComposing(false);
      setFormData({
        to_email: contactEmail || '',
        subject: '',
        body: ''
      });

      toast({
        title: "Email Sent",
        description: "Your email has been sent successfully",
      });
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && emails.length === 0) {
    return <div className="flex items-center justify-center h-32">Loading emails...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Compose Email Button */}
      <Dialog open={isComposing} onOpenChange={setIsComposing}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="h-4 w-4 mr-1" />
            Compose Email
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compose Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>To</Label>
              <Input
                type="email"
                value={formData.to_email}
                onChange={(e) => setFormData({ ...formData, to_email: e.target.value })}
                placeholder="recipient@company.com"
              />
            </div>

            <div>
              <Label>Subject</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Email subject line"
              />
            </div>

            <div>
              <Label>Message</Label>
              <Textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder="Write your email message..."
                className="min-h-40"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsComposing(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSendEmail} 
                disabled={!formData.to_email || !formData.subject || !formData.body}
              >
                <Send className="h-4 w-4 mr-1" />
                Send Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quick Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFormData({
                ...formData,
                subject: 'Follow up on our conversation',
                body: 'Hi there,\n\nI wanted to follow up on our recent conversation about [topic]. \n\nI\'d love to schedule a time to discuss this further. When would be a good time for you?\n\nBest regards,\n[Your name]'
              })}
            >
              Follow Up
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFormData({
                ...formData,
                subject: 'Proposal for your consideration',
                body: 'Hi there,\n\nAs discussed, I\'ve attached our proposal for your review.\n\nPlease let me know if you have any questions or would like to schedule a call to discuss further.\n\nBest regards,\n[Your name]'
              })}
            >
              Proposal
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFormData({
                ...formData,
                subject: 'Thank you for your time',
                body: 'Hi there,\n\nThank you for taking the time to speak with me today. I really enjoyed our conversation about [topic].\n\nAs a next step, I\'ll [next action]. I\'ll follow up by [date].\n\nBest regards,\n[Your name]'
              })}
            >
              Thank You
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFormData({
                ...formData,
                subject: 'Checking in',
                body: 'Hi there,\n\nI hope you\'re doing well. I wanted to check in and see if you had any questions about our previous discussion.\n\nI\'m here if you need anything.\n\nBest regards,\n[Your name]'
              })}
            >
              Check In
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Emails List */}
      <div className="space-y-4">
        {emails.length > 0 ? (
          emails.map((email) => (
            <Card key={email.id}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{email.subject}</h3>
                        <Badge variant={statusColors[email.status as keyof typeof statusColors]}>
                          {email.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>To: {email.to_email}</span>
                        <span>From: {email.from_email}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(email.sent_at).toLocaleString()}</span>
                      </div>
                      {email.opened_at && (
                        <div className="flex items-center space-x-1 text-primary">
                          <Eye className="h-3 w-3" />
                          <span>Opened</span>
                        </div>
                      )}
                      {email.clicked_at && (
                        <div className="flex items-center space-x-1 text-success">
                          <MousePointer className="h-3 w-3" />
                          <span>Clicked</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="text-sm whitespace-pre-wrap text-muted-foreground bg-muted/30 p-3 rounded-md max-h-32 overflow-y-auto">
                      {email.body}
                    </div>
                  </div>
                  
                  {email.opened_at && (
                    <div className="text-xs text-muted-foreground border-t pt-2">
                      <div className="flex items-center justify-between">
                        <span>Opened: {new Date(email.opened_at).toLocaleString()}</span>
                        {email.clicked_at && (
                          <span>Clicked: {new Date(email.clicked_at).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold">No emails sent</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Start by composing your first email to this contact.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}