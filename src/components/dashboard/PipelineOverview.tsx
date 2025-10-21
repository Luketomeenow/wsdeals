import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface StageData {
  name: string;
  count: number;
  value: number;
}

export function PipelineOverview() {
  const [pipelineStages, setPipelineStages] = useState<StageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPipelineData();
  }, []);

  const fetchPipelineData = async () => {
    try {
      const { data: deals, error } = await supabase
        .from('deals')
        .select('stage, amount');

      if (error) throw error;

      // Group deals by stage
      const stageMap = new Map<string, { count: number; value: number }>();
      
      deals?.forEach(deal => {
        const stage = deal.stage || 'not contacted';
        const current = stageMap.get(stage) || { count: 0, value: 0 };
        stageMap.set(stage, {
          count: current.count + 1,
          value: current.value + (deal.amount || 0)
        });
      });

      // Convert to array with formatted names
      const stages: StageData[] = Array.from(stageMap.entries()).map(([stage, data]) => ({
        name: stage.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        count: data.count,
        value: data.value
      }));

      // Sort by typical pipeline order
      const stageOrder = [
        'not contacted', 'no answer / gatekeeper', 'decision maker', 
        'nurturing', 'interested', 'strategy call booked', 
        'strategy call attended', 'proposal / scope', 'closed won', 'closed lost'
      ];
      
      stages.sort((a, b) => {
        const indexA = stageOrder.indexOf(a.name.toLowerCase());
        const indexB = stageOrder.indexOf(b.name.toLowerCase());
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
      });

      setPipelineStages(stages);
    } catch (error) {
      console.error('Error fetching pipeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalValue = pipelineStages.reduce((sum, stage) => sum + stage.value, 0);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : pipelineStages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No pipeline data</div>
        ) : (
          <>
            <div className="space-y-4">
              {pipelineStages.map((stage) => (
                <div key={stage.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stage.name}</span>
                    <span className="text-muted-foreground">
                      {stage.count} deals • ${stage.value.toLocaleString()}
                    </span>
                  </div>
                  <Progress 
                    value={totalValue > 0 ? (stage.value / totalValue) * 100 : 0} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm font-medium">
                <span>Total Pipeline Value</span>
                <span>${totalValue.toLocaleString()}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}