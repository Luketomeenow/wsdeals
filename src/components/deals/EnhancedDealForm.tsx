import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EnhancedDealFormProps {
  onSuccess?: () => void;
  children: React.ReactNode;
}

const dealStages = [
  "not contacted",
  "no answer / gatekeeper", 
  "decision maker",
  "nurturing",
  "interested",
  "strategy call booked",
  "strategy call attended",
  "proposal / scope",
  "closed won",
  "closed lost"
];

const priorities = [
  { value: "high", label: "High", color: "destructive" },
  { value: "medium", label: "Medium", color: "warning" },
  { value: "low", label: "Low", color: "secondary" }
];

const timezones = [
  "America/New_York", // EST
  "America/Chicago", // CST
  "America/Denver", // MST
  "America/Los_Angeles", // PST
  "Europe/London", // GMT
  "Europe/Berlin", // CET
  "Asia/Tokyo", // JST
  "UTC"
];

export function EnhancedDealForm({ onSuccess, children }: EnhancedDealFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    stage: "not contacted" as const,
    priority: "medium" as const,
    description: "",
    close_date: "",
    timezone: "America/Los_Angeles",
    currency: "USD",
    income_amount: "",
    source: "",
    referral: "",
    contact_attempts: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dealData = {
        name: formData.name,
        amount: formData.amount ? parseFloat(formData.amount) : null,
        stage: formData.stage,
        priority: formData.priority,
        description: formData.description || null,
        close_date: formData.close_date || null,
        timezone: formData.timezone,
        currency: formData.currency,
        income_amount: formData.income_amount ? parseFloat(formData.income_amount) : null,
        source: formData.source || null,
        referral: formData.referral || null,
        contact_attempts: formData.contact_attempts,
      };

      const { error } = await supabase
        .from('deals')
        .insert(dealData);

      if (error) throw error;

      toast({
        title: "Deal Created",
        description: "New deal has been successfully created.",
      });

      setOpen(false);
      setFormData({
        name: "",
        amount: "",
        stage: "not contacted" as const,
        priority: "medium" as const,
        description: "",
        close_date: "",
        timezone: "America/Los_Angeles",
        currency: "USD",
        income_amount: "",
        source: "",
        referral: "",
        contact_attempts: 0,
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error creating deal:', error);
      toast({
        title: "Error",
        description: "Failed to create deal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {children}
      </div>
      
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <CardHeader>
              <CardTitle>Create New Deal</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Deal Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="amount">Deal Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stage">Stage</Label>
                      <Select value={formData.stage} onValueChange={(value) => setFormData({ ...formData, stage: value as any })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {dealStages.map(stage => (
                            <SelectItem key={stage} value={stage}>
                              {stage.charAt(0).toUpperCase() + stage.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value as any })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {priorities.map(priority => (
                            <SelectItem key={priority.value} value={priority.value}>
                              <div className="flex items-center gap-2">
                                <Badge variant={priority.color as any} className="text-xs">
                                  {priority.label}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Deal Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Deal Details</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="close_date">Expected Close Date</Label>
                      <Input
                        id="close_date"
                        type="date"
                        value={formData.close_date}
                        onChange={(e) => setFormData({ ...formData, close_date: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {timezones.map(tz => (
                            <SelectItem key={tz} value={tz}>
                              {tz}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="CAD">CAD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="income_amount">Annual Revenue</Label>
                      <Input
                        id="income_amount"
                        type="number"
                        placeholder="0.00"
                        value={formData.income_amount}
                        onChange={(e) => setFormData({ ...formData, income_amount: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="source">Lead Source</Label>
                      <Input
                        id="source"
                        placeholder="e.g., Website, Referral"
                        value={formData.source}
                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="referral">Referral</Label>
                    <Input
                      id="referral"
                      placeholder="Who referred this deal?"
                      value={formData.referral}
                      onChange={(e) => setFormData({ ...formData, referral: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Deal"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}