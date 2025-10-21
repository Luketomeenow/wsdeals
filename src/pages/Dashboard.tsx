import { useState, useEffect } from "react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { RecentConversations } from "@/components/dashboard/RecentConversations";
import { RecentLeads } from "@/components/dashboard/RecentLeads";
import { DialpadConnectButton } from "@/components/integrations/DialpadConnectButton";
import { PipelineOverview } from "@/components/dashboard/PipelineOverview";
import { 
  Users, 
  Building2, 
  Handshake, 
  Phone, 
  TrendingUp, 
  DollarSign 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    totalDeals: 0,
    pipelineValue: 0,
    callsMade: 0,
    connectRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      // Fetch total deals count
      const { count: dealsCount } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true });

      // Fetch pipeline value (sum of all deal amounts)
      const { data: dealsData } = await supabase
        .from('deals')
        .select('amount');
      
      const pipelineValue = dealsData?.reduce((sum, deal) => sum + (deal.amount || 0), 0) || 0;

      // Fetch calls count
      const { count: callsCount } = await supabase
        .from('calls')
        .select('*', { count: 'exact', head: true });

      // Calculate connect rate (calls with outcome != no answer)
      const { data: callsData } = await supabase
        .from('calls')
        .select('call_outcome');
      
      const connectedCalls = callsData?.filter(call => 
        call.call_outcome !== 'no answer' && 
        call.call_outcome !== 'voicemail'
      ).length || 0;
      
      const connectRate = callsCount && callsCount > 0 
        ? Math.round((connectedCalls / callsCount) * 100) 
        : 0;

      setMetrics({
        totalDeals: dealsCount || 0,
        pipelineValue,
        callsMade: callsCount || 0,
        connectRate
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your sales pipeline.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Deals"
          value={loading ? "..." : metrics.totalDeals.toString()}
          icon={Handshake}
        />
        <MetricCard
          title="Pipeline Value"
          value={loading ? "..." : `$${(metrics.pipelineValue / 1000).toFixed(0)}K`}
          icon={DollarSign}
        />
        <MetricCard
          title="Calls Made"
          value={loading ? "..." : metrics.callsMade.toString()}
          icon={Phone}
        />
        <MetricCard
          title="Connect Rate"
          value={loading ? "..." : `${metrics.connectRate}%`}
          icon={TrendingUp}
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 space-y-6">
          <DialpadConnectButton />
          <PipelineOverview />
          <RecentConversations />
        </div>
        <div className="col-span-3 space-y-6">
          <RecentLeads />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}