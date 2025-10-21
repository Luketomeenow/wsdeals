import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Search, Filter, Clock, MessageSquare, Plus, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { CallLogForm } from "@/components/calls/CallLogForm";
import { CallsSyncButton } from "@/components/calls/CallsSyncButton";
import { CallAnalytics } from "@/components/calls/CallAnalytics";
import { useToast } from "@/hooks/use-toast";

interface Call {
  id: string;
  outbound_type: string;
  call_outcome: string;
  duration_seconds: number;
  notes?: string;
  call_timestamp: string;
  created_at: string;
  dialpad_call_id?: string;
  recording_url?: string;
  transcript?: string;
  call_direction?: 'inbound' | 'outbound';
  caller_number?: string;
  callee_number?: string;
  call_status?: string;
}

const outcomeColors = {
  "strategy call booked": "success",
  "DM presentation": "primary",
  "DM discovery": "secondary",
  "voicemail": "warning",
  "no answer": "secondary",
  "not interested": "destructive",
  "nurturing": "warning"
} as const;

export default function Calls() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCalls();
  }, []);

  const fetchCalls = async () => {
    try {
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .order('call_timestamp', { ascending: false });

      if (error) throw error;
      setCalls((data || []) as Call[]);
    } catch (error) {
      console.error('Error fetching calls:', error);
      toast({
        title: "Error",
        description: "Failed to fetch calls",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCallSubmit = async (callData: any) => {
    try {
      const { error } = await supabase
        .from('calls')
        .insert([{
          outbound_type: callData.outboundType,
          call_outcome: callData.callOutcome,
          duration_seconds: callData.durationSeconds,
          notes: callData.notes || null,
          call_timestamp: new Date().toISOString(),
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Call logged successfully",
      });

      fetchCalls();
    } catch (error) {
      console.error('Error logging call:', error);
      toast({
        title: "Error",
        description: "Failed to log call",
        variant: "destructive",
      });
    }
  };

  const filteredCalls = calls.filter(call =>
    call.outbound_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    call.call_outcome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    call.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calls</h1>
          <p className="text-muted-foreground">
            Track and manage all your call activities and outcomes.
          </p>
        </div>
        <div className="flex gap-2">
          <CallsSyncButton onSyncComplete={fetchCalls} />
          <CallLogForm onSubmit={handleCallSubmit}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Log New Call
            </Button>
          </CallLogForm>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search calls..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      <div className="grid gap-4">
        {filteredCalls.map((call) => (
          <Card key={call.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                    <div className="space-y-2 flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{call.outbound_type}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(call.call_timestamp).toLocaleString()}
                          </p>
                          {call.call_direction && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {call.caller_number || 'Unknown'} → {call.callee_number || 'Unknown'}
                            </p>
                          )}
                        </div>
                        {call.dialpad_call_id && (
                          <Badge variant="outline" className="text-xs">
                            Dialpad
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 flex-wrap gap-2">
                        <Badge variant={outcomeColors[call.call_outcome as keyof typeof outcomeColors] || "secondary"}>
                          {call.call_outcome}
                        </Badge>
                        
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatDuration(call.duration_seconds)}</span>
                        </div>

                        {call.recording_url && (
                          <a 
                            href={call.recording_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            🎧 Recording
                          </a>
                        )}
                      </div>
                      
                      {call.transcript && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <MessageSquare className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <div className="text-sm space-y-1">
                              <p className="font-medium text-xs text-muted-foreground">Transcript:</p>
                              <p>{call.transcript}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {call.notes && !call.transcript && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <MessageSquare className="h-3 w-3 mt-0.5 text-muted-foreground" />
                            <p className="text-sm">{call.notes}</p>
                          </div>
                        </div>
                      )}

                      {/* Analytics Button */}
                      {call.transcript && (
                        <div className="mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExpandedCallId(expandedCallId === call.id ? null : call.id)}
                            className="w-full"
                          >
                            <BarChart3 className="mr-2 h-4 w-4" />
                            {expandedCallId === call.id ? 'Hide Analytics' : 'View Analytics'}
                          </Button>
                        </div>
                      )}

                      {/* Analytics Panel */}
                      {expandedCallId === call.id && call.transcript && (
                        <div className="mt-3">
                          <CallAnalytics callId={call.id} />
                        </div>
                      )}
                    </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCalls.length === 0 && (
        <div className="text-center py-12">
          <Phone className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-semibold">No calls found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm ? "Try adjusting your search terms." : "Start logging your calls to see them here."}
          </p>
        </div>
      )}
    </div>
  );
}