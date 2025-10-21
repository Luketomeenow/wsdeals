import { useState, useEffect } from "react";
import { Bell, Mail, Phone, Calendar, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Notification {
  id: string;
  type: 'email_opened' | 'email_clicked' | 'task_due' | 'meeting_reminder' | 'call_missed' | 'eod_submitted' | 'task_created';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  dealId?: string;
  contactId?: string;
}

const notificationIcons = {
  email_opened: Mail,
  email_clicked: Mail,
  task_due: CheckCircle,
  meeting_reminder: Calendar,
  call_missed: Phone,
  eod_submitted: CheckCircle,
  task_created: CheckCircle,
};

export function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    setupRealtimeSubscriptions();
  }, []);

  const fetchNotifications = async () => {
    try {
      const notifications: Notification[] = [];
      
      // Check if user is admin
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user?.id || '')
        .single();
      
      const isAdmin = profile?.role === 'admin';

      // For admins: Fetch recent EOD reports (last 24 hours)
      if (isAdmin) {
        const { data: eodReports } = await supabase
          .from('eod_reports')
          .select('id, submitted_at, user_id')
          .not('submitted_at', 'is', null)
          .gte('submitted_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('submitted_at', { ascending: false })
          .limit(5);

        // Fetch user profiles for these reports
        if (eodReports && eodReports.length > 0) {
          const userIds = [...new Set(eodReports.map(r => r.user_id))];
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('user_id, first_name, last_name')
            .in('user_id', userIds);

          eodReports.forEach(report => {
            const profile = profiles?.find(p => p.user_id === report.user_id);
            const userName = profile
              ? `${profile.first_name} ${profile.last_name}`
              : 'A team member';
            notifications.push({
              id: 'eod_' + report.id,
              type: 'eod_submitted',
              title: 'EOD Report Submitted',
              message: `${userName} submitted their end-of-day report`,
              timestamp: report.submitted_at!,
              read: false,
              actionUrl: '/admin?tab=eod'
            });
          });
        }

        // For admins: Fetch recently created tasks (last 24 hours)
        const { data: recentTasks } = await supabase
          .from('tasks')
          .select('id, title, created_at, user_profiles!tasks_created_by_fkey(first_name, last_name)')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
          .limit(5);

        recentTasks?.forEach(task => {
          const creatorName = task.user_profiles
            ? `${task.user_profiles.first_name} ${task.user_profiles.last_name}`
            : 'Someone';
          notifications.push({
            id: 'task_' + task.id,
            type: 'task_created',
            title: 'New Task Created',
            message: `${creatorName} created: ${task.title}`,
            timestamp: task.created_at,
            read: false,
            actionUrl: '/tasks'
          });
        });
      }

      // Fetch tasks due soon
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, due_date, deals(name), contacts(first_name, last_name)')
        .eq('status', 'pending')
        .gte('due_date', new Date().toISOString())
        .lte('due_date', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
        .order('due_date', { ascending: true })
        .limit(5);

      tasks?.forEach(task => {
        const entityName = task.deals?.name || 
          (task.contacts ? `${task.contacts.first_name} ${task.contacts.last_name}` : 'Unknown');
        notifications.push({
          id: task.id,
          type: 'task_due',
          title: 'Task Due Soon',
          message: `${task.title} for ${entityName}`,
          timestamp: task.due_date!,
          read: false
        });
      });

      // Fetch upcoming meetings
      const { data: meetings } = await supabase
        .from('meetings')
        .select('id, title, scheduled_at, deal_id, deals(name)')
        .gte('scheduled_at', new Date().toISOString())
        .lte('scheduled_at', new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(5);

      meetings?.forEach(meeting => {
        const dealName = meeting.deals?.name || 'Unknown deal';
        notifications.push({
          id: meeting.id,
          type: 'meeting_reminder',
          title: 'Upcoming Meeting',
          message: `${meeting.title} with ${dealName}`,
          timestamp: meeting.scheduled_at,
          read: false,
          dealId: meeting.deal_id || undefined
        });
      });

      // Fetch recent email opens
      const { data: emails } = await supabase
        .from('emails')
        .select('id, subject, to_email, opened_at, clicked_at, deal_id, contact_id')
        .not('opened_at', 'is', null)
        .order('opened_at', { ascending: false })
        .limit(5);

      emails?.forEach(email => {
        if (email.clicked_at) {
          notifications.push({
            id: email.id + '_clicked',
            type: 'email_clicked',
            title: 'Email Link Clicked',
            message: `${email.to_email} clicked a link in: ${email.subject}`,
            timestamp: email.clicked_at,
            read: false,
            dealId: email.deal_id || undefined,
            contactId: email.contact_id || undefined
          });
        } else if (email.opened_at) {
          notifications.push({
            id: email.id + '_opened',
            type: 'email_opened',
            title: 'Email Opened',
            message: `${email.to_email} opened: ${email.subject}`,
            timestamp: email.opened_at,
            read: false,
            dealId: email.deal_id || undefined,
            contactId: email.contact_id || undefined
          });
        }
      });

      // Sort by timestamp
      notifications.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setNotifications(notifications);
      setUnreadCount(notifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const setupRealtimeSubscriptions = () => {

    const emailChannel = supabase
      .channel('email-notifications')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'emails'
      }, (payload) => {
        const emailData = payload.new as any;
        if (emailData.opened_at || emailData.clicked_at) {
          const newNotification: Notification = {
            id: emailData.id + (emailData.clicked_at ? '_clicked' : '_opened'),
            type: emailData.clicked_at ? 'email_clicked' : 'email_opened',
            title: emailData.clicked_at ? 'Email Link Clicked' : 'Email Opened',
            message: `${emailData.to_email} ${emailData.clicked_at ? 'clicked a link in' : 'opened'}: ${emailData.subject}`,
            timestamp: new Date().toISOString(),
            read: false,
            dealId: emailData.deal_id,
            contactId: emailData.contact_id
          };
          
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      })
      .subscribe();

    const taskChannel = supabase
      .channel('task-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tasks'
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    // Listen for EOD report submissions
    const eodChannel = supabase
      .channel('eod-notifications')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'eod_reports',
        filter: 'submitted_at=neq.null'
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    const meetingChannel = supabase
      .channel('meeting-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'meetings'
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      emailChannel.unsubscribe();
      taskChannel.unsubscribe();
      meetingChannel.unsubscribe();
    };
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications(notifications.filter(n => n.id !== notificationId));
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {open && (
        <Card className="absolute right-0 top-full mt-2 w-96 max-h-96 overflow-y-auto z-50 shadow-large">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <CardTitle className="text-base">Notifications</CardTitle>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button size="sm" variant="ghost" onClick={markAllAsRead}>
                  Mark all read
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="mx-auto h-12 w-12 mb-2" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => {
                  const IconComponent = notificationIcons[notification.type];
                  return (
                    <div
                      key={notification.id}
                      className={`flex items-start space-x-3 p-3 hover:bg-muted/50 transition-colors ${
                        !notification.read ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                      }`}
                    >
                      <div className={`p-1 rounded-full ${
                        notification.type === 'email_opened' ? 'bg-blue-100 text-blue-600' :
                        notification.type === 'email_clicked' ? 'bg-green-100 text-green-600' :
                        notification.type === 'task_due' ? 'bg-orange-100 text-orange-600' :
                        notification.type === 'meeting_reminder' ? 'bg-purple-100 text-purple-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(notification.timestamp)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => dismissNotification(notification.id)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs h-6"
                            >
                              Mark as read
                            </Button>
                          )}
                          {notification.actionUrl && (
                            <Button size="sm" className="text-xs h-6">
                              Take Action
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}