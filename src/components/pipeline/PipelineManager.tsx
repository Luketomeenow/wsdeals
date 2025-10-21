import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Settings, Trash2, GripVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Pipeline {
  id: string;
  name: string;
  description: string | null;
  stages: string[];
  stage_order: Array<{ name: string; color: string }>;
  is_active: boolean;
}

interface PipelineManagerProps {
  onPipelineCreated?: () => void;
}

export function PipelineManager({ onPipelineCreated }: PipelineManagerProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null);
  const [editDraft, setEditDraft] = useState<{ name: string; description: string; stages: Array<{ name: string; color: string }> } | null>(null);
  const [newPipeline, setNewPipeline] = useState({
    name: "",
    description: "",
    stages: ["Stage 1", "Stage 2", "Stage 3"],
  });

  useEffect(() => {
    if (open) {
      loadPipelines();
    }
  }, [open]);

  const loadPipelines = async () => {
    try {
      const { data, error } = await supabase
        .from("pipelines")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPipelines(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading pipelines",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const createPipeline = async () => {
    if (!newPipeline.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a pipeline name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const stageOrder = newPipeline.stages.map((stage, index) => ({
        name: stage,
        color: index === 0 ? "#9CA3AF" : index === newPipeline.stages.length - 1 ? "#10B981" : "#3B82F6",
      }));

      const { error } = await supabase.from("pipelines").insert([
        {
          name: newPipeline.name,
          description: newPipeline.description,
          stages: newPipeline.stages.map(s => s.toLowerCase()),
          stage_order: stageOrder,
          is_active: true,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Pipeline created",
        description: `${newPipeline.name} has been created successfully`,
      });

      setNewPipeline({ name: "", description: "", stages: ["Stage 1", "Stage 2", "Stage 3"] });
      loadPipelines();
      onPipelineCreated?.();
    } catch (error: any) {
      toast({
        title: "Error creating pipeline",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deletePipeline = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pipeline?")) return;

    try {
      const { error } = await supabase.from("pipelines").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Pipeline deleted",
        description: "The pipeline has been removed",
      });

      loadPipelines();
      onPipelineCreated?.();
    } catch (error: any) {
      toast({
        title: "Error deleting pipeline",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addStage = () => {
    setNewPipeline({
      ...newPipeline,
      stages: [...newPipeline.stages, `Stage ${newPipeline.stages.length + 1}`],
    });
  };

  const updateStage = (index: number, value: string) => {
    const updated = [...newPipeline.stages];
    updated[index] = value;
    setNewPipeline({ ...newPipeline, stages: updated });
  };

  const removeStage = (index: number) => {
    if (newPipeline.stages.length <= 2) {
      toast({
        title: "Minimum stages required",
        description: "A pipeline must have at least 2 stages",
        variant: "destructive",
      });
      return;
    }
    const updated = newPipeline.stages.filter((_, i) => i !== index);
    setNewPipeline({ ...newPipeline, stages: updated });
  };

  const beginEdit = (p: Pipeline) => {
    const stages: Array<{ name: string; color: string }> =
      p.stage_order && p.stage_order.length
        ? p.stage_order.map(s => ({ name: s.name, color: s.color }))
        : (p.stages || []).map((s, i) => ({ name: s, color: i === 0 ? "#9CA3AF" : i === (p.stages.length - 1) ? "#10B981" : "#3B82F6" }));
    setEditingPipeline(p);
    setEditDraft({ name: p.name, description: p.description || "", stages });
  };

  const cancelEdit = () => {
    setEditingPipeline(null);
    setEditDraft(null);
  };

  const addEditStage = () => {
    if (!editDraft) return;
    setEditDraft({ ...editDraft, stages: [...editDraft.stages, { name: `Stage ${editDraft.stages.length + 1}`, color: "#3B82F6" }] });
  };

  const updateEditStageName = (idx: number, value: string) => {
    if (!editDraft) return;
    const stages = [...editDraft.stages];
    stages[idx] = { ...stages[idx], name: value };
    setEditDraft({ ...editDraft, stages });
  };

  const updateEditStageColor = (idx: number, value: string) => {
    if (!editDraft) return;
    const stages = [...editDraft.stages];
    stages[idx] = { ...stages[idx], color: value };
    setEditDraft({ ...editDraft, stages });
  };

  const removeEditStage = (idx: number) => {
    if (!editDraft) return;
    if (editDraft.stages.length <= 2) {
      toast({ title: "Minimum stages required", description: "A pipeline must have at least 2 stages", variant: "destructive" });
      return;
    }
    const stages = editDraft.stages.filter((_, i) => i !== idx);
    setEditDraft({ ...editDraft, stages });
  };

  const saveEdit = async () => {
    if (!editingPipeline || !editDraft) return;
    if (!editDraft.name.trim()) {
      toast({ title: "Name required", description: "Please enter a pipeline name", variant: "destructive" });
      return;
    }
    try {
      setLoading(true);
      const normalizedStages = editDraft.stages.map(s => s.name.toLowerCase());
      const stageOrder = editDraft.stages.map(s => ({ name: s.name, color: s.color }));
      const { error } = await supabase
        .from("pipelines")
        .update({ name: editDraft.name, description: editDraft.description, stages: normalizedStages, stage_order: stageOrder })
        .eq("id", editingPipeline.id);
      if (error) throw error;
      toast({ title: "Pipeline updated", description: `${editDraft.name} has been saved` });
      await loadPipelines();
      cancelEdit();
      onPipelineCreated?.();
    } catch (error: any) {
      toast({ title: "Error updating pipeline", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Manage Pipelines
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pipeline Management</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {editingPipeline && editDraft && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Edit Pipeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Pipeline Name</label>
                  <Input value={editDraft.name} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea rows={2} value={editDraft.description} onChange={(e) => setEditDraft({ ...editDraft, description: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Stages</label>
                    <Button size="sm" variant="outline" onClick={addEditStage}>
                      <Plus className="mr-1 h-3 w-3" /> Add Stage
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {editDraft.stages.map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium w-6">{i + 1}.</span>
                        <Input value={s.name} onChange={(e) => updateEditStageName(i, e.target.value)} placeholder={`Stage ${i + 1}`} />
                        <Input type="color" value={s.color} onChange={(e) => updateEditStageColor(i, e.target.value)} className="w-12 p-1" />
                        <Button size="sm" variant="ghost" onClick={() => removeEditStage(i)} disabled={editDraft.stages.length <= 2}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={cancelEdit} disabled={loading}>Cancel</Button>
                  <Button onClick={saveEdit} disabled={loading}>Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Create New Pipeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Create New Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Pipeline Name</label>
                <Input
                  placeholder="e.g., Sales Pipeline, Customer Success"
                  value={newPipeline.name}
                  onChange={(e) => setNewPipeline({ ...newPipeline, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description (Optional)</label>
                <Textarea
                  placeholder="Describe the purpose of this pipeline"
                  value={newPipeline.description}
                  onChange={(e) => setNewPipeline({ ...newPipeline, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Pipeline Stages</label>
                  <Button size="sm" variant="outline" onClick={addStage}>
                    <Plus className="mr-1 h-3 w-3" />
                    Add Stage
                  </Button>
                </div>
                <div className="space-y-2">
                  {newPipeline.stages.map((stage, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium w-6">{index + 1}.</span>
                      <Input
                        value={stage}
                        onChange={(e) => updateStage(index, e.target.value)}
                        placeholder={`Stage ${index + 1}`}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeStage(index)}
                        disabled={newPipeline.stages.length <= 2}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={createPipeline} disabled={loading} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Create Pipeline
              </Button>
            </CardContent>
          </Card>

          {/* Existing Pipelines */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Existing Pipelines</CardTitle>
            </CardHeader>
            <CardContent>
              {pipelines.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No pipelines yet</p>
              ) : (
                <div className="space-y-4">
                  {pipelines.map((pipeline) => (
                    <div
                      key={pipeline.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{pipeline.name}</h4>
                          {pipeline.description && (
                            <p className="text-sm text-muted-foreground">{pipeline.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="outline" onClick={() => beginEdit(pipeline)}>
                            <Settings className="mr-1 h-4 w-4" /> Edit
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => deletePipeline(pipeline.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {pipeline.stage_order?.map((stage, index) => (
                          <Badge
                            key={index}
                            style={{ backgroundColor: stage.color }}
                            className="text-white"
                          >
                            {stage.name}
                          </Badge>
                        )) || pipeline.stages?.map((stage, index) => (
                          <Badge key={index} variant="secondary">
                            {stage}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

