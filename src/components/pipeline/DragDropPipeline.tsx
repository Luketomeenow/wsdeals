import { useState, useEffect, useMemo, memo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DraggableDealCard } from "./DraggableDealCard";
import { DroppableStage } from "./DroppableStage";

interface Deal {
  id: string;
  name: string;
  stage: string;
  amount?: number;
  close_date?: string;
  created_at: string;
  priority: string;
  timezone?: string;
  companies?: { name: string };
  contacts?: { first_name: string; last_name: string };
}

interface DragDropPipelineProps {
  deals?: Deal[];
  onDealUpdate?: () => void;
  stages?: string[];
  stageColors?: Record<string, string>;
}

const defaultStageColors: Record<string, string> = {
  "not contacted": "#9CA3AF",
  "no answer / gatekeeper": "#9CA3AF",
  "decision maker": "#F59E0B",
  "nurturing": "#9CA3AF",
  "interested": "#3B82F6",
  "strategy call booked": "#3B82F6", 
  "strategy call attended": "#3B82F6",
  "proposal / scope": "#10B981",
  "closed won": "#10B981",
  "closed lost": "#EF4444",
  "uncontacted": "#9CA3AF",
  "dm connected": "#F59E0B",
  "bizops audit agreement sent": "#8B5CF6",
  "bizops audit paid / booked": "#8B5CF6",
  "bizops audit attended": "#8B5CF6",
  "ms agreement sent": "#10B981",
  "balance paid / deal won": "#10B981",
  "not interested": "#EF4444",
  "not qualified": "#EF4444",
  "onboarding call booked": "#3B82F6",
  "onboarding call attended": "#3B82F6",
  "active client (operator)": "#10B981",
  "active client - project in progress": "#10B981",
  "paused client": "#F59E0B",
  "candidate replacement": "#F59E0B",
  "project rescope / expansion": "#8B5CF6",
  "active client - project maintenance": "#10B981",
  "cancelled / completed": "#6B7280"
};

const priorityColors = {
  high: "destructive",
  medium: "warning",
  low: "secondary"
} as const;

// Normalize stage strings to EXACT enum values - defined outside component for stability
const normalizeStage = (raw: string): string => {
  if (!raw) return 'not contacted';
  let s = raw.toLowerCase().trim();
  // Normalize spacing around slashes/dashes first
  s = s.replace(/\s*[\/\-]\s*/g, ' / ').replace(/\s+/g, ' ').trim();
  
  // Map ALL variants to the EXACT enum values from the database
  const stageMapping: Record<string, string> = {
    // Base enum values (these are the ONLY valid values in DB)
    'not contacted': 'not contacted',
    'no answer / gatekeeper': 'no answer / gatekeeper',
    'decision maker': 'decision maker',
    'nurturing': 'nurturing',
    'interested': 'interested',
    'strategy call booked': 'strategy call booked',
    'strategy call attended': 'strategy call attended',
    'proposal / scope': 'proposal / scope',
    'closed won': 'closed won',
    'closed lost': 'closed lost',
    
    // Extended enum values from migrations
    'uncontacted': 'uncontacted',
    'dm connected': 'dm connected',
    'not qualified': 'not qualified',
    'not interested': 'not interested',
    'bizops audit agreement sent': 'bizops audit agreement sent',
    'bizops audit paid / booked': 'bizops audit paid / booked',
    'bizops audit attended': 'bizops audit attended',
    'ms agreement sent': 'ms agreement sent',
    'balance paid / deal won': 'balance paid / deal won',
    'onboarding call booked': 'onboarding call booked',
    'onboarding call attended': 'onboarding call attended',
    'active client (operator)': 'active client (operator)',
    'active client - project in progress': 'active client - project in progress',
    'paused client': 'paused client',
    'candidate replacement': 'candidate replacement',
    'project rescope / expansion': 'project rescope / expansion',
    'active client - project maintenance': 'active client - project maintenance',
    'cancelled / completed': 'cancelled / completed',
    
    // Variants/synonyms that need mapping
    'no answers / gatekeeper': 'no answer / gatekeeper',
    'gatekeeper': 'no answer / gatekeeper',
    'dm': 'dm connected',
    'proposal': 'proposal / scope',
    'scope': 'proposal / scope',
    'won': 'closed won',
    'lost': 'closed lost',
    'not qualified / disqualified': 'not qualified',
    'disqualified': 'not qualified',
    'do not call': 'not interested',
    'dnc': 'not interested',
    'candidate interview booked': 'strategy call booked',
    'candidate interview attended': 'strategy call attended',
  };
  
  return stageMapping[s] || 'not contacted'; // Safe fallback
};

export function DragDropPipeline({ deals = [], onDealUpdate, stages: propStages, stageColors: propStageColors }: DragDropPipelineProps) {
  const stages = propStages || [
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

  const stageColors = propStageColors || defaultStageColors;
  const [localDeals, setLocalDeals] = useState<Deal[]>(deals);
  const [loading, setLoading] = useState(false);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [draggedOverStage, setDraggedOverStage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Reduced for instant drag response
      },
    })
  );

  useEffect(() => {
    console.log('[DragDrop] Deals prop updated, syncing local state. Count:', deals.length);
    setLocalDeals(deals);
  }, [deals]);


  const updateDealStage = useCallback(async (dealId: string, newStage: string) => {
    // Prevent concurrent updates
    if (isUpdating) {
      console.log('[DragDrop] Update already in progress, skipping');
      return;
    }

    const normalized = normalizeStage(newStage);
    console.log('[DragDrop] Updating deal stage:', {
      dealId,
      displayLabel: newStage,
      normalized,
      willSaveTo: normalized
    });
    
    setIsUpdating(true);
    
    // Save original state for potential revert
    const originalDeals = [...localDeals];
    
    // Optimistic update for immediate UX feedback
    setLocalDeals(prev => prev.map(deal => 
      deal.id === dealId ? { ...deal, stage: normalized } : deal
    ));

    try {
      const { error } = await supabase
        .from('deals')
        .update({ stage: normalized })
        .eq('id', dealId);

      if (error) {
        console.error('[DragDrop] Database error:', error);
        // Revert to original state on error
        setLocalDeals(originalDeals);
        toast({
          title: "Error",
          description: error.message || "Failed to update deal",
          variant: "destructive",
        });
        setIsUpdating(false);
        return;
      }

      console.log('[DragDrop] Successfully updated stage to:', normalized);
      
      // DO NOT call onDealUpdate immediately - let optimistic update persist
      // This prevents the deal from jumping around due to race conditions
      // The parent will refresh on next natural data fetch

      toast({
        title: "Deal Updated",
        description: `Moved to ${newStage}`,
      });
    } catch (error: any) {
      console.error('[DragDrop] Error updating deal:', error);
      // Revert to original state on error
      setLocalDeals(originalDeals);
      toast({
        title: "Error",
        description: error.message || "Failed to update deal",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [localDeals, toast, isUpdating]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const deal = localDeals.find(d => d.id === active.id);
    setActiveDeal(deal || null);
  }, [localDeals]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      setDraggedOverStage(over.id as string);
    } else {
      setDraggedOverStage(null);
    }
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveDeal(null);
    setDraggedOverStage(null);
    
    if (!over) return;
    
    const dealId = active.id as string;
    const stageLabel = over.id as string; // This is the display label from the pipeline
    
    // Only update if it's a valid stage
    const deal = localDeals.find(d => d.id === dealId);
    if (deal && stages.includes(stageLabel)) {
      const normalizedNew = normalizeStage(stageLabel);
      const normalizedCurrent = normalizeStage(deal.stage);
      // Only update if actually different
      if (normalizedNew !== normalizedCurrent) {
        updateDealStage(dealId, stageLabel);
      }
    }
  }, [localDeals, stages, updateDealStage]);

  const dealsByStage = useMemo(() => {
    return stages.reduce((acc, stageLabel) => {
      const key = normalizeStage(stageLabel);
      acc[stageLabel] = localDeals.filter(deal => normalizeStage(deal.stage) === key);
    return acc;
  }, {} as Record<string, Deal[]>);
  }, [localDeals, stages]);

  const getStageTotal = useMemo(() => {
    return (stage: string) => {
    return dealsByStage[stage]?.reduce((sum, deal) => sum + (deal.amount || 0), 0) || 0;
  };
  }, [dealsByStage]);

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading...</div>;
  }

  return (
    <div className="h-full">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >

        {/* Kanban Columns */}
        <div className="overflow-x-auto">
          <div className="inline-flex gap-6 p-6 min-w-max">
            {stages.map((stage, index) => {
              const stageDeals = dealsByStage[stage] || [];
              const stageTotal = getStageTotal(stage);
              
              return (
                <div key={stage} className="w-80 flex-shrink-0">
                  {/* Stage Header */}
                  <div 
                    className="p-4 rounded-t-xl shadow-md border border-b-0"
                    style={{
                      backgroundColor: stageColors[normalizeStage(stage)] ? `${stageColors[normalizeStage(stage)]}20` : '#f1f5f920',
                      borderColor: stageColors[normalizeStage(stage)] || '#e5e7eb'
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-base capitalize text-foreground">
                        {stage}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-background/80 text-xs font-semibold">
                          {stageDeals.length}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Stage Metrics */}
                    <div className="space-y-1">
                      {stageTotal > 0 && (
                        <div className="text-sm font-medium text-muted-foreground">
                          ${stageTotal.toLocaleString()}
                        </div>
                      )}
                      <div className="w-full bg-background/50 rounded-full h-1.5">
                        <div 
                          className="h-1.5 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min((stageDeals.length / Math.max(...stages.map(s => (dealsByStage[s] || []).length), 1)) * 100, 100)}%`,
                            backgroundColor: stageColors[normalizeStage(stage)] || '#94a3b8'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Drop Zone */}
                  <DroppableStage 
                    id={stage} 
                    isOver={draggedOverStage === stage}
                  >
                    <div className={`min-h-[600px] max-h-[600px] overflow-y-auto p-4 border border-t-0 rounded-b-xl shadow-md transition-all duration-200 ${
                      draggedOverStage === stage 
                        ? 'bg-primary/5 border-primary/30 shadow-lg' 
                        : 'bg-background/50 border-border/40'
                    } backdrop-blur-sm scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent`}>
                      <SortableContext items={stageDeals.map(d => d.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3">
                          {stageDeals.map((deal) => (
                            <DraggableDealCard 
                              key={deal.id}
                              deal={deal} 
                              isDragging={activeDeal?.id === deal.id}
                            />
                          ))}
                        </div>
                      </SortableContext>
                      
                      {/* Empty State */}
                      {stageDeals.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                          <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                            <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
                          </div>
                          <p className="text-sm">No deals yet</p>
                          <p className="text-xs opacity-75">Drop deals here</p>
                        </div>
                      )}
                    </div>
                  </DroppableStage>
                </div>
              );
            })}
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDeal ? (
            <div className="rotate-3 scale-105">
              <DraggableDealCard 
                deal={activeDeal} 
                isDragging={true}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Updating deal...</p>
          </div>
        </div>
      )}
    </div>
  );
}