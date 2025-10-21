import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, ShieldCheck, Activity, Database, Trash2, UserPlus, Clock, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  user_id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  is_active: boolean;
  timezone?: string | null;
}

interface EODReport {
  id: string;
  user_id: string;
  report_date: string;
  summary: string | null;
  started_at: string;
  submitted_at: string | null;
  user_profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

interface TimeEntry {
  id: string;
  eod_id: string;
  client_name: string;
  task_description: string;
  task_link: string | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
}

export default function Admin() {
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalDeals: 0,
    totalCompanies: 0,
    totalContacts: 0,
    calls30d: 0,
  });
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', first_name: '', last_name: '', password: '', role: 'eod_user' });
  const [eodReports, setEodReports] = useState<EODReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<EODReport | null>(null);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [reportImages, setReportImages] = useState<Array<{ id: string; url: string }>>([]);
  const [eodDateFilter, setEodDateFilter] = useState<string>('today');
  const { toast } = useToast();

  useEffect(() => {
    fetchMetrics();
    fetchUsers();
    fetchEODReports();
  }, [eodDateFilter]);

  const fetchMetrics = async () => {
    try {
      const [usersRes, activeRes, dealsRes, companiesRes, contactsRes, callsRes] = await Promise.all([
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('user_profiles').select('is_active', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('deals').select('id'),
        supabase.from('companies').select('id'),
        supabase.from('contacts').select('id'),
        supabase.from('calls').select('id').gte('call_timestamp', new Date(Date.now() - 30*24*60*60*1000).toISOString()),
      ]);

      setMetrics({
        totalUsers: usersRes.count || 0,
        activeUsers: activeRes.count || 0,
        totalDeals: (dealsRes.data || []).length,
        totalCompanies: (companiesRes.data || []).length,
        totalContacts: (contactsRes.data || []).length,
        calls30d: (callsRes.data || []).length,
      });
    } catch (e) {
      console.error('Failed to fetch admin metrics', e);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await supabase.from('user_profiles').select('*').order('first_name');
      setUsers(data || []);
    } catch (e) {
      console.error('Failed to fetch users', e);
    }
  };

  const fetchEODReports = async () => {
    try {
      // Apply date filter
      const now = new Date();
      let dateFilter = '';
      
      if (eodDateFilter === 'today') {
        const today = now.toISOString().split('T')[0];
        dateFilter = today;
      } else if (eodDateFilter === 'week') {
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      } else if (eodDateFilter === 'month') {
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }

      // Fetch reports with manual join via user_profiles
      const { data: reports, error } = await supabase
        .from('eod_reports')
        .select('*')
        .order('report_date', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching EOD reports:', error);
        toast({ title: 'Failed to fetch EOD reports', description: error.message, variant: 'destructive' });
        return;
      }

      // Filter by date if needed
      let filteredReports = reports || [];
      if (dateFilter) {
        if (eodDateFilter === 'today') {
          filteredReports = filteredReports.filter(r => r.report_date === dateFilter);
        } else {
          filteredReports = filteredReports.filter(r => r.report_date >= dateFilter);
        }
      }

      // Fetch user profiles for these reports
      const userIds = [...new Set(filteredReports.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', userIds);

      // Merge profile data with reports
      const reportsWithProfiles = filteredReports.map(report => {
        const profile = profiles?.find(p => p.user_id === report.user_id);
        return {
          ...report,
          user_profiles: profile ? {
            first_name: profile.first_name,
            last_name: profile.last_name,
            email: profile.email
          } : null
        };
      });

      console.log('Fetched EOD reports:', reportsWithProfiles);
      setEodReports(reportsWithProfiles);
    } catch (e: any) {
      console.error('Failed to fetch EOD reports', e);
      toast({ title: 'Error loading reports', description: e.message, variant: 'destructive' });
    }
  };

  const fetchReportDetails = async (report: EODReport) => {
    setSelectedReport(report);
    try {
      // Fetch time entries
      const { data: entries } = await supabase
        .from('eod_time_entries')
        .select('*')
        .eq('eod_id', report.id)
        .order('started_at', { ascending: false });
      setTimeEntries(entries || []);

      // Fetch images
      const { data: imgs } = await supabase
        .from('eod_report_images')
        .select('id, public_url')
        .eq('eod_id', report.id);
      setReportImages((imgs || []).map(i => ({ id: i.id, url: i.public_url || '' })));
    } catch (e) {
      console.error('Failed to fetch report details', e);
    }
  };

  const formatDuration = (minutes: number | null, startedAt?: string, endedAt?: string | null) => {
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

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => (
      `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    ));
  }, [users, search]);

  const updateUser = async (id: string, updates: Partial<UserProfile>) => {
    try {
      const { error } = await supabase.from('user_profiles').update(updates).eq('id', id);
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
      toast({ title: 'User updated' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Failed to update user', variant: 'destructive' });
    }
  };

  const createEODUser = async () => {
    if (!newUser.email || !newUser.first_name || !newUser.last_name || !newUser.password) {
      toast({ title: 'All fields including password are required', variant: 'destructive' });
      return;
    }
    if (newUser.password.length < 6) {
      toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-eod-user', {
        body: {
          email: newUser.email,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          password: newUser.password,
          role: newUser.role,
        },
      });
      
      if (error) throw error;
      
      if (data?.success) {
        toast({ 
          title: 'User created successfully!', 
          description: `Account created for ${newUser.email}. They can now log in.` 
        });
        setNewUser({ email: '', first_name: '', last_name: '', password: '', role: 'eod_user' });
        setCreateDialogOpen(false);
        fetchUsers();
      } else {
        throw new Error(data?.error || 'Failed to create user');
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Failed to create user', description: e.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Admin</h1>
          <p className="text-muted-foreground mt-1">Manage users, roles, and system health.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">{metrics.activeUsers} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Data Footprint</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Deals: <span className="font-semibold">{metrics.totalDeals}</span></div>
              <div>Companies: <span className="font-semibold">{metrics.totalCompanies}</span></div>
              <div>Contacts: <span className="font-semibold">{metrics.totalContacts}</span></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Activity (30d)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.calls30d}</div>
            <p className="text-xs text-muted-foreground">Calls logged</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & Access</TabsTrigger>
          <TabsTrigger value="eod">EOD Reports</TabsTrigger>
          <TabsTrigger value="ops">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="max-w-md" />
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create EOD User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create EOD User</DialogTitle>
                  <DialogDescription>
                    Create a complete account with login credentials. User can log in immediately after creation.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="user@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={newUser.first_name}
                      onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={newUser.last_name}
                      onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                      placeholder="Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="At least 6 characters"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={newUser.role} onValueChange={(role) => setNewUser({ ...newUser, role })}>
                      <SelectTrigger id="role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eod_user">EOD User</SelectItem>
                        <SelectItem value="rep">Rep</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={createEODUser} disabled={creating} className="w-full">
                    {creating ? 'Creating...' : 'Create User'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Timezone</TableHead>
                    <TableHead className="w-[120px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{`${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Unnamed'}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Select defaultValue={u.role || 'rep'} onValueChange={(role) => updateUser(u.id, { role })}>
                          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="rep">Rep</SelectItem>
                            <SelectItem value="eod_user">EOD User</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.is_active ? 'success' : 'secondary'}>{u.is_active ? 'Active' : 'Disabled'}</Badge>
                      </TableCell>
                      <TableCell>{u.timezone || 'PST'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => updateUser(u.id, { is_active: !u.is_active })}>{u.is_active ? 'Disable' : 'Enable'}</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Role Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Admins can manage users and settings. Managers can view reports and manage deals/users in their team. Reps can manage their deals and contacts.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eod" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  EOD Reports - Team Overview
                </CardTitle>
                <Select value={eodDateFilter} onValueChange={setEodDateFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Reports List */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">Reports ({eodReports.length})</h3>
                  <div className="border rounded-lg max-h-[600px] overflow-auto">
                    {eodReports.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        No reports found for this period
                      </div>
                    ) : (
                      <div className="divide-y">
                        {eodReports.map((report) => (
                          <div
                            key={report.id}
                            onClick={() => fetchReportDetails(report)}
                            className={`p-4 cursor-pointer hover:bg-accent transition-colors ${
                              selectedReport?.id === report.id ? 'bg-accent' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-medium">
                                  {report.user_profiles?.first_name} {report.user_profiles?.last_name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {report.user_profiles?.email}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {new Date(report.report_date).toLocaleDateString()}
                                </div>
                              </div>
                              <Badge variant={report.submitted_at ? "default" : "secondary"}>
                                {report.submitted_at ? "Submitted" : "Draft"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Report Details */}
                <div className="space-y-4">
                  {selectedReport ? (
                    <>
                      <div className="border rounded-lg p-4 space-y-4">
                        <div>
                          <h3 className="font-semibold mb-2">Report Details</h3>
                          <div className="text-sm space-y-1">
                            <div><strong>Date:</strong> {new Date(selectedReport.report_date).toLocaleDateString()}</div>
                            <div><strong>Started:</strong> {new Date(selectedReport.started_at).toLocaleString()}</div>
                            {selectedReport.submitted_at && (
                              <div><strong>Submitted:</strong> {new Date(selectedReport.submitted_at).toLocaleString()}</div>
                            )}
                          </div>
                        </div>

                        {selectedReport.summary && (
                          <div>
                            <h4 className="font-semibold text-sm mb-2">Summary</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedReport.summary}</p>
                          </div>
                        )}

                        {/* Time Entries */}
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Time Entries</h4>
                          {timeEntries.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No time entries</p>
                          ) : (
                            <div className="space-y-2">
                              {timeEntries.map((entry) => {
                                const totalMinutes = entry.duration_minutes || 
                                  (entry.ended_at ? Math.floor((new Date(entry.ended_at).getTime() - new Date(entry.started_at).getTime()) / (1000 * 60)) : 0);
                                return (
                                  <div key={entry.id} className="border rounded p-3 space-y-1 text-sm">
                                    <div className="flex items-start justify-between">
                                      <div className="font-medium">{entry.client_name}</div>
                                      <div className="text-muted-foreground">{formatDuration(entry.duration_minutes, entry.started_at, entry.ended_at)}</div>
                                    </div>
                                    <div className="text-muted-foreground">{entry.task_description}</div>
                                    {entry.task_link && (
                                      <div>
                                        <a
                                          href={entry.task_link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline flex items-center gap-1 text-xs"
                                        >
                                          <LinkIcon className="h-3 w-3" />
                                          View Task
                                        </a>
                                      </div>
                                    )}
                                    <div className="text-xs text-muted-foreground">
                                      {new Date(entry.started_at).toLocaleTimeString()} - {entry.ended_at ? new Date(entry.ended_at).toLocaleTimeString() : 'In Progress'}
                                    </div>
                                  </div>
                                );
                              })}
                              <div className="pt-2 border-t">
                                <strong>Total: {formatDuration(timeEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0))}</strong>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Images */}
                        {reportImages.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm mb-2">Attached Images ({reportImages.length})</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {reportImages.map((img) => (
                                <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={img.url}
                                    alt="Report attachment"
                                    className="w-full h-32 object-cover rounded border hover:opacity-80 transition-opacity"
                                  />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="border rounded-lg p-8 text-center text-muted-foreground">
                      Select a report to view details
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ops" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance</CardTitle>
            </CardHeader>
            <CardContent className="space-x-2">
              <Button variant="outline" onClick={fetchMetrics}>Refresh Metrics</Button>
              <Button variant="destructive"><Trash2 className="h-4 w-4 mr-1" /> Archive Old Logs</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


