import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface LeadItem {
  id: string;
  name: string;
  company?: string;
  created_at: string;
  priority?: string;
}

export function RecentLeads() {
  const [items, setItems] = useState<LeadItem[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    const { data } = await supabase
      .from('deals')
      .select('id, name, created_at, priority, companies(name)')
      .order('created_at', { ascending: false })
      .limit(50);
    const mapped: LeadItem[] = (data || []).map((d: any) => ({
      id: d.id,
      name: d.name,
      created_at: d.created_at,
      company: d.companies?.name,
      priority: d.priority,
    }));
    setItems(mapped);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return items;
    return items.filter(i => (
      i.name.toLowerCase().includes(q) ||
      (i.company || '').toLowerCase().includes(q)
    ));
  }, [items, search]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Leads</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-3">
          <Input placeholder="Search leads..." value={search} onChange={(e)=>setSearch(e.target.value)} />
        </div>
        <div className="max-h-80 overflow-auto space-y-3 pr-1">
          {filtered.map((l) => (
            <div key={l.id} className="flex items-start justify-between p-2 rounded hover:bg-muted/50">
              <div>
                <p className="text-sm font-medium">{l.name}</p>
                <p className="text-xs text-muted-foreground">{l.company || 'No company'}</p>
              </div>
              <div className="text-right">
                {l.priority && <Badge variant="secondary" className="text-2xs">{l.priority}</Badge>}
                <p className="text-xs text-muted-foreground mt-1">{new Date(l.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-sm text-muted-foreground py-6 text-center">No leads found</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


