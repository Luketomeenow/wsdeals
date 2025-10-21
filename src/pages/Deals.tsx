import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, TrendingUp, DollarSign, Target, Activity, Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DealForm } from "@/components/deals/DealForm";
import { DragDropPipeline } from "@/components/pipeline/DragDropPipeline";
import { DealListView } from "@/components/pipeline/DealListView";
import { AdvancedFilters } from "@/components/pipeline/AdvancedFilters";
import { PipelineManager } from "@/components/pipeline/PipelineManager";
import { useDebounce } from "@/hooks/useDebounce";

interface Deal {
  id: string;
  name: string;
  stage: string;
  amount?: number;
  close_date?: string;
  created_at: string;
  priority: string;
  timezone?: string;
  pipeline_id?: string;
  companies?: { id: string; name: string; phone?: string };
  contacts?: { id: string; first_name: string; last_name: string; phone?: string };
}

interface Pipeline {
  id: string;
  name: string;
  description: string | null;
  stages: string[];
  stage_order?: Array<{ name: string; color: string }>;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface FilterState {
  stages: string[];
  priorities: string[];
  amountRange: [number, number];
  dateRange: { from?: Date; to?: Date };
  search: string;
  companies: string[];
}

export default function Deals() {
  const [viewMode, setViewMode] = useState<"pipeline" | "list">("pipeline");
  const [deals, setDeals] = useState<Deal[]>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [assignees, setAssignees] = useState<Array<{ id: string; name: string }>>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewDealForm, setShowNewDealForm] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    stages: [],
    priorities: [],
    amountRange: [0, 1000000],
    dateRange: {},
    search: "",
    companies: [],
  });
  
  // Debounce search for better performance
  const debouncedSearch = useDebounce(filters.search, 300);

  useEffect(() => {
    fetchPipelines();
    fetchDeals();
    fetchCompanies();
    fetchAssignees();
  }, []);

  useEffect(() => {
    if (selectedPipeline) {
      fetchDeals();
    }
  }, [selectedPipeline]);

  const fetchPipelines = async () => {
    try {
      const { data, error } = await supabase
        .from("pipelines")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true});

      if (error) throw error;
      
      // Cast the data to proper Pipeline type
      const pipelines = (data || []).map((p: any) => {
        let stages: string[];
        let stageOrder: Array<{ name: string; color: string }> = [];
        
        // Parse stages - handle both formats
        if (Array.isArray(p.stages)) {
          // Check if stages are objects {name, position, color} or strings
          if (p.stages.length > 0 && typeof p.stages[0] === 'object' && p.stages[0].name) {
            // Old format: array of objects
            stages = p.stages.map((s: any) => s.name.toLowerCase());
            stageOrder = p.stages.map((s: any) => ({ name: s.name, color: s.color }));
          } else {
            // New format: array of strings
            stages = p.stages;
            stageOrder = p.stage_order ? (Array.isArray(p.stage_order) ? p.stage_order : JSON.parse(p.stage_order as string)) : [];
          }
        } else {
          stages = JSON.parse(p.stages as string);
          stageOrder = p.stage_order ? JSON.parse(p.stage_order as string) : [];
        }
        
        return {
          ...p,
          stages,
          stage_order: stageOrder,
        };
      }) as Pipeline[];
      
      setPipelines(pipelines);
      
      // Set first pipeline as default if none selected
      if (pipelines.length > 0 && !selectedPipeline) {
        setSelectedPipeline(pipelines[0].id);
      }
    } catch (error) {
      console.error("Error fetching pipelines:", error);
    }
  };

  const fetchDeals = async () => {
    try {
      let query = supabase
        .from("deals")
        .select(`
          *,
          companies (id, name, phone),
          contacts:primary_contact_id (id, first_name, last_name, phone)
        `);

      // Filter by selected pipeline
      if (selectedPipeline) {
        query = query.eq("pipeline_id", selectedPipeline);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      setDeals(data || []);
    } catch (error) {
      console.error("Error fetching deals:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const fetchAssignees = async () => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, first_name, last_name")
        .order("first_name");

      if (error) throw error;
      setAssignees(
        (data || []).map((u) => ({ id: u.id, name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Unknown' }))
      );
    } catch (error) {
      console.error("Error fetching assignees:", error);
    }
  };

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      if (filters.stages.length > 0 && !filters.stages.includes(deal.stage)) {
        return false;
      }

      if (filters.priorities.length > 0 && !filters.priorities.includes(deal.priority)) {
        return false;
      }

      if (deal.amount) {
        if (deal.amount < filters.amountRange[0] || deal.amount > filters.amountRange[1]) {
          return false;
        }
      }

      if (filters.dateRange.from || filters.dateRange.to) {
        const closeDate = deal.close_date ? new Date(deal.close_date) : null;
        if (closeDate) {
          if (filters.dateRange.from && closeDate < filters.dateRange.from) {
            return false;
          }
          if (filters.dateRange.to && closeDate > filters.dateRange.to) {
            return false;
          }
        }
      }

      // Use debounced search for better performance
      const searchLower = debouncedSearch.toLowerCase();
      if (searchLower) {
        const matchesName = deal.name.toLowerCase().includes(searchLower);
        const matchesCompany = deal.companies?.name.toLowerCase().includes(searchLower);
        const matchesContact = deal.contacts 
          ? `${deal.contacts.first_name} ${deal.contacts.last_name}`.toLowerCase().includes(searchLower)
          : false;
        
        if (!matchesName && !matchesCompany && !matchesContact) {
          return false;
        }
      }

      if (filters.companies.length > 0) {
        const companyId = deal.companies?.id;
        if (!companyId || !filters.companies.includes(companyId)) return false;
      }

      return true;
    });
  }, [deals, filters.stages, filters.priorities, filters.amountRange, filters.dateRange, debouncedSearch, filters.companies]);

  const pipelineMetrics = useMemo(() => {
    const totalDeals = filteredDeals.length;
    const totalValue = filteredDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
    const closedWonDeals = filteredDeals.filter(d => d.stage === "closed won");
    const closedWonValue = closedWonDeals.reduce((sum, deal) => sum + (deal.amount || 0), 0);
    const conversionRate = totalDeals > 0 ? (closedWonDeals.length / totalDeals) * 100 : 0;

    return {
      totalDeals,
      totalValue,
      closedWonCount: closedWonDeals.length,
      closedWonValue,
      conversionRate,
    };
  }, [filteredDeals]);

  const handleStageChange = useCallback(async (dealId: string, newStage: string) => {
    try {
      const { error } = await supabase
        .from("deals")
        .update({ stage: newStage as any })
        .eq("id", dealId);

      if (error) throw error;

      setDeals((prevDeals) =>
        prevDeals.map((deal) =>
          deal.id === dealId ? { ...deal, stage: newStage } : deal
        )
      );
    } catch (error) {
      console.error("Error updating deal stage:", error);
    }
  }, []);

  const handleFiltersChange = useCallback((newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const currentPipeline = pipelines.find(p => p.id === selectedPipeline);
  const pipelineStages = currentPipeline?.stages || [];

  return (
    <div className="flex flex-col p-6 space-y-6 bg-gradient-subtle">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Sales Pipeline
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your deals through the sales pipeline
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "pipeline" | "list")}>
            <TabsList>
              <TabsTrigger value="pipeline">Pipeline View</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => {
            setShowNewDealForm(true);
            document.getElementById('new-deal-trigger')?.click();
          }} className="shadow-glow">
            <Plus className="mr-2 h-4 w-4" />
            New Deal
          </Button>
        </div>
      </div>

      {/* Pipeline Selector and Search Bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium whitespace-nowrap">Pipeline:</label>
          <Select value={selectedPipeline || undefined} onValueChange={setSelectedPipeline}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Select pipeline" />
            </SelectTrigger>
            <SelectContent>
              {pipelines.map((pipeline) => (
                <SelectItem key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <PipelineManager onPipelineCreated={fetchPipelines} />
        </div>

        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search deals, companies, contacts..."
              className="pl-10"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Advanced Filters - Always hidden for now */}
      <AdvancedFilters 
        isOpen={advancedOpen}
        onToggle={() => setAdvancedOpen(!advancedOpen)}
        dealStages={pipelineStages}
        companies={companies}
        assignees={assignees}
        onFiltersChange={(f) => {
          setFilters((prev) => ({
            ...prev,
            stages: f.stages,
            priorities: f.priorities as any,
            amountRange: f.amountRange,
            dateRange: f.dateRange,
            // Keep the existing search value from quick search
            search: prev.search,
            companies: f.companies,
          }));
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Deals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipelineMetrics.totalDeals}</div>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${pipelineMetrics.totalValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Closed Won</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pipelineMetrics.closedWonCount} / ${pipelineMetrics.closedWonValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft hover:shadow-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pipelineMetrics.conversionRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 overflow-auto">
        {viewMode === "pipeline" ? (
          <DragDropPipeline 
            deals={filteredDeals} 
            onDealUpdate={fetchDeals}
            stages={pipelineStages}
            stageColors={currentPipeline?.stage_order?.reduce((acc, stage) => {
              acc[stage.name.toLowerCase()] = stage.color;
              return acc;
            }, {} as Record<string, string>)}
          />
        ) : (
          <DealListView deals={filteredDeals} onStageChange={handleStageChange} />
        )}
      </div>

      <DealForm onSuccess={fetchDeals}>
        <Button style={{ display: 'none' }} id="new-deal-trigger" />
      </DealForm>
    </div>
  );
}
