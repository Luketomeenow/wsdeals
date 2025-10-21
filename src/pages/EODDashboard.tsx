import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Eye, Download } from "lucide-react";
import { format } from "date-fns";
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface EODReport {
  id: string;
  user_id: string;
  report_date: string;
  started_at: string | null;
  ended_at: string | null;
  total_minutes: number | null;
  summary: string | null;
  full_name: string | null;
  email: string;
}

export default function EODDashboard() {
  const { toast } = useToast();
  const [reports, setReports] = useState<EODReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date>(new Date());
  const [selectedReport, setSelectedReport] = useState<EODReport | null>(null);
  const [images, setImages] = useState<Array<{ id: string; url: string }>>([]);

  useEffect(() => {
    loadReports();
  }, [date]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('eod_reports')
        .select(`
          *,
          user_profiles!inner(full_name, email)
        `)
        .eq('report_date', dateStr)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        report_date: r.report_date,
        started_at: r.started_at,
        ended_at: r.ended_at,
        total_minutes: r.total_minutes,
        summary: r.summary,
        full_name: r.user_profiles?.full_name,
        email: r.user_profiles?.email,
      }));
      setReports(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const [timeEntries, setTimeEntries] = useState<Array<any>>([]);

  const viewReport = async (report: EODReport) => {
    setSelectedReport(report);
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
    setTimeEntries(entries || []);
  };

  const calculateHours = (start: string | null, end: string | null) => {
    if (!start || !end) return 'N/A';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const exportToExcel = () => {
    try {
      const exportData = reports.map(report => ({
        'Team Member': report.full_name || 'Unknown',
        'Email': report.email,
        'Date': report.report_date,
        'Started': report.started_at ? format(new Date(report.started_at), 'h:mm a') : '-',
        'Ended': report.ended_at ? format(new Date(report.ended_at), 'h:mm a') : '-',
        'Hours Worked': calculateHours(report.started_at, report.ended_at),
        'Status': report.ended_at ? 'Completed' : report.started_at ? 'In Progress' : 'Not Started',
        'Summary': report.summary || 'No summary provided',
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'EOD Reports');

      // Auto-size columns
      const maxWidth = exportData.reduce((acc, row) => {
        Object.keys(row).forEach(key => {
          const value = String(row[key as keyof typeof row]);
          acc[key] = Math.max(acc[key] || 10, value.length);
        });
        return acc;
      }, {} as Record<string, number>);

      ws['!cols'] = Object.keys(maxWidth).map(key => ({ wch: Math.min(maxWidth[key] + 2, 50) }));

      const fileName = `EOD_Reports_${format(date, 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast({ title: 'Export successful', description: `Downloaded ${fileName}` });
    } catch (error: any) {
      toast({ title: 'Export failed', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Team EOD Reports</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportToExcel} disabled={reports.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export to Excel
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(date, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground">Loading...</p>
          ) : reports.length === 0 ? (
            <p className="text-center text-muted-foreground">No reports for this date</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Member</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Ended</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{report.full_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{report.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {report.started_at ? format(new Date(report.started_at), 'h:mm a') : '-'}
                    </TableCell>
                    <TableCell>
                      {report.ended_at ? format(new Date(report.ended_at), 'h:mm a') : '-'}
                    </TableCell>
                    <TableCell>{calculateHours(report.started_at, report.ended_at)}</TableCell>
                    <TableCell>
                      {report.ended_at ? (
                        <Badge variant="default">Completed</Badge>
                      ) : report.started_at ? (
                        <Badge variant="secondary">In Progress</Badge>
                      ) : (
                        <Badge variant="outline">Not Started</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => viewReport(report)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedReport?.full_name}'s Report - {selectedReport?.report_date}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {timeEntries.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Time Entries</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Task</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timeEntries.map((entry: any) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">{entry.client_name}</TableCell>
                          <TableCell>{entry.task_description}</TableCell>
                          <TableCell>{new Date(entry.started_at).toLocaleTimeString()}</TableCell>
                          <TableCell>
                            {entry.duration_minutes ? `${Math.floor(entry.duration_minutes / 60)}h ${entry.duration_minutes % 60}m` : 'Running'}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} className="font-bold text-right">Total:</TableCell>
                        <TableCell className="font-bold">
                          {(() => {
                            const total = timeEntries.reduce((sum: number, e: any) => sum + (e.duration_minutes || 0), 0);
                            return `${Math.floor(total / 60)}h ${total % 60}m`;
                          })()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            <div>
              <h4 className="font-semibold mb-2">Summary</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {selectedReport?.summary || 'No summary provided'}
              </p>
            </div>
            {images.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Images</h4>
                <div className="grid grid-cols-2 gap-4">
                  {images.map(img => (
                    <img key={img.id} src={img.url} alt="eod" className="rounded border w-full" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

