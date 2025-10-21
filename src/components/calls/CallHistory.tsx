import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Phone, PhoneIncoming, PhoneOutgoing, Clock, User, FileText, Headphones } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Call {
  id: string;
  call_direction: string | null;
  call_outcome: string;
  call_status: string | null;
  call_timestamp: string | null;
  caller_number: string | null;
  callee_number: string | null;
  duration_seconds: number | null;
  outbound_type: string;
  notes: string | null;
  recording_url: string | null;
  transcript: string | null;
  rep_id: string | null;
}

interface CallHistoryProps {
  contactId?: string;
  dealId?: string;
  limit?: number;
}

export function CallHistory({ contactId, dealId, limit = 10 }: CallHistoryProps) {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (contactId || dealId) {
      fetchCallHistory();
    }
  }, [contactId, dealId]);

  const fetchCallHistory = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('calls')
        .select('*')
        .order('call_timestamp', { ascending: false })
        .limit(limit);

      if (contactId) {
        query = query.eq('related_contact_id', contactId);
      } else if (dealId) {
        query = query.eq('related_deal_id', dealId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCalls(data || []);
    } catch (error) {
      console.error('Error fetching call history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getOutcomeColor = (outcome: string) => {
    const outcomeMap: Record<string, string> = {
      'DM': 'success',
      'introduction': 'success',
      'voicemail': 'warning',
      'no answer': 'secondary',
      'not interested': 'destructive',
      'gatekeeper': 'secondary',
    };
    return outcomeMap[outcome?.toLowerCase()] || 'default';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Call History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Call History ({calls.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {calls.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No call history available
          </p>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {calls.map((call) => (
                <div
                  key={call.id}
                  className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {call.call_direction === 'outbound' ? (
                        <PhoneOutgoing className="h-4 w-4 text-primary" />
                      ) : (
                        <PhoneIncoming className="h-4 w-4 text-success" />
                      )}
                      <span className="font-medium text-sm capitalize">
                        {call.outbound_type || call.call_direction || 'Call'}
                      </span>
                    </div>
                    <Badge variant={getOutcomeColor(call.call_outcome) as any}>
                      {call.call_outcome}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    {call.call_timestamp && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(new Date(call.call_timestamp), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                    )}

                    {call.duration_seconds !== null && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>Duration: {formatDuration(call.duration_seconds)}</span>
                      </div>
                    )}

                    {(call.caller_number || call.callee_number) && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        <span>
                          {call.call_direction === 'outbound' 
                            ? `To: ${call.callee_number}` 
                            : `From: ${call.caller_number}`}
                        </span>
                      </div>
                    )}

                    {call.notes && (
                      <div className="flex items-start gap-2 mt-2">
                        <FileText className="h-3 w-3 flex-shrink-0 mt-0.5" />
                        <span className="text-xs">{call.notes}</span>
                      </div>
                    )}

                    {call.recording_url && (
                      <div className="flex items-center gap-2 mt-2">
                        <Headphones className="h-3 w-3" />
                        <a
                          href={call.recording_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-xs"
                        >
                          Listen to recording
                        </a>
                      </div>
                    )}

                    {call.call_status && (
                      <div className="mt-1">
                        <Badge variant="outline" className="text-xs">
                          {call.call_status}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

