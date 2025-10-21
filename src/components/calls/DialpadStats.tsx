import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CallsSyncButton } from "./CallsSyncButton";

interface CallStats {
  total: number;
  today: number;
  avgDuration: number;
  dialpadSynced: number;
}

export function DialpadStats() {
  const [stats, setStats] = useState<CallStats>({
    total: 0,
    today: 0,
    avgDuration: 0,
    dialpadSynced: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Total calls
      const { count: totalCount } = await supabase
        .from('calls')
        .select('*', { count: 'exact', head: true });

      // Today's calls
      const { count: todayCount } = await supabase
        .from('calls')
        .select('*', { count: 'exact', head: true })
        .gte('call_timestamp', today.toISOString());

      // Average duration
      const { data: durationData } = await supabase
        .from('calls')
        .select('duration_seconds');

      const avgDuration = durationData && durationData.length > 0
        ? Math.round(
            durationData.reduce((sum, call) => sum + (call.duration_seconds || 0), 0) / 
            durationData.length
          )
        : 0;

      // Dialpad synced calls
      const { count: dialpadCount } = await supabase
        .from('calls')
        .select('*', { count: 'exact', head: true })
        .not('dialpad_call_id', 'is', null);

      setStats({
        total: totalCount || 0,
        today: todayCount || 0,
        avgDuration,
        dialpadSynced: dialpadCount || 0,
      });
    } catch (error) {
      console.error('Error fetching call stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Loading stats...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold">Dialpad Integration</CardTitle>
        <CallsSyncButton onSyncComplete={fetchStats} variant="ghost" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center text-sm text-muted-foreground">
              <Phone className="h-4 w-4 mr-2" />
              Total Calls
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 mr-2" />
              Today
            </div>
            <p className="text-2xl font-bold">{stats.today}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-2" />
              Avg Duration
            </div>
            <p className="text-2xl font-bold">{formatDuration(stats.avgDuration)}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 mr-2" />
              Synced
            </div>
            <p className="text-2xl font-bold">{stats.dialpadSynced}</p>
          </div>
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          {stats.dialpadSynced > 0 && (
            <p>
              {Math.round((stats.dialpadSynced / stats.total) * 100)}% of calls synced from Dialpad
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
