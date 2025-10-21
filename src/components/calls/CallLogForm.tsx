import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Phone } from "lucide-react";

const outboundTypes = [
  "outbound call",
  "inbound call",
  "strategy call",
  "scope call",
  "candidate interview",
  "onboarding call"
];

const callOutcomes = [
  "do not call",
  "dash",
  "asked to be put on DNC list",
  "did not dial",
  "phone did not ring",
  "no answer",
  "gatekeeper",
  "voicemail",
  "DM",
  "introduction",
  "sensor decision maker",
  "DM short story",
  "DM discovery",
  "DM presentation",
  "DM resume request",
  "strategy call booked",
  "strategy call attended",
  "strategy call no show",
  "candidate interview booked",
  "candidate interview attended",
  "not interested",
  "no show",
  "onboarding call booked",
  "onboarding call attended",
  "nurturing"
];

interface CallLogFormProps {
  onSubmit?: (data: any) => void;
  children?: React.ReactNode;
}

export function CallLogForm({ onSubmit, children }: CallLogFormProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    outboundType: "",
    callOutcome: "",
    durationSeconds: 0,
    notes: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.outboundType || !formData.callOutcome) {
      alert("Both Outbound Type and Call Outcome are required.");
      return;
    }
    
    onSubmit?.(formData);
    setOpen(false);
    setFormData({
      outboundType: "",
      callOutcome: "",
      durationSeconds: 0,
      notes: ""
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Phone className="mr-2 h-4 w-4" />
            Log Call
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Log a Call</DialogTitle>
          <DialogDescription>
            Record the details of your call. Both outbound type and call outcome are required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="outbound-type">Outbound Type *</Label>
              <Select
                value={formData.outboundType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, outboundType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select outbound type" />
                </SelectTrigger>
                <SelectContent>
                  {outboundTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="call-outcome">Call Outcome *</Label>
              <Select
                value={formData.callOutcome}
                onValueChange={(value) => setFormData(prev => ({ ...prev, callOutcome: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select call outcome" />
                </SelectTrigger>
                <SelectContent>
                  {callOutcomes.map((outcome) => (
                    <SelectItem key={outcome} value={outcome}>
                      {outcome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="duration">Call Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.durationSeconds}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  durationSeconds: parseInt(e.target.value) || 0 
                }))}
                placeholder="0"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add your call notes here..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Call</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}