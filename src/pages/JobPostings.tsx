import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface JobPosting { id: string; title: string; department?: string; location?: string; employment_type?: string; description?: string; is_active: boolean; created_at: string; }

export default function JobPostings() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', department: '', location: '', employment_type: 'Full-time', description: '' });
  const { toast } = useToast();

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    const { data } = await supabase.from('job_postings').select('*').order('created_at', { ascending: false });
    setJobs(data || []);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return jobs.filter(j => j.title.toLowerCase().includes(q) || (j.department || '').toLowerCase().includes(q));
  }, [jobs, search]);

  const createJob = async () => {
    if (!form.title) { toast({ title: 'Title required', variant: 'destructive' }); return; }
    const { error } = await supabase.from('job_postings').insert({
      title: form.title,
      department: form.department || null,
      location: form.location || null,
      employment_type: form.employment_type || null,
      description: form.description || null,
      is_active: true,
    });
    if (error) { toast({ title: 'Failed to create job', variant: 'destructive' }); return; }
    toast({ title: 'Job created' }); setOpen(false); setForm({ title: '', department: '', location: '', employment_type: 'Full-time', description: '' }); fetchJobs();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Postings</h1>
          <p className="text-muted-foreground">Publish roles and collect candidate applications.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>New Job</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Job</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Title" value={form.title} onChange={(e)=>setForm({...form, title: e.target.value})} />
              <Input placeholder="Department" value={form.department} onChange={(e)=>setForm({...form, department: e.target.value})} />
              <Input placeholder="Location" value={form.location} onChange={(e)=>setForm({...form, location: e.target.value})} />
              <Select defaultValue={form.employment_type} onValueChange={(v)=>setForm({...form, employment_type: v})}>
                <SelectTrigger><SelectValue placeholder="Employment Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                </SelectContent>
              </Select>
              <Textarea placeholder="Description" value={form.description} onChange={(e)=>setForm({...form, description: e.target.value})} />
              <div className="flex justify-end"><Button onClick={createJob}>Create</Button></div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center"><Input className="max-w-md" placeholder="Search jobs..." value={search} onChange={(e)=>setSearch(e.target.value)} /></div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(j => (
          <Card key={j.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{j.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{j.department || 'General'} • {j.employment_type || 'N/A'}</p>
              <p className="text-sm">{j.location || 'Remote'}</p>
              <ApplyDialog jobId={j.id} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ApplyDialog({ jobId }: { jobId: string }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<any>({
    first_name: '', last_name: '', city: '', mobile_phone: '', whatsapp: '', age_range: '', gender: '',
    industry_experience: [] as string[], desired_industries: [] as string[], desired_roles: [] as string[], top_preferences: [] as string[],
    resume_url: '', portfolio_links: [] as string[],
    temperament_result: null, role_validation_level: '', communication_style: '', behavioral_stress: null,
    internet_speed_screenshot_url: '', workspace_photo_url: '',
    tech_stack: { industry: '', tools: [] as Array<{ name: string; level: 'B'|'I'|'A' }> },
  });

  const submit = async () => {
    const { error } = await supabase.from('candidate_applications').insert({
      job_id: jobId,
      ...data,
    });
    if (error) { toast({ title: 'Failed to submit', variant: 'destructive' }); return; }
    toast({ title: 'Application submitted' }); setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Apply</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader><DialogTitle>Candidate Application</DialogTitle></DialogHeader>
        <div className="space-y-6 max-h-[70vh] overflow-auto pr-2">
          {step === 1 && (
            <PartPersonal data={data} setData={setData} />
          )}
          {step === 2 && (
            <PartBackground data={data} setData={setData} />
          )}
          {step === 3 && (
            <PartResume data={data} setData={setData} />
          )}
          {step === 4 && (
            <PartAssessments data={data} setData={setData} />
          )}
          {step === 5 && (
            <PartTechnical data={data} setData={setData} />
          )}
          {step === 6 && (
            <PartTechStack data={data} setData={setData} />
          )}
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={()=>setStep(Math.max(1, step-1))}>Back</Button>
          {step < 6 ? (
            <Button onClick={()=>setStep(step+1)}>Next</Button>
          ) : (
            <Button onClick={submit}>Submit Application</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PartPersonal({ data, setData }: any) {
  return (
    <Card>
      <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <Input placeholder="First Name" value={data.first_name} onChange={(e)=>setData((d:any)=>({...d, first_name: e.target.value}))} />
        <Input placeholder="Last Name" value={data.last_name} onChange={(e)=>setData((d:any)=>({...d, last_name: e.target.value}))} />
        <Input placeholder="Current City" value={data.city} onChange={(e)=>setData((d:any)=>({...d, city: e.target.value}))} />
        <Input placeholder="Mobile Phone" value={data.mobile_phone} onChange={(e)=>setData((d:any)=>({...d, mobile_phone: e.target.value}))} />
        <Input placeholder="WhatsApp Number" value={data.whatsapp} onChange={(e)=>setData((d:any)=>({...d, whatsapp: e.target.value}))} />
        <Input placeholder="Age Range" value={data.age_range} onChange={(e)=>setData((d:any)=>({...d, age_range: e.target.value}))} />
        <Input placeholder="Gender" value={data.gender} onChange={(e)=>setData((d:any)=>({...d, gender: e.target.value}))} />
      </CardContent>
    </Card>
  );
}

function PartBackground({ data, setData }: any) {
  const industries = ['Real Estate','IT','E-commerce','Legal','Marketing'];
  const roles = ['Appointment Setter','Customer Support','Data Entry','Research Assistant','Administrative Assistant','Transaction Coordinator','Bookkeeper','Scheduler','EA','SDR','Account Executive','Project Manager','Operations Analyst','Recruiter','Chief of Staff','Operations Lead','Department Coordinator','Business Analyst','Technical Systems Manager'];
  return (
    <Card>
      <CardHeader><CardTitle>Background & Experience</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Input placeholder="Industry Experience (comma-separated)" value={data.industry_experience.join(', ')} onChange={(e)=>setData((d:any)=>({...d, industry_experience: e.target.value.split(',').map((s)=>s.trim()).filter(Boolean)}))} />
        <Input placeholder="Desired Industries (comma-separated)" value={data.desired_industries.join(', ')} onChange={(e)=>setData((d:any)=>({...d, desired_industries: e.target.value.split(',').map((s)=>s.trim()).filter(Boolean)}))} />
        <Input placeholder="Desired Roles (comma-separated)" value={data.desired_roles.join(', ')} onChange={(e)=>setData((d:any)=>({...d, desired_roles: e.target.value.split(',').map((s)=>s.trim()).filter(Boolean)}))} />
        <Input placeholder="Top Preferences (comma-separated)" value={data.top_preferences.join(', ')} onChange={(e)=>setData((d:any)=>({...d, top_preferences: e.target.value.split(',').map((s)=>s.trim()).filter(Boolean)}))} />
      </CardContent>
    </Card>
  );
}

function PartResume({ data, setData }: any) {
  return (
    <Card>
      <CardHeader><CardTitle>Resume & Portfolio</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Input placeholder="Resume URL (PDF)" value={data.resume_url} onChange={(e)=>setData((d:any)=>({...d, resume_url: e.target.value}))} />
        <Textarea placeholder="Portfolio Links (one per line)" value={data.portfolio_links.join('\n')} onChange={(e)=>setData((d:any)=>({...d, portfolio_links: e.target.value.split('\n').map((s)=>s.trim()).filter(Boolean)}))} />
      </CardContent>
    </Card>
  );
}

function PartAssessments({ data, setData }: any) {
  return (
    <Card>
      <CardHeader><CardTitle>Assessments & Quizzes</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <Input placeholder="Temperament Result (JSON or summary)" value={data.temperament_result || ''} onChange={(e)=>setData((d:any)=>({...d, temperament_result: e.target.value}))} />
        <Input placeholder="Role Validation Level (Runner/Admin/EA/CoS)" value={data.role_validation_level} onChange={(e)=>setData((d:any)=>({...d, role_validation_level: e.target.value}))} />
        <Input placeholder="Communication Style (Driver/Analytical/Expressive/Amiable)" value={data.communication_style} onChange={(e)=>setData((d:any)=>({...d, communication_style: e.target.value}))} />
        <Input placeholder="Behavioral Stress (JSON or summary)" value={data.behavioral_stress || ''} onChange={(e)=>setData((d:any)=>({...d, behavioral_stress: e.target.value}))} />
      </CardContent>
    </Card>
  );
}

function PartTechnical({ data, setData }: any) {
  return (
    <Card>
      <CardHeader><CardTitle>Technical Setup</CardTitle></CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <Input placeholder="Internet Speed Test Screenshot URL" value={data.internet_speed_screenshot_url} onChange={(e)=>setData((d:any)=>({...d, internet_speed_screenshot_url: e.target.value}))} />
        <Input placeholder="Workspace Photo URL" value={data.workspace_photo_url} onChange={(e)=>setData((d:any)=>({...d, workspace_photo_url: e.target.value}))} />
      </CardContent>
    </Card>
  );
}

function PartTechStack({ data, setData }: any) {
  return (
    <Card>
      <CardHeader><CardTitle>Tech Stack Proficiency</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <Input placeholder="Industry (for tool suggestions)" value={data.tech_stack.industry} onChange={(e)=>setData((d:any)=>({...d, tech_stack: { ...d.tech_stack, industry: e.target.value }}))} />
        <Textarea placeholder="Tools and Levels (e.g., Salesforce-B, Asana-I, Canva-A)" value={data.tech_stack.tools.map((t:any)=>`${t.name}-${t.level}`).join(', ')} onChange={(e)=>{
          const items = e.target.value.split(',').map((s)=>s.trim()).filter(Boolean);
          const tools = items.map((i)=>{
            const [name, levelRaw] = i.split('-');
            const level = (levelRaw || 'B').toUpperCase();
            return { name: name.trim(), level: (['B','I','A'].includes(level) ? level : 'B') as 'B'|'I'|'A' };
          });
          setData((d:any)=>({ ...d, tech_stack: { ...d.tech_stack, tools } }));
        }} />
      </CardContent>
    </Card>
  );
}


