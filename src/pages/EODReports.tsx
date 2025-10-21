import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function EODReports() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [endedAt, setEndedAt] = useState<Date | null>(null);
  const [images, setImages] = useState<Array<{ id: string; url: string }>>([]);

  const started = useMemo(() => !!startedAt, [startedAt]);
  const ended = useMemo(() => !!endedAt, [endedAt]);

  useEffect(() => {
    loadToday();
  }, []);

  const loadToday = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const { data: report } = await supabase
        .from('eod_reports')
        .select('*')
        .eq('report_date', dateStr)
        .maybeSingle();

      if (report) {
        setReportId(report.id);
        setSummary(report.summary || "");
        setStartedAt(report.started_at ? new Date(report.started_at) : null);
        setEndedAt(report.ended_at ? new Date(report.ended_at) : null);

        const { data: imgs } = await supabase
          .from('eod_report_images')
          .select('id, public_url')
          .eq('eod_id', report.id);
        setImages((imgs || []).map(i => ({ id: i.id, url: i.public_url || '' })));
      }
    } finally {
      setLoading(false);
    }
  };

  const startTimer = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('eod_reports')
        .insert([{ started_at: new Date().toISOString() }])
        .select('*')
        .single();
      if (error) throw error;
      setReportId(data.id);
      setStartedAt(new Date(data.started_at));
      toast({ title: 'Timer started' });
    } catch (e: any) {
      toast({ title: 'Failed to start', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const stopTimer = async () => {
    if (!reportId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('eod_reports')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', reportId)
        .select('*')
        .single();
      if (error) throw error;
      setEndedAt(new Date(data.ended_at));
      toast({ title: 'Timer stopped' });
    } catch (e: any) {
      toast({ title: 'Failed to stop', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const saveSummary = async () => {
    if (!reportId) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('eod_reports')
        .update({ summary, updated_at: new Date().toISOString() })
        .eq('id', reportId);
      if (error) throw error;
      toast({ title: 'Saved' });
    } catch (e: any) {
      toast({ title: 'Failed to save', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!reportId) {
      toast({ title: 'Start EOD first', description: 'Start timer before uploading images', variant: 'destructive' });
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const ext = file.name.split('.').pop();
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const path = `eod-${reportId}/${name}`;
      const { error: upErr } = await supabase.storage.from('eod-images').upload(path, file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('eod-images').getPublicUrl(path);
      const { data: row, error: rowErr } = await supabase
        .from('eod_report_images')
        .insert([{ eod_id: reportId, path, public_url: publicUrl }])
        .select('id')
        .single();
      if (rowErr) throw rowErr;
      setImages(prev => [...prev, { id: row.id, url: publicUrl }]);
      toast({ title: 'Image uploaded' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>End of Day Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            {!started && (
              <Button onClick={startTimer} disabled={loading}>Start</Button>
            )}
            {started && !ended && (
              <Button variant="destructive" onClick={stopTimer} disabled={loading}>Stop</Button>
            )}
            {startedAt && <span className="text-sm text-muted-foreground">Started: {startedAt.toLocaleTimeString()}</span>}
            {endedAt && <span className="text-sm text-muted-foreground">Ended: {endedAt.toLocaleTimeString()}</span>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Summary</label>
            <Textarea value={summary} onChange={(e)=>setSummary(e.target.value)} rows={6} placeholder="What did you accomplish today?" />
            <Button onClick={saveSummary} disabled={loading || !reportId}>Save</Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Upload Images</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {images.map(img => (
                <img key={img.id} src={img.url} alt="eod" className="rounded border" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


