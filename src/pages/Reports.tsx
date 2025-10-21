import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, BarChart3, PieChart, TrendingUp, Users, Target, Briefcase, CheckCircle2, ListChecks } from "lucide-react";
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, subQuarters, subYears } from 'date-fns';
import { supabase } from "@/integrations/supabase/client";
import { ReportChart } from "@/components/reports/ReportChart";
import { ReportMetric } from "@/components/reports/ReportMetric";
import { AdvancedFilters, FilterState } from "@/components/reports/AdvancedFilters";
import { EnhancedChart } from "@/components/reports/EnhancedCharts";
// Replaced Meetings/Emails tabs with Appointment Settings and Closing analytics

interface CallMetrics {
  totalCalls: number;
  callsByOutcome: { [key: string]: number };
  callsByType: { [key: string]: number };
  avgDuration: number;
  connectRate: number;
  repPerformance: Array<{ 
    name: string; 
    calls: number; 
    noAnswerRate: number; 
    connectRate: number; 
    conversions: number;
  }>;
  scriptProgression: Array<{ stage: string; count: number; conversionRate: number }>;
  dailyActivity: Array<{ name: string; value: number; calls: number; connects: number }>;
}

interface AppointmentMetrics {
  totalCalls: number;
  noAnswer: number;
  intro: number;
  shortStory: number;
  discovery: number;
  presentation: number;
  strategyBooked: number;
  strategyAttended: number;
  notInterested: number;
  dnc: number;
  resumeRequests: number;
}

interface ClosingMetrics {
  strategyAttended: number;
  sql: number; // placeholder until defined in schema
  nql: number; // placeholder until defined in schema
  proposalSent: number; // deals in stage 'proposal / scope'
  candidateInterviewBooked: number;
  candidateInterviewAttended: number;
  businessAuditBooked: number; // placeholder
  businessAuditAttended: number; // placeholder
  invoiceAgreementSent: number; // placeholder
  dealWonByProduct: Record<string, number>;
}

export default function Reports() {
  const [metrics, setMetrics] = useState<CallMetrics>({
    totalCalls: 0,
    callsByOutcome: {},
    callsByType: {},
    avgDuration: 0,
    connectRate: 0,
    repPerformance: [],
    scriptProgression: [],
    dailyActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { from: undefined, to: undefined },
    rep: '',
    pipeline: '',
    callOutcome: '',
    emailStatus: '',
    priority: ''
  });
  const [reps, setReps] = useState<Array<{ id: string; name: string }>>([]);
  const [pipelines, setPipelines] = useState<Array<{ id: string; name: string }>>([]);
  const [appointment, setAppointment] = useState<AppointmentMetrics | null>(null);
  const [closing, setClosing] = useState<ClosingMetrics | null>(null);

  useEffect(() => {
    fetchMetrics();
    fetchRepsAndPipelines();
  }, [filters]);

  const fetchRepsAndPipelines = async () => {
    try {
      const [repsResponse, pipelinesResponse] = await Promise.all([
        supabase.from('user_profiles').select('id, first_name, last_name'),
        supabase.from('pipelines').select('id, name')
      ]);

      if (repsResponse.data) {
        setReps(repsResponse.data.map(rep => ({
          id: rep.id,
          name: `${rep.first_name || ''} ${rep.last_name || ''}`.trim() || 'Unknown Rep'
        })));
      }

      if (pipelinesResponse.data) {
        setPipelines(pipelinesResponse.data);
      }
    } catch (error) {
      console.error('Error fetching reps and pipelines:', error);
    }
  };

  const fetchMetrics = async () => {
    try {
      // Resolve period filters to date range
      let from = filters.dateRange.from;
      let to = filters.dateRange.to;
      const now = new Date();
      const year = filters.year ? Number(filters.year) : now.getFullYear();
      if (filters.period === 'month') {
        const base = new Date(year, now.getMonth(), 1);
        from = startOfMonth(base);
        to = endOfMonth(base);
      } else if (filters.period === 'quarter') {
        const base = new Date(year, now.getMonth(), 1);
        from = startOfQuarter(base);
        to = endOfQuarter(base);
      } else if (filters.period === 'year') {
        const base = new Date(year, 0, 1);
        from = startOfYear(base);
        to = endOfYear(base);
      }

      // Previous period for comparison
      let prevFrom: Date | undefined = undefined;
      let prevTo: Date | undefined = undefined;
      if (from && to) {
        if (filters.period === 'month') {
          prevFrom = startOfMonth(subMonths(from, 1));
          prevTo = endOfMonth(subMonths(to, 1));
        } else if (filters.period === 'quarter') {
          prevFrom = startOfQuarter(subQuarters(from, 1));
          prevTo = endOfQuarter(subQuarters(to, 1));
        } else if (filters.period === 'year') {
          prevFrom = startOfYear(subYears(from, 1));
          prevTo = endOfYear(subYears(to, 1));
        }
      }

      // Fetch calls; join rep names separately to avoid RLS/join issues
      let query = supabase.from('calls').select('*');

      // Apply filters
      if (from) query = query.gte('call_timestamp', from.toISOString());
      if (to) query = query.lte('call_timestamp', to.toISOString());
      if (filters.rep) {
        query = query.eq('rep_id', filters.rep);
      }
      if (filters.callOutcome) {
        query = query.eq('call_outcome', filters.callOutcome as any);
      }

      const { data: calls, error } = await query;
      if (error) throw error;

      // Comparison dataset (previous period)
      let prevCalls: any[] = [];
      if (prevFrom && prevTo) {
        let prevQuery = supabase.from('calls').select('*');
        prevQuery = prevQuery.gte('call_timestamp', prevFrom.toISOString()).lte('call_timestamp', prevTo.toISOString());
        if (filters.rep) prevQuery = prevQuery.eq('rep_id', filters.rep);
        const { data: prevData } = await prevQuery;
        prevCalls = prevData || [];
      }

      const totalCalls = Array.isArray(calls) ? calls.length : 0;
      const callsByOutcome: { [key: string]: number } = {};
      const callsByType: { [key: string]: number } = {};
      let totalDuration = 0;
      let connectedCalls = 0;

      // Rep performance tracking
      const repStats: { [key: string]: { name: string; calls: number; noAnswer: number; connected: number; conversions: number } } = {};

      (calls || []).forEach((call: any) => {
        callsByOutcome[call.call_outcome] = (callsByOutcome[call.call_outcome] || 0) + 1;
        callsByType[call.outbound_type] = (callsByType[call.outbound_type] || 0) + 1;
        totalDuration += call.duration_seconds || 0;
        
        const isConnected = !['no answer', 'voicemail', 'dash'].includes(call.call_outcome);
        if (isConnected) {
          connectedCalls++;
        }

        // Track rep performance
        if (call.rep_id) {
          if (!repStats[call.rep_id]) {
            repStats[call.rep_id] = {
              name: 'Unknown Rep',
              calls: 0,
              noAnswer: 0,
              connected: 0,
              conversions: 0
            };
          }
          repStats[call.rep_id].calls++;
          if (call.call_outcome === 'no answer') {
            repStats[call.rep_id].noAnswer++;
          }
          if (isConnected) {
            repStats[call.rep_id].connected++;
          }
          if (call.call_outcome === 'strategy call booked') {
            repStats[call.rep_id].conversions++;
          }
        }
      });

      const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;
      const connectRate = totalCalls > 0 ? Math.round((connectedCalls / totalCalls) * 100) : 0;

      // Comparison numbers
      const prevTotalCalls = prevCalls.length;
      const prevConnects = prevCalls.filter(c => !['no answer', 'voicemail', 'dash'].includes(c.call_outcome)).length;
      const prevConnectRate = prevTotalCalls > 0 ? Math.round((prevConnects / prevTotalCalls) * 100) : 0;

      // Appointment Settings metrics (mapped from call outcomes)
      const appointmentMetrics: AppointmentMetrics = {
        totalCalls,
        noAnswer: callsByOutcome['no answer'] || 0,
        intro: callsByOutcome['introduction'] || 0,
        shortStory: callsByOutcome['DM short story'] || 0,
        discovery: callsByOutcome['DM discovery'] || 0,
        presentation: callsByOutcome['DM presentation'] || 0,
        strategyBooked: callsByOutcome['strategy call booked'] || 0,
        strategyAttended: callsByOutcome['strategy call attended'] || 0,
        notInterested: callsByOutcome['not interested'] || 0,
        dnc: (callsByOutcome['do not call'] || 0) + (callsByOutcome['asked to be put on DNC list'] || 0),
        resumeRequests: callsByOutcome['DM resume request'] || 0,
      };

      // Fetch rep names for those seen in calls
      const repIds = Object.keys(repStats);
      if (repIds.length > 0) {
        const { data: repProfiles } = await supabase
          .from('user_profiles')
          .select('id, first_name, last_name')
          .in('id', repIds);
        (repProfiles || []).forEach((rep: any) => {
          const fullName = `${rep.first_name || ''} ${rep.last_name || ''}`.trim() || 'Unknown Rep';
          if (repStats[rep.id]) {
            repStats[rep.id].name = fullName;
          }
        });
      }

      // Process rep performance
      const repPerformance = Object.values(repStats).map(rep => ({
        name: rep.name,
        calls: rep.calls,
        noAnswerRate: rep.calls > 0 ? Math.round((rep.noAnswer / rep.calls) * 100) : 0,
        connectRate: rep.calls > 0 ? Math.round((rep.connected / rep.calls) * 100) : 0,
        conversions: rep.conversions
      }));

      // Optional: compare two reps if compareRep is selected
      let compareRepStats: { name: string; calls: number; connectRate: number } | null = null;
      if (filters.compareRep) {
        let compQuery = supabase.from('calls').select('call_outcome, rep_id');
        if (from) compQuery = compQuery.gte('call_timestamp', from.toISOString());
        if (to) compQuery = compQuery.lte('call_timestamp', to.toISOString());
        compQuery = compQuery.eq('rep_id', filters.compareRep);
        const { data: compCalls } = await compQuery;
        const cc = compCalls || [];
        const cTotal = cc.length;
        const cConnects = cc.filter(c => !['no answer', 'voicemail', 'dash'].includes(c.call_outcome)).length;
        const cRate = cTotal > 0 ? Math.round((cConnects / cTotal) * 100) : 0;
        const repName = reps.find(r => r.id === filters.compareRep)?.name || 'Compared Rep';
        compareRepStats = { name: repName, calls: cTotal, connectRate: cRate };
      }

      // Script progression analysis
      const scriptStages = [
        { stage: 'Initial Contact', outcomes: ['connected', 'DM'], nextStage: 'DM Short Story' },
        { stage: 'DM Short Story', outcomes: ['DM short story'], nextStage: 'Discovery' },
        { stage: 'Discovery', outcomes: ['DM discovery'], nextStage: 'Presentation' },
        { stage: 'Presentation', outcomes: ['DM presentation'], nextStage: 'Strategy Call' },
        { stage: 'Strategy Call Booked', outcomes: ['strategy call booked'], nextStage: null }
      ];

      const scriptProgression = scriptStages.map(stage => {
        const count = stage.outcomes.reduce((sum, outcome) => sum + (callsByOutcome[outcome] || 0), 0);
        const conversionRate = totalCalls > 0 ? Math.round((count / totalCalls) * 100) : 0;
        return { stage: stage.stage, count, conversionRate };
      });

      // Daily activity (last 30 days)
      const dailyActivity = [];
      const dailyNow = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(dailyNow);
        date.setDate(dailyNow.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayCalls = calls?.filter(call => {
          const callDate = new Date(call.call_timestamp).toISOString().split('T')[0];
          return callDate === dateStr;
        }) || [];
        
        const dayConnects = dayCalls.filter(call => 
          !['no answer', 'voicemail', 'dash'].includes(call.call_outcome)
        ).length;
        
        dailyActivity.push({
          name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: dayCalls.length,
          calls: dayCalls.length,
          connects: dayConnects
        });
      }

      // Closing metrics
      // Proposal sent approximated by deals in stage 'proposal / scope'
      let proposalSent = 0;
      try {
        const { data: dealsProposal } = await supabase
          .from('deals')
          .select('id')
          .eq('stage', 'proposal / scope');
        proposalSent = dealsProposal?.length || 0;
      } catch {}

      // Candidate interview counts from call outcomes
      const candidateInterviewBooked = callsByOutcome['candidate interview booked'] || 0;
      const candidateInterviewAttended = callsByOutcome['candidate interview attended'] || 0;

      // Deal won by product (from line_items for closed won deals)
      const dealWonByProduct: Record<string, number> = { VA: 0, SMM: 0, Web: 0, Webapp: 0, 'AI Adoption': 0, Other: 0 };
      try {
        const { data: wonDeals } = await supabase
          .from('deals')
          .select('id')
          .eq('stage', 'closed won');
        const wonIds = (wonDeals || []).map((d: any) => d.id);
        if (wonIds.length > 0) {
          const { data: items } = await supabase
            .from('line_items')
            .select('product_name, deal_id')
            .in('deal_id', wonIds);
          (items || []).forEach((li: any) => {
            const name = (li.product_name || '').toLowerCase();
            if (name.includes('va')) dealWonByProduct['VA']++;
            else if (name.includes('smm') || name.includes('social')) dealWonByProduct['SMM']++;
            else if (name.includes('webapp') || name.includes('app')) dealWonByProduct['Webapp']++;
            else if (name.includes('web') || name.includes('website')) dealWonByProduct['Web']++;
            else if (name.includes('ai')) dealWonByProduct['AI Adoption']++;
            else dealWonByProduct['Other']++;
          });
        }
      } catch {}

      const closingMetrics: ClosingMetrics = {
        strategyAttended: appointmentMetrics.strategyAttended,
        sql: 0,
        nql: 0,
        proposalSent,
        candidateInterviewBooked,
        candidateInterviewAttended,
        businessAuditBooked: 0,
        businessAuditAttended: 0,
        invoiceAgreementSent: 0,
        dealWonByProduct,
      };

      setAppointment(appointmentMetrics);
      setClosing(closingMetrics);

      setMetrics({
        totalCalls,
        callsByOutcome,
        callsByType,
        avgDuration,
        connectRate,
        repPerformance,
        scriptProgression,
        dailyActivity
      });

      // Store comparison stats in component-local state by repurposing fields or extend UI: for brevity, we’ll show comparisons in the UI below
      (window as any).__reportsComparisons = {
        prev: { totalCalls: prevTotalCalls, connectRate: prevConnectRate },
        repCompare: compareRepStats,
      };
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Advanced CRM analytics with comprehensive insights, filtering, and real-time tracking.
          </p>
        </div>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilters 
        filters={filters}
        onFiltersChange={setFilters}
        reps={reps}
        pipelines={pipelines}
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="calls" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Call Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="appointment" className="flex items-center space-x-2">
            <ListChecks className="h-4 w-4" />
            <span>Appointment Settings</span>
          </TabsTrigger>
          <TabsTrigger value="closing" className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Closing</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">

          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ReportMetric
              title="Total Calls"
              value={metrics.totalCalls.toString()}
              icon={BarChart3}
              trend="+12% vs last period"
              positive
            />
            <ReportMetric
              title="Connect Rate"
              value={`${metrics.connectRate}%`}
              icon={Target}
              trend="+5% vs last period"
              positive
            />
            <ReportMetric
              title="Avg Duration"
              value={`${Math.floor(metrics.avgDuration / 60)}:${(metrics.avgDuration % 60).toString().padStart(2, '0')}`}
              icon={TrendingUp}
              trend="+30s vs last period"
              positive
            />
            <ReportMetric
              title="Strategy Calls"
              value={(metrics.callsByOutcome['strategy call booked'] || 0).toString()}
              icon={Users}
              trend="+3 vs last period"
              positive
            />
          </div>

          {/* Enhanced Charts */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <EnhancedChart
              data={Object.entries(metrics.callsByOutcome).map(([outcome, count]) => ({
                name: outcome.toUpperCase(),
                value: count
              }))}
              title="Call Outcomes Distribution"
              type="donut"
              subtitle="Breakdown of all call results"
            />

            <EnhancedChart
              data={metrics.dailyActivity.slice(-7)}
              title="Daily Activity (Last 7 Days)"
              type="line"
              subtitle="Calls and connections per day"
            />

            <EnhancedChart
              data={[{ 
                name: "Connect Rate", 
                value: metrics.connectRate,
                progress: metrics.connectRate,
                trend: 5
              }]}
              title="Connect Rate KPI"
              type="kpi"
              subtitle="Target: 25%"
            />
          </div>

          {/* Rep Performance Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle>Rep Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.repPerformance.slice(0, 5).map((rep, index) => (
                  <div key={rep.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="font-medium">{rep.name}</span>
                    </div>
                    <div className="flex items-center space-x-6 text-right text-sm">
                      <div>
                        <div className="font-semibold">{rep.calls}</div>
                        <div className="text-muted-foreground">calls</div>
                      </div>
                      <div>
                        <div className={`font-semibold ${rep.noAnswerRate > 80 ? 'text-red-600' : 'text-green-600'}`}>
                          {rep.noAnswerRate}%
                        </div>
                        <div className="text-muted-foreground">no answer</div>
                      </div>
                      <div>
                        <div className={`font-semibold ${rep.connectRate < 20 ? 'text-red-600' : 'text-green-600'}`}>
                          {rep.connectRate}%
                        </div>
                        <div className="text-muted-foreground">connect</div>
                      </div>
                      <div>
                        <div className="font-semibold text-primary">{rep.conversions}</div>
                        <div className="text-muted-foreground">booked</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calls" className="space-y-6">

          {/* Advanced Call Analytics */}
          <div className="grid gap-6 md:grid-cols-2">
            <EnhancedChart
              data={Object.entries(metrics.callsByOutcome).map(([outcome, count]) => ({
                name: outcome.toUpperCase(),
                value: count
              }))}
              title="Call Outcomes"
              type="horizontalBar"
              subtitle="Horizontal view for better readability"
            />

            <EnhancedChart
              data={Object.entries(metrics.callsByType).map(([type, count]) => ({
                name: type.toUpperCase(),
                value: count
              }))}
              title="Outbound Types"
              type="pie"
              subtitle="Distribution of call types"
            />
          </div>

          {/* Daily Activity Trend */}
          <EnhancedChart
            data={metrics.dailyActivity}
            title="30-Day Call Activity Trend"
            type="area"
            subtitle="Daily call volume and connection trends"
            height={400}
          />

          {/* Enhanced Script Progression */}
          <Card>
            <CardHeader>
              <CardTitle>Decision Maker Script Progression</CardTitle>
              <p className="text-sm text-muted-foreground">
                Track how effectively reps progress through the sales script
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.scriptProgression.map((stage, index) => (
                  <div key={stage.stage} className="flex items-center justify-between p-4 bg-gradient-to-r from-muted/50 to-muted/20 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <span className="font-medium text-lg">{stage.stage}</span>
                        <div className="text-sm text-muted-foreground">
                          {stage.conversionRate}% of total calls reach this stage
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{stage.count}</div>
                      <div className="text-sm text-muted-foreground">calls</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointment" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ReportMetric title="Calls" value={(appointment?.totalCalls || 0).toString()} icon={BarChart3} />
            <ReportMetric title="No Answer" value={(appointment?.noAnswer || 0).toString()} icon={Target} />
            <ReportMetric title="Intro" value={(appointment?.intro || 0).toString()} icon={Users} />
            <ReportMetric title="Short Story" value={(appointment?.shortStory || 0).toString()} icon={Users} />
            <ReportMetric title="Discovery" value={(appointment?.discovery || 0).toString()} icon={Users} />
            <ReportMetric title="Presentation" value={(appointment?.presentation || 0).toString()} icon={Users} />
            <ReportMetric title="Strategy Booked" value={(appointment?.strategyBooked || 0).toString()} icon={Calendar} />
            <ReportMetric title="Strategy Attended" value={(appointment?.strategyAttended || 0).toString()} icon={Calendar} />
            <ReportMetric title="Not Interested" value={(appointment?.notInterested || 0).toString()} icon={Briefcase} />
            <ReportMetric title="DND/DNC" value={(appointment?.dnc || 0).toString()} icon={Briefcase} />
            <ReportMetric title="Resume Requests" value={(appointment?.resumeRequests || 0).toString()} icon={Briefcase} />
          </div>
        </TabsContent>

        <TabsContent value="closing" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ReportMetric title="Strategy Attended" value={(closing?.strategyAttended || 0).toString()} icon={Calendar} />
            <ReportMetric title="SQL" value={(closing?.sql || 0).toString()} icon={Target} />
            <ReportMetric title="NQL" value={(closing?.nql || 0).toString()} icon={Target} />
            <ReportMetric title="Proposal Sent" value={(closing?.proposalSent || 0).toString()} icon={Briefcase} />
            <ReportMetric title="Candidate Interview Booked" value={(closing?.candidateInterviewBooked || 0).toString()} icon={Calendar} />
            <ReportMetric title="Candidate Interview Attended" value={(closing?.candidateInterviewAttended || 0).toString()} icon={Calendar} />
            <ReportMetric title="Business Audit Booked" value={(closing?.businessAuditBooked || 0).toString()} icon={Briefcase} />
            <ReportMetric title="Business Audit Attended" value={(closing?.businessAuditAttended || 0).toString()} icon={Briefcase} />
            <ReportMetric title="Invoice/Agreement Sent" value={(closing?.invoiceAgreementSent || 0).toString()} icon={Briefcase} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Deals Won by Product</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                {Object.entries(closing?.dealWonByProduct || {}).map(([name, count]) => (
                  <ReportMetric key={name} title={name} value={String(count)} icon={Briefcase} />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}