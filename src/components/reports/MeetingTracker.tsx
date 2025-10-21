import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, TrendingUp, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EnhancedChart } from "./EnhancedCharts";

interface MeetingMetrics {
  totalBooked: number;
  totalAttended: number;
  attendanceRate: number;
  byType: Array<{ name: string; booked: number; attended: number }>;
  byWeek: Array<{ name: string; booked: number; attended: number }>;
  upcoming: number;
}

export function MeetingTracker() {
  const [metrics, setMetrics] = useState<MeetingMetrics>({
    totalBooked: 0,
    totalAttended: 0,
    attendanceRate: 0,
    byType: [],
    byWeek: [],
    upcoming: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMeetingMetrics();
  }, []);

  const fetchMeetingMetrics = async () => {
    try {
      const { data: meetings, error } = await supabase
        .from('meetings')
        .select('*');

      if (error) throw error;

      const totalBooked = meetings?.length || 0;
      const totalAttended = meetings?.filter(m => m.is_attended).length || 0;
      const attendanceRate = totalBooked > 0 ? Math.round((totalAttended / totalBooked) * 100) : 0;

      // Group by meeting type
      const typeGroups: { [key: string]: { booked: number; attended: number } } = {};
      meetings?.forEach(meeting => {
        if (!typeGroups[meeting.meeting_type]) {
          typeGroups[meeting.meeting_type] = { booked: 0, attended: 0 };
        }
        typeGroups[meeting.meeting_type].booked++;
        if (meeting.is_attended) {
          typeGroups[meeting.meeting_type].attended++;
        }
      });

      const byType = Object.entries(typeGroups).map(([type, data]) => ({
        name: type.replace('_', ' ').toUpperCase(),
        booked: data.booked,
        attended: data.attended
      }));

      // Group by week (last 8 weeks)
      const now = new Date();
      const weekGroups: { [key: string]: { booked: number; attended: number } } = {};
      
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i * 7));
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        const weekKey = `Week ${8 - i}`;
        weekGroups[weekKey] = { booked: 0, attended: 0 };
        
        meetings?.forEach(meeting => {
          const meetingDate = new Date(meeting.scheduled_at);
          if (meetingDate >= weekStart && meetingDate <= weekEnd) {
            weekGroups[weekKey].booked++;
            if (meeting.is_attended) {
              weekGroups[weekKey].attended++;
            }
          }
        });
      }

      const byWeek = Object.entries(weekGroups).map(([week, data]) => ({
        name: week,
        booked: data.booked,
        attended: data.attended
      }));

      // Count upcoming meetings
      const upcoming = meetings?.filter(meeting => {
        const meetingDate = new Date(meeting.scheduled_at);
        return meetingDate > now && meeting.is_booked;
      }).length || 0;

      setMetrics({
        totalBooked,
        totalAttended,
        attendanceRate,
        byType,
        byWeek,
        upcoming
      });
    } catch (error) {
      console.error('Error fetching meeting metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-32">Loading meeting data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Meeting Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Booked</p>
                <p className="text-2xl font-bold">{metrics.totalBooked}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Attended</p>
                <p className="text-2xl font-bold">{metrics.totalAttended}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Attendance Rate</p>
                <p className="text-2xl font-bold">{metrics.attendanceRate}%</p>
                <Badge variant={metrics.attendanceRate >= 80 ? "default" : "destructive"}>
                  {metrics.attendanceRate >= 80 ? "Excellent" : "Needs Improvement"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold">{metrics.upcoming}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <EnhancedChart
          data={metrics.byType.map(item => ({
            name: item.name,
            value: item.attended,
            booked: item.booked
          }))}
          title="Meeting Attendance by Type"
          type="bar"
          subtitle="Comparing booked vs attended meetings"
        />

        <EnhancedChart
          data={[{ name: "Attendance Rate", value: metrics.attendanceRate }]}
          title="Overall Attendance Rate"
          type="gauge"
          subtitle="Target: 80% or higher"
        />
      </div>

      {/* Weekly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Meeting Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.byWeek.map((week) => (
              <div key={week.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-8 bg-primary text-primary-foreground rounded flex items-center justify-center text-sm font-medium">
                    {week.name.split(' ')[1]}
                  </div>
                  <span className="font-medium">{week.name}</span>
                </div>
                <div className="flex items-center space-x-4 text-right">
                  <div>
                    <div className="text-sm text-muted-foreground">Booked</div>
                    <div className="font-semibold">{week.booked}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Attended</div>
                    <div className="font-semibold text-green-600">{week.attended}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Rate</div>
                    <div className="font-semibold">
                      {week.booked > 0 ? Math.round((week.attended / week.booked) * 100) : 0}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}