import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Eye, MousePointer, TrendingUp, AlertCircle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EnhancedChart, MultiSeriesChart } from "./EnhancedCharts";
import { useToast } from "@/hooks/use-toast";

interface EmailMetrics {
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  openRate: number;
  clickRate: number;
  deliveryRate: number;
  byStatus: Array<{ name: string; value: number }>;
  byWeek: Array<{ name: string; sent: number; opened: number; clicked: number }>;
  recentActivity: Array<{
    id: string;
    subject: string;
    to_email: string;
    status: string;
    sent_at: string;
    opened_at?: string;
    clicked_at?: string;
  }>;
}

export function EmailTracker() {
  const [metrics, setMetrics] = useState<EmailMetrics>({
    totalSent: 0,
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
    openRate: 0,
    clickRate: 0,
    deliveryRate: 0,
    byStatus: [],
    byWeek: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEmailMetrics();
    
    // Set up real-time subscription for email notifications
    const subscription = supabase
      .channel('email_notifications')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'emails',
        filter: 'status=eq.opened'
      }, (payload) => {
        handleEmailOpened(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleEmailOpened = (emailData: any) => {
    toast({
      title: "Email Opened! 📧",
      description: `${emailData.to_email} just opened: "${emailData.subject}"`,
      duration: 5000,
    });
    
    // Refresh metrics to show updated data
    fetchEmailMetrics();
  };

  const fetchEmailMetrics = async () => {
    try {
      const { data: emails, error } = await supabase
        .from('emails')
        .select('*')
        .order('sent_at', { ascending: false });

      if (error) throw error;

      const totalSent = emails?.length || 0;
      const delivered = emails?.filter(e => ['delivered', 'opened', 'clicked'].includes(e.status)).length || 0;
      const opened = emails?.filter(e => ['opened', 'clicked'].includes(e.status)).length || 0;
      const clicked = emails?.filter(e => e.status === 'clicked').length || 0;
      const bounced = emails?.filter(e => e.status === 'bounced').length || 0;

      const openRate = totalSent > 0 ? Math.round((opened / totalSent) * 100) : 0;
      const clickRate = opened > 0 ? Math.round((clicked / opened) * 100) : 0;
      const deliveryRate = totalSent > 0 ? Math.round((delivered / totalSent) * 100) : 0;

      // Group by status
      const statusGroups: { [key: string]: number } = {};
      emails?.forEach(email => {
        statusGroups[email.status] = (statusGroups[email.status] || 0) + 1;
      });

      const byStatus = Object.entries(statusGroups).map(([status, count]) => ({
        name: status.toUpperCase(),
        value: count
      }));

      // Group by week (last 8 weeks)
      const now = new Date();
      const weekGroups: { [key: string]: { sent: number; opened: number; clicked: number } } = {};
      
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i * 7));
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        const weekKey = `Week ${8 - i}`;
        weekGroups[weekKey] = { sent: 0, opened: 0, clicked: 0 };
        
        emails?.forEach(email => {
          const emailDate = new Date(email.sent_at);
          if (emailDate >= weekStart && emailDate <= weekEnd) {
            weekGroups[weekKey].sent++;
            if (['opened', 'clicked'].includes(email.status)) {
              weekGroups[weekKey].opened++;
            }
            if (email.status === 'clicked') {
              weekGroups[weekKey].clicked++;
            }
          }
        });
      }

      const byWeek = Object.entries(weekGroups).map(([week, data]) => ({
        name: week,
        sent: data.sent,
        opened: data.opened,
        clicked: data.clicked
      }));

      // Recent activity (last 10 emails)
      const recentActivity = emails?.slice(0, 10).map(email => ({
        id: email.id,
        subject: email.subject,
        to_email: email.to_email,
        status: email.status,
        sent_at: email.sent_at,
        opened_at: email.opened_at,
        clicked_at: email.clicked_at
      })) || [];

      setMetrics({
        totalSent,
        delivered,
        opened,
        clicked,
        bounced,
        openRate,
        clickRate,
        deliveryRate,
        byStatus,
        byWeek,
        recentActivity
      });
    } catch (error) {
      console.error('Error fetching email metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'opened': return 'bg-purple-100 text-purple-800';
      case 'clicked': return 'bg-orange-100 text-orange-800';
      case 'bounced': return 'bg-red-100 text-red-800';
      case 'failed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-32">Loading email data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Email Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Send className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-bold">{metrics.totalSent}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Delivery Rate</p>
                <p className="text-2xl font-bold">{metrics.deliveryRate}%</p>
                <Badge variant={metrics.deliveryRate >= 95 ? "default" : "destructive"}>
                  {metrics.deliveryRate >= 95 ? "Excellent" : "Check Setup"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Eye className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open Rate</p>
                <p className="text-2xl font-bold">{metrics.openRate}%</p>
                <Badge variant={metrics.openRate >= 20 ? "default" : "secondary"}>
                  {metrics.openRate >= 20 ? "Good" : "Industry Avg: 21%"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MousePointer className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Click Rate</p>
                <p className="text-2xl font-bold">{metrics.clickRate}%</p>
                <Badge variant={metrics.clickRate >= 3 ? "default" : "secondary"}>
                  {metrics.clickRate >= 3 ? "Good" : "Industry Avg: 2.6%"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bounced</p>
                <p className="text-2xl font-bold">{metrics.bounced}</p>
                <Badge variant={metrics.bounced === 0 ? "default" : "destructive"}>
                  {metrics.bounced === 0 ? "Clean List" : "Review Contacts"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <EnhancedChart
          data={metrics.byStatus}
          title="Email Status Distribution"
          type="donut"
          subtitle="Current email status breakdown"
        />

        <MultiSeriesChart
          data={metrics.byWeek}
          title="Weekly Email Performance"
          series={[
            { key: 'sent', name: 'Sent', color: 'hsl(var(--primary))' },
            { key: 'opened', name: 'Opened', color: 'hsl(var(--chart-2))' },
            { key: 'clicked', name: 'Clicked', color: 'hsl(var(--chart-3))' }
          ]}
          type="bar"
        />
      </div>

      {/* Recent Email Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Email Activity</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchEmailMetrics}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.recentActivity.map((email) => (
              <div key={email.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(email.status)}>
                      {email.status}
                    </Badge>
                    <span className="font-medium truncate max-w-xs">{email.subject}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    To: {email.to_email} • Sent: {new Date(email.sent_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  {email.opened_at && (
                    <Badge variant="outline" className="text-xs">
                      <Eye className="mr-1 h-3 w-3" />
                      {new Date(email.opened_at).toLocaleTimeString()}
                    </Badge>
                  )}
                  {email.clicked_at && (
                    <Badge variant="outline" className="text-xs">
                      <MousePointer className="mr-1 h-3 w-3" />
                      {new Date(email.clicked_at).toLocaleTimeString()}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}