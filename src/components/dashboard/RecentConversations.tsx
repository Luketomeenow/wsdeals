import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Conversation {
  id: string;
  last_message_at: string;
  contact_name?: string;
  deal_name?: string;
  last_message_snippet?: string;
}

export function RecentConversations() {
  const [items, setItems] = useState<Conversation[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    // Fallback: derive from sms_messages if conversations table not present
    const { data } = await supabase
      .from('sms_messages')
      .select('id, message_body, created_at, contacts(first_name,last_name), deals(name)')
      .order('created_at', { ascending: false })
      .limit(50);

    const mapped: Conversation[] = (data || []).map((m: any) => ({
      id: m.id,
      last_message_at: m.created_at,
      contact_name: m.contacts ? `${m.contacts.first_name || ''} ${m.contacts.last_name || ''}`.trim() : undefined,
      deal_name: m.deals?.name,
      last_message_snippet: m.message_body?.slice(0, 80)
    }));
    setItems(mapped);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return items;
    return items.filter(i => (
      (i.contact_name || '').toLowerCase().includes(q) ||
      (i.deal_name || '').toLowerCase().includes(q) ||
      (i.last_message_snippet || '').toLowerCase().includes(q)
    ));
  }, [items, search]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Conversations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-3">
          <Input placeholder="Search conversations..." value={search} onChange={(e)=>setSearch(e.target.value)} />
        </div>
        <div className="max-h-80 overflow-auto space-y-3 pr-1">
          {filtered.map((c) => (
            <div key={c.id} className="flex items-start gap-3 p-2 rounded hover:bg-muted/50">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{c.contact_name || 'Unknown contact'}</p>
                  <Badge variant="secondary" className="text-2xs">{new Date(c.last_message_at).toLocaleString()}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{c.deal_name || 'No deal'}</p>
                <p className="text-sm mt-1">{c.last_message_snippet}</p>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-sm text-muted-foreground py-6 text-center">No conversations found</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


