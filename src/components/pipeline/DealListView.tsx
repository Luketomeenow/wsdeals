import { useState, useMemo, memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Calendar, DollarSign, User, Building2, ListChecks, Phone } from "lucide-react";
import { ClickToCall } from "@/components/calls/ClickToCall";
import { Link, useNavigate } from "react-router-dom";
import { BulkTaskCreator } from "./BulkTaskCreator";

interface Deal {
  id: string;
  name: string;
  stage: string;
  amount?: number;
  close_date?: string;
  created_at: string;
  priority: string;
  timezone?: string;
  companies?: { name: string; phone?: string };
  contacts?: { id: string; first_name: string; last_name: string; phone?: string };
}

interface DealListViewProps {
  deals: Deal[];
  onStageChange: (dealId: string, newStage: string) => void;
}

const stages = [
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

const stageColors = {
  "not contacted": "secondary",
  "no answer / gatekeeper": "secondary",
  "decision maker": "warning",
  "nurturing": "secondary",
  "interested": "primary",
  "strategy call booked": "primary", 
  "strategy call attended": "primary",
  "proposal / scope": "success",
  "closed won": "success",
  "closed lost": "destructive"
} as const;

const priorityColors = {
  high: "destructive",
  medium: "warning",
  low: "secondary"
} as const;

export function DealListView({ deals, onStageChange }: DealListViewProps) {
  const [selectedDealIds, setSelectedDealIds] = useState<Set<string>>(new Set());
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const handleDelete = async (dealId: string) => {
    const ok = window.confirm('Delete this deal? This cannot be undone.');
    if (!ok) return;
    try {
      const { error } = await supabase.from('deals').delete().eq('id', dealId);
      if (error) throw error;
      toast({ title: 'Deal deleted' });
      // Optimistically remove from the list by clearing selection; parent should refresh after navigation
      setSelectedDealIds((prev) => {
        const next = new Set(prev);
        next.delete(dealId);
        return next;
      });
      // Hard reload current route to trigger parent's fetch if necessary
      navigate(0 as any);
    } catch (e) {
      console.error('Failed to delete deal', e);
      toast({ title: 'Failed to delete deal', variant: 'destructive' });
    }
  };

  const toggleDealSelection = (dealId: string) => {
    setSelectedDealIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dealId)) {
        newSet.delete(dealId);
      } else {
        newSet.add(dealId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedDealIds.size === deals.length) {
      setSelectedDealIds(new Set());
    } else {
      setSelectedDealIds(new Set(deals.map((d) => d.id)));
    }
  };

  return (
    <>
      <div className="space-y-4">
        {selectedDealIds.size > 0 && (
          <div className="flex items-center justify-between p-4 bg-accent rounded-lg border border-border shadow-soft">
            <div className="flex items-center space-x-2">
              <ListChecks className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {selectedDealIds.size} deal{selectedDealIds.size !== 1 ? "s" : ""} selected
              </span>
            </div>
            <Button
              onClick={() => setTaskDialogOpen(true)}
              className="shadow-glow"
            >
              Create Tasks from Selected
            </Button>
          </div>
        )}

        <div className="border rounded-lg shadow-medium">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={deals.length > 0 && selectedDealIds.size === deals.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Deal Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Close Date</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deals.map((deal) => (
                <TableRow key={deal.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedDealIds.has(deal.id)}
                      onCheckedChange={() => toggleDealSelection(deal.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link to={`/deals/${deal.id}`} className="hover:underline">
                      {deal.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{deal.companies?.name || "No company"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <User className="h-3 w-3 text-muted-foreground" />
                      {deal.contacts ? (
                        <button className="text-sm text-primary hover:underline" onClick={() => navigate(`/contacts?highlight=${deal.contacts!.id}`)}>
                          {`${deal.contacts.first_name} ${deal.contacts.last_name}`}
                        </button>
                      ) : (
                        <span className="text-sm">No contact</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {deal.contacts?.phone ? (
                        <>
                          <span className="text-sm">{deal.contacts.phone}</span>
                          <ClickToCall 
                            phoneNumber={deal.contacts.phone}
                            contactId={deal.contacts.id}
                            dealId={deal.id}
                            variant="ghost"
                            size="icon"
                          />
                        </>
                      ) : deal.companies?.phone ? (
                        <>
                          <span className="text-sm">{deal.companies.phone}</span>
                          <ClickToCall 
                            phoneNumber={deal.companies.phone}
                            companyId={deal.id}
                            dealId={deal.id}
                            variant="ghost"
                            size="icon"
                          />
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">No phone</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select value={deal.stage} onValueChange={(value) => onStageChange(deal.id, value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue>
                          <Badge variant={stageColors[deal.stage as keyof typeof stageColors]}>
                            {deal.stage}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {stages.map((stage) => (
                          <SelectItem key={stage} value={stage}>
                            <Badge variant={stageColors[stage as keyof typeof stageColors]}>
                              {stage}
                            </Badge>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={priorityColors[deal.priority as keyof typeof priorityColors]}>
                      {deal.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">
                        {deal.amount ? `$${deal.amount.toLocaleString()}` : "No amount"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">
                        {deal.close_date ? new Date(deal.close_date).toLocaleDateString() : "Not set"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {new Date(deal.created_at).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/deals/${deal.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/deals/${deal.id}`}>Edit Deal</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(deal.id)}>Delete Deal</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {deals.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No deals found</p>
            </div>
          )}
        </div>
      </div>

      <BulkTaskCreator
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        selectedDealIds={Array.from(selectedDealIds)}
        onSuccess={() => {
          setSelectedDealIds(new Set());
          setTaskDialogOpen(false);
        }}
      />
    </>
  );
}
