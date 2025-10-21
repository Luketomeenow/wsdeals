import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Clock, LogOut, Upload, Play, Square, Trash2, Link as LinkIcon, Image as ImageIcon, Search } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface TimeEntry {
  id: string;
  client_name: string;
  task_description: string;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  task_link?: string | null;
}

export default function EODPortal() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const [images, setImages] = useState<Array<{ id: string; url: string }>>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [clientOpen, setClientOpen] = useState(false);
  const [taskDescription, setTaskDescription] = useState("");
  const [taskLink, setTaskLink] = useState("");
  const [clients, setClients] = useState<Array<{ name: string }>>([]);
  const [stopDialog, setStopDialog] = useState(false);
  const [stoppedEntry, setStoppedEntry] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    loadClients();
  }, []);

  // Handle paste event for images
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const blob = items[i].getAsFile();
          if (blob) {
            await uploadImageBlob(blob);
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [reportId]);

  const checkAuth = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      navigate('/eod-login');
      return;
    }
    setUser(authUser);
    loadToday();
  };

  const loadClients = async () => {
    try {
      const { data: deals } = await supabase
        .from('deals')
        .select('name, companies(name)')
        .order('name');
      
      const clientNames = new Set<string>();
      deals?.forEach(deal => {
        if (deal.name) clientNames.add(deal.name);
        if ((deal as any).companies?.name) clientNames.add((deal as any).companies.name);
      });

      const { data: companies } = await supabase
        .from('companies')
        .select('name')
        .order('name');
      
      companies?.forEach(c => {
        if (c.name) clientNames.add(c.name);
      });

      setClients(Array.from(clientNames).map(name => ({ name })).slice(0, 100));
    } catch (e) {
      console.error('Failed to load clients:', e);
    }
  };


  const loadToday = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: report } = await supabase
        .from('eod_reports')
        .select('*')
        .eq('report_date', today)
        .maybeSingle();

      if (report) {
        setReportId(report.id);
        setSummary(report.summary || "");

        const { data: imgs } = await supabase
          .from('eod_report_images')
          .select('id, public_url')
          .eq('eod_id', report.id);
        setImages((imgs || []).map(i => ({ id: i.id, url: i.public_url || '' })));

        const { data: entries } = await supabase
          .from('eod_time_entries')
          .select('*')
          .eq('eod_id', report.id)
          .order('started_at', { ascending: false });
        
        const activeTimer = (entries || []).find((e: TimeEntry) => !e.ended_at);
        setActiveEntry(activeTimer || null);
        setTimeEntries(entries || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const startTimer = async () => {
    if (!clientName) {
      toast({ title: 'Client required', variant: 'destructive' });
      return;
    }
    if (!taskDescription) {
      toast({ title: 'Task description required', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      let eodId = reportId;
      if (!eodId) {
        const { data, error } = await supabase
          .from('eod_reports')
          .insert([{ user_id: user.id, started_at: new Date().toISOString() }])
          .select('*')
          .single();
        if (error) throw error;
        eodId = data.id;
        setReportId(eodId);
      }

      const { data: entry, error: entryError } = await supabase
        .from('eod_time_entries')
        .insert([{
          eod_id: eodId,
          user_id: user.id,
          client_name: clientName,
          task_description: taskDescription,
          task_link: taskLink || null,
          started_at: new Date().toISOString(),
        }])
        .select('*')
        .single();

      if (entryError) throw entryError;
      setActiveEntry(entry);
      setTimeEntries(prev => [entry, ...prev]);
      setClientName("");
      setTaskDescription("");
      setTaskLink("");
      toast({ title: 'Timer started', description: `Working on: ${clientName}` });
    } catch (e: any) {
      toast({ title: 'Failed to start', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const stopTimer = async () => {
    if (!activeEntry) return;
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const startTime = new Date(activeEntry.started_at).getTime();
      const endTime = new Date(now).getTime();
      const durationMinutes = Math.floor((endTime - startTime) / (1000 * 60));

      const { error } = await supabase
        .from('eod_time_entries')
        .update({ ended_at: now, duration_minutes: durationMinutes })
        .eq('id', activeEntry.id);

      if (error) throw error;
      
      setStoppedEntry({
        ...activeEntry,
        ended_at: now,
        duration_minutes: durationMinutes,
        started_at_formatted: new Date(activeEntry.started_at).toLocaleString(),
        ended_at_formatted: new Date(now).toLocaleString(),
        duration_formatted: `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`,
      });
      setStopDialog(true);
      setActiveEntry(null);
      await loadToday();
    } catch (e: any) {
      toast({ title: 'Failed to stop', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase.from('eod_time_entries').delete().eq('id', id);
      if (error) throw error;
      setTimeEntries(prev => prev.filter(e => e.id !== id));
      if (activeEntry?.id === id) setActiveEntry(null);
      toast({ title: 'Entry deleted' });
    } catch (e: any) {
      toast({ title: 'Failed to delete', description: e.message, variant: 'destructive' });
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
      
      try {
        await supabase.functions.invoke('eod-notify', {
          body: { eod_id: reportId, user_email: user?.email, user_name: user?.email?.split('@')[0] },
        });
      } catch (e) {
        console.log('Email notification skipped:', e);
      }
      
      toast({ title: 'Summary saved and submitted' });
    } catch (e: any) {
      toast({ title: 'Failed to save', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const uploadImageBlob = async (blob: Blob) => {
    if (!reportId) {
      toast({ title: 'Start EOD first', description: 'Start timer before uploading', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const ext = 'png';
      const name = `paste-${Date.now()}.${ext}`;
      const path = `eod-${reportId}/${name}`;
      const { error: upErr } = await supabase.storage.from('eod-images').upload(path, blob);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('eod-images').getPublicUrl(path);
      const { data: row, error: rowErr } = await supabase
        .from('eod_report_images')
        .insert([{ eod_id: reportId, user_id: user.id, path, public_url: publicUrl }])
        .select('id')
        .single();
      if (rowErr) throw rowErr;
      setImages(prev => [...prev, { id: row.id, url: publicUrl }]);
      toast({ title: 'Image pasted successfully' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image', variant: 'destructive' });
      return;
    }
    await uploadImageBlob(file);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/eod-login');
  };

  const formatDuration = (minutes: number | null, startedAt?: string, endedAt?: string | null) => {
    // If duration is not set but we have start and end times, calculate it
    if (!minutes && startedAt && endedAt) {
      const startTime = new Date(startedAt).getTime();
      const endTime = new Date(endedAt).getTime();
      minutes = Math.floor((endTime - startTime) / (1000 * 60));
    }
    
    if (!minutes || minutes <= 0) return 'N/A';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  const totalMinutes = timeEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">EOD Report</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Time Tracking - Total: {formatDuration(totalMinutes)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Client / Deal</label>
                <Popover open={clientOpen} onOpenChange={setClientOpen}>
                  <PopoverTrigger asChild disabled={!!activeEntry}>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={clientOpen}
                      className="w-full justify-between"
                      disabled={!!activeEntry}
                    >
                      {clientName || "Select or search client..."}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Search clients..." 
                        value={clientSearch}
                        onValueChange={setClientSearch}
                      />
                      <CommandEmpty>
                        <Button
                          variant="ghost"
                          className="w-full"
                          onClick={() => {
                            setClientName(clientSearch);
                            setClientOpen(false);
                            setClientSearch("");
                          }}
                        >
                          Use "{clientSearch}" as client name
                        </Button>
                      </CommandEmpty>
                      <CommandGroup className="max-h-[200px] overflow-auto">
                        {clients
                          .filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
                          .map((client, i) => (
                            <CommandItem
                              key={i}
                              value={client.name}
                              onSelect={() => {
                                setClientName(client.name);
                                setClientOpen(false);
                                setClientSearch("");
                              }}
                            >
                              {client.name}
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Task Description</label>
                <Textarea 
                  value={taskDescription} 
                  onChange={(e) => setTaskDescription(e.target.value)} 
                  placeholder="What are you working on?"
                  disabled={!!activeEntry}
                  rows={1}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Task Link (Optional)
              </label>
              <Input
                type="url"
                value={taskLink}
                onChange={(e) => setTaskLink(e.target.value)}
                placeholder="https://example.com/task/123"
                disabled={!!activeEntry}
              />
            </div>

            <div className="flex gap-2">
              {!activeEntry ? (
                <Button onClick={startTimer} disabled={loading}>
                  <Play className="mr-2 h-4 w-4" />
                  Start Timer
                </Button>
              ) : (
                <div className="flex items-center gap-4">
                  <Button variant="destructive" onClick={stopTimer} disabled={loading}>
                    <Square className="mr-2 h-4 w-4" />
                    Stop Timer
                  </Button>
                  <div className="text-sm">
                    <strong>Active:</strong> {activeEntry.client_name} - {activeEntry.task_description}
                  </div>
                </div>
              )}
            </div>

            {timeEntries.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Link</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeEntries.map(entry => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.client_name}</TableCell>
                        <TableCell>{entry.task_description}</TableCell>
                        <TableCell>
                          {entry.task_link ? (
                            <a 
                              href={entry.task_link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <LinkIcon className="h-3 w-3" />
                              Link
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{new Date(entry.started_at).toLocaleTimeString()}</TableCell>
                        <TableCell>{entry.ended_at ? formatDuration(entry.duration_minutes, entry.started_at, entry.ended_at) : '⏱️ Running...'}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => deleteEntry(entry.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea 
              ref={textareaRef}
              value={summary} 
              onChange={(e) => setSummary(e.target.value)} 
              rows={8} 
              placeholder="Summarize your accomplishments, challenges, and key takeaways..."
              className="resize-none"
            />
            <Button onClick={saveSummary} disabled={loading || !reportId}>
              Save & Submit Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Upload or Paste Images
            </CardTitle>
            <p className="text-sm text-muted-foreground">Press Ctrl+V (Cmd+V on Mac) to paste screenshots</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="image-upload" className="cursor-pointer">
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload or paste images</p>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </label>
            </div>
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map(img => (
                  <img key={img.id} src={img.url} alt="eod" className="rounded border shadow-sm w-full h-48 object-cover" />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stop Timer Details Dialog */}
      <Dialog open={stopDialog} onOpenChange={setStopDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Time Entry Complete</DialogTitle>
            <DialogDescription>Here's a summary of your work session</DialogDescription>
          </DialogHeader>
          {stoppedEntry && (
            <div className="space-y-3">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Client:</span>
                  <span>{stoppedEntry.client_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Task:</span>
                  <span className="text-sm">{stoppedEntry.task_description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Started:</span>
                  <span className="text-sm">{stoppedEntry.started_at_formatted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Ended:</span>
                  <span className="text-sm">{stoppedEntry.ended_at_formatted}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="font-bold">Duration:</span>
                  <span className="font-bold text-primary">{stoppedEntry.duration_formatted}</span>
                </div>
              </div>
              <Button onClick={() => setStopDialog(false)} className="w-full">Done</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
