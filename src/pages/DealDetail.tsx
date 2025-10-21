import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  Calendar, 
  MoreHorizontal,
  Building2,
  DollarSign,
  Target
} from "lucide-react";
import { CallLogForm } from "@/components/calls/CallLogForm";
import { ClickToCall } from "@/components/calls/ClickToCall";
import { CallHistory } from "@/components/calls/CallHistory";
import { NotesEditor } from "@/components/deals/NotesEditor";
import { EmailManager } from "@/components/deals/EmailManager";
import { MeetingManager } from "@/components/deals/MeetingManager";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const stageColors = {
  "not contacted": "secondary",
  "no answer / gatekeeper": "secondary", 
  "decision maker": "default",
  "nurturing": "secondary",
  "interested": "default",
  "strategy call booked": "default",
  "strategy call attended": "default", 
  "proposal / scope": "default",
  "closed won": "default",
  "closed lost": "destructive"
} as const;

export default function DealDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [deal, setDeal] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [primaryContact, setPrimaryContact] = useState<any>(null);
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [editingVertical, setEditingVertical] = useState(false);
  const [editingLeadSource, setEditingLeadSource] = useState(false);
  const leadSources = ['Website','Referral','LinkedIn','Cold Outbound','Webinar','Email','Other'];
  const verticalOptions = [
    'Real Estate', 'Dentals', 'Legal', 'Professional Services',
    'Accounting & Bookkeeping Firms', 'Financial Advisors / Wealth Management', 'Mortgage Brokers',
    'Consulting Firms (Business / Management / HR)', 'Recruiting & Staffing Agencies', 'Architecture Firms',
    'Engineering Firms', 'Property Management Companies',
    'Web Design & Development Agencies', 'Video Production Studios', 'E-commerce Brands / Shopify Stores',
    'Influencers & Personal Brands', 'Podcast Production Companies', 'PR & Communications Agencies',
    'Graphic Design / Branding Studios',
    'Medical Clinics (Private Practices)', 'Chiropractors', 'Physical Therapy Clinics', 'Nutritionists & Dietitians',
    'Mental Health Therapists / Coaches', 'Medical Billing Companies',
    'Cleaning Companies', 'HVAC / Plumbing / Electrical Contractors', 'Landscaping / Lawn Care Companies',
    'Construction & Renovation Firms', 'Pest Control Companies',
    'Online Course Creators / EdTech', 'Life Coaches & Business Coaches', 'Tutoring & Test Prep Centers',
    'Freight Brokerage / Dispatch Services', 'Wholesale & Distribution Companies', 'Automotive Dealerships or Brokers',
    'Other',
  ];

  useEffect(() => {
    const fetchDealData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch deal data
        const { data: dealData, error: dealError } = await supabase
          .from('deals')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (dealError) throw dealError;
        
        if (!dealData) {
          toast({
            title: "Deal not found",
            description: "The deal you're looking for doesn't exist.",
            variant: "destructive"
          });
          navigate('/deals');
          return;
        }

        setDeal(dealData);

        // Fetch company data
        if (dealData.company_id) {
          const { data: companyData } = await supabase
            .from('companies')
            .select('*')
            .eq('id', dealData.company_id)
            .maybeSingle();
          
          if (companyData) setCompany(companyData);
        }

        // Fetch primary contact
        if (dealData.primary_contact_id) {
          const { data: contactData } = await supabase
            .from('contacts')
            .select('*')
            .eq('id', dealData.primary_contact_id)
            .maybeSingle();

          if (contactData) setPrimaryContact(contactData);
        }

        // Fetch calls
        const { data: callsData } = await supabase
          .from('calls')
          .select('*')
          .eq('related_deal_id', id)
          .order('call_timestamp', { ascending: false });

        if (callsData) setCalls(callsData);

      } catch (error) {
        console.error('Error fetching deal data:', error);
        toast({
          title: "Error",
          description: "Failed to load deal details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDealData();
  }, [id, navigate, toast]);

  const handleCallLogged = async (callData: any) => {
    if (!id) return;
    
    try {
      const { error } = await supabase
        .from('calls')
        .insert([{
          outbound_type: callData.outboundType,
          call_outcome: callData.callOutcome,
          duration_seconds: callData.durationSeconds,
          notes: callData.notes || null,
          call_timestamp: new Date().toISOString(),
          related_deal_id: id,
          related_contact_id: primaryContact?.id,
          related_company_id: company?.id,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Call logged successfully",
      });

      // Refresh calls data
      const { data: callsData } = await supabase
        .from('calls')
        .select('*')
        .eq('related_deal_id', id)
        .order('call_timestamp', { ascending: false });

      if (callsData) setCalls(callsData);
    } catch (error) {
      console.error('Error logging call:', error);
      toast({
        title: "Error",
        description: "Failed to log call",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3">
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="col-span-6">
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="col-span-3">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!deal) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/deals")}
            className="hover:scale-105 transition-transform"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {deal.name}
            </h1>
            <p className="text-muted-foreground flex items-center">
              <Building2 className="h-4 w-4 mr-1" />
              {company?.name || 'No company'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {primaryContact?.phone && (
            <ClickToCall 
              phoneNumber={primaryContact.phone}
              dealId={id}
              contactId={primaryContact.id}
              label={`Call ${primaryContact.first_name}`}
              showIcon={true}
              size="sm"
            />
          )}
          <Button variant="outline" size="sm" className="hover:scale-105 transition-transform">
            <Mail className="mr-2 h-4 w-4" />
            Email
          </Button>
          <Button variant="outline" size="sm" className="hover:scale-105 transition-transform">
            <Calendar className="mr-2 h-4 w-4" />
            Meeting
          </Button>
          <Button variant="outline" size="sm" className="hover:scale-105 transition-transform">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Three-column layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar - Deal Info */}
        <div className="col-span-3 space-y-4 animate-scale-in">
          <Card className="shadow-medium border-sky-100 hover:shadow-glow transition-all duration-300">
            <CardHeader className="bg-gradient-secondary">
              <CardTitle className="text-lg text-primary">Deal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Amount</span>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  <span className="font-semibold">
                    ${deal.amount ? Number(deal.amount).toLocaleString() : '0'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Stage</span>
                <Badge variant={stageColors[deal.stage as keyof typeof stageColors] || "secondary"}>
                  {deal.stage}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-2">
                <span className="text-sm font-medium">Close Date</span>
                <p className="text-sm text-muted-foreground">
                  {deal.close_date ? new Date(deal.close_date).toLocaleDateString() : 'Not set'}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Priority</span>
                <Badge variant="outline">{deal.priority}</Badge>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Status</span>
                <Badge variant={deal.deal_status === 'open' ? 'default' : 'secondary'}>
                  {deal.deal_status}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-2">
                <span className="text-sm font-medium">About this deal</span>
                <p className="text-sm text-muted-foreground">
                  {deal.description || 'No description provided'}
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-sm font-medium">Time Zone</span>
                  <p className="text-sm text-muted-foreground">{deal.timezone?.replace('UTC','PST') || 'PST'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-medium">Vertical</span>
                  {editingVertical ? (
                    <Select
                      value={deal.vertical || undefined}
                      onValueChange={async (value) => {
                        const previous = deal.vertical;
                        setDeal({ ...deal, vertical: value });
                        try {
                          const { error } = await supabase
                            .from('deals')
                            .update({ vertical: value as any })
                            .eq('id', id!);
                          if (error) {
                            setDeal({ ...deal, vertical: previous });
                            throw error;
                          }
                          toast({ title: 'Vertical updated' });
                        } catch (e) {
                          console.error(e);
                          toast({ title: 'Failed to update vertical', variant: 'destructive' });
                        }
                        setEditingVertical(false);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={deal.vertical || 'Select vertical'} />
                      </SelectTrigger>
                      <SelectContent>
                        {verticalOptions.map(v => (
                          <SelectItem key={v} value={v}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">{deal.vertical || 'Not set'}</p>
                      <Button variant="ghost" size="sm" onClick={() => setEditingVertical(true)}>Edit</Button>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-sm font-medium">Lead Source</span>
                  {editingLeadSource ? (
                    <Select
                      defaultValue={deal.source || undefined}
                      onValueChange={async (value) => {
                        try {
                          const { error } = await supabase
                            .from('deals')
                            .update({ source: value })
                            .eq('id', id!);
                          if (!error) setDeal({ ...deal, source: value });
                        } catch (e) { console.error(e); }
                        setEditingLeadSource(false);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={deal.source || 'Select source'} />
                      </SelectTrigger>
                      <SelectContent>
                        {leadSources.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">{deal.source || 'Not set'}</p>
                      <Button variant="ghost" size="sm" onClick={() => setEditingLeadSource(true)}>Edit</Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center Content - Activities */}
        <div className="col-span-6 animate-fade-in">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <Card className="shadow-medium border-sky-100 hover:shadow-glow transition-all duration-300">
              <CardHeader className="bg-gradient-secondary">
                <TabsList className="bg-white shadow-soft">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-white">Overview</TabsTrigger>
                  <TabsTrigger value="activity" className="data-[state=active]:bg-primary data-[state=active]:text-white">Activity</TabsTrigger>
                  <TabsTrigger value="notes" className="data-[state=active]:bg-primary data-[state=active]:text-white">Notes</TabsTrigger>
                  <TabsTrigger value="calls" className="data-[state=active]:bg-primary data-[state=active]:text-white">Calls</TabsTrigger>
                  <TabsTrigger value="emails" className="data-[state=active]:bg-primary data-[state=active]:text-white">Emails</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent>
                  <TabsContent value="overview" className="space-y-4">
                    <MeetingManager 
                      dealId={id!} 
                      contactId={primaryContact?.id} 
                      companyId={company?.id} 
                    />
                  </TabsContent>

                <TabsContent value="activity" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Recent Activity</h3>
                    <CallLogForm onSubmit={handleCallLogged}>
                      <Button size="sm">
                        <Phone className="mr-2 h-4 w-4" />
                        Log Call
                      </Button>
                    </CallLogForm>
                  </div>
                  <div className="space-y-3">
                    {calls.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No activity yet
                      </p>
                    ) : (
                      calls.map((call) => (
                        <div key={call.id} className="border-l-2 border-muted pl-4 pb-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">
                              Call - {call.call_outcome}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(call.call_timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {call.notes || 'No notes'}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="calls" className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Call History</h3>
                    <CallLogForm onSubmit={handleCallLogged}>
                      <Button size="sm">
                        <Phone className="mr-2 h-4 w-4" />
                        Log Call
                      </Button>
                    </CallLogForm>
                  </div>
                  <CallHistory 
                    contactId={primaryContact?.id} 
                    dealId={id} 
                    limit={20}
                  />
                </TabsContent>

                <TabsContent value="notes" className="space-y-4">
                  <NotesEditor dealId={id!} />
                </TabsContent>

                <TabsContent value="emails" className="space-y-4">
                  <EmailManager 
                    dealId={id!} 
                    contactId={primaryContact?.id} 
                    companyId={company?.id} 
                    contactEmail={primaryContact?.email || ''} 
                  />
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </div>

        {/* Right Sidebar - Associated Entities */}
        <div className="col-span-3 space-y-4 animate-slide-in-right">
          <Card className="shadow-medium border-sky-100 hover:shadow-glow transition-all duration-300">
            <CardHeader className="bg-gradient-secondary">
              <CardTitle className="text-lg text-primary">Associated Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              {primaryContact ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {primaryContact.first_name?.[0]}{primaryContact.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {primaryContact.first_name} {primaryContact.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">Primary Contact</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    {primaryContact.email && (
                      <div className="flex items-center">
                        <Mail className="h-3 w-3 mr-2" />
                        {primaryContact.email}
                      </div>
                    )}
                    {primaryContact.phone && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-2" />
                          {primaryContact.phone}
                        </div>
                        <ClickToCall 
                          phoneNumber={primaryContact.phone}
                          contactId={primaryContact.id}
                          dealId={id}
                          variant="ghost"
                          size="icon"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No primary contact assigned
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-medium border-sky-100 hover:shadow-glow transition-all duration-300">
            <CardHeader className="bg-gradient-secondary">
              <CardTitle className="text-lg text-primary">Associated Companies</CardTitle>
            </CardHeader>
            <CardContent>
              {company ? (
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-muted rounded flex items-center justify-center">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{company.name}</p>
                    <p className="text-xs text-muted-foreground">Primary</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No company assigned
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Call History in Sidebar */}
          {primaryContact && (
            <CallHistory 
              contactId={primaryContact.id} 
              dealId={id} 
              limit={5}
            />
          )}
        </div>
      </div>
    </div>
  );
}