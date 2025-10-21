import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Plus, MapPin, Clock, Link as LinkIcon, CheckCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Meeting {
  id: string;
  title: string;
  description?: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_type: string;
  is_booked: boolean;
  is_attended: boolean;
  location?: string;
  meeting_link?: string;
  notes?: string;
  created_at: string;
}

interface MeetingManagerProps {
  dealId: string;
  contactId?: string;
  companyId?: string;
}

const meetingTypes = [
  { value: 'consultation', label: 'Consultation' },
  { value: 'strategy_call', label: 'Strategy Call' },
  { value: 'demo', label: 'Product Demo' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'closing', label: 'Closing Call' },
  { value: 'candidate_interview', label: 'Interview' }
];

export function MeetingManager({ dealId, contactId, companyId }: MeetingManagerProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduled_at: '',
    duration_minutes: 30,
    meeting_type: 'consultation',
    location: '',
    meeting_link: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchMeetings();
  }, [dealId]);

  const fetchMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('deal_id', dealId)
        .order('scheduled_at', { ascending: false });

      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch meetings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async () => {
    if (!formData.title || !formData.scheduled_at) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('meetings')
        .insert({
          ...formData,
          meeting_type: formData.meeting_type as any,
          deal_id: dealId,
          contact_id: contactId,
          company_id: companyId,
          is_booked: true,
          is_attended: false
        })
        .select()
        .single();

      if (error) throw error;

      setMeetings([data, ...meetings]);
      setIsCreating(false);
      setFormData({
        title: '',
        description: '',
        scheduled_at: '',
        duration_minutes: 30,
        meeting_type: 'consultation',
        location: '',
        meeting_link: ''
      });

      toast({
        title: "Meeting Scheduled",
        description: "Meeting has been added to the calendar",
      });
    } catch (error) {
      console.error('Error creating meeting:', error);
      toast({
        title: "Error",
        description: "Failed to create meeting",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttended = async (meetingId: string, attended: boolean) => {
    try {
      const { error } = await supabase
        .from('meetings')
        .update({ is_attended: attended })
        .eq('id', meetingId);

      if (error) throw error;

      setMeetings(meetings.map(meeting => 
        meeting.id === meetingId ? { ...meeting, is_attended: attended } : meeting
      ));

      toast({
        title: "Meeting Updated",
        description: `Meeting marked as ${attended ? 'attended' : 'not attended'}`,
      });
    } catch (error) {
      console.error('Error updating meeting:', error);
      toast({
        title: "Error",
        description: "Failed to update meeting",
        variant: "destructive",
      });
    }
  };

  if (loading && meetings.length === 0) {
    return <div className="flex items-center justify-center h-32">Loading meetings...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Create Meeting Button */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="h-4 w-4 mr-1" />
            Schedule Meeting
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Schedule New Meeting</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Meeting Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Strategy call with client"
                />
              </div>
              <div>
                <Label>Meeting Type</Label>
                <Select value={formData.meeting_type} onValueChange={(value) => setFormData({ ...formData, meeting_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {meetingTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Meeting agenda and objectives..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                />
              </div>
              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 30 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Conference Room A or Video Call"
                />
              </div>
              <div>
                <Label>Meeting Link</Label>
                <Input
                  value={formData.meeting_link}
                  onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                  placeholder="https://zoom.us/j/..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateMeeting} disabled={!formData.title || !formData.scheduled_at}>
                Schedule Meeting
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Meetings List */}
      <div className="space-y-4">
        {meetings.length > 0 ? (
          meetings.map((meeting) => (
            <Card key={meeting.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{meeting.title}</h3>
                      <Badge variant="outline">
                        {meetingTypes.find(t => t.value === meeting.meeting_type)?.label}
                      </Badge>
                      {meeting.is_attended ? (
                        <Badge variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Attended
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Scheduled</Badge>
                      )}
                    </div>
                    
                    {meeting.description && (
                      <p className="text-sm text-muted-foreground">{meeting.description}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(meeting.scheduled_at).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{meeting.duration_minutes} min</span>
                      </div>
                      {meeting.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{meeting.location}</span>
                        </div>
                      )}
                      {meeting.meeting_link && (
                        <div className="flex items-center space-x-1">
                          <LinkIcon className="h-3 w-3" />
                          <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            Join Meeting
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!meeting.is_attended && new Date(meeting.scheduled_at) < new Date() && (
                      <Button
                        size="sm"
                        onClick={() => handleMarkAttended(meeting.id, true)}
                      >
                        Mark Attended
                      </Button>
                    )}
                    {meeting.is_attended && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAttended(meeting.id, false)}
                      >
                        Mark Not Attended
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold">No meetings scheduled</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Schedule your first meeting to track interactions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}