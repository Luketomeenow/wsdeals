import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface JobPosting { id: string; title: string; department?: string; location?: string; employment_type?: string; description?: string; created_at: string; }

export default function JobPostingsLanding() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("");
  const [type, setType] = useState("");

  useEffect(() => { fetchJobs(); }, []);
  const fetchJobs = async () => {
    const { data } = await supabase.from('job_postings').select('*').eq('is_active', true).order('created_at', { ascending: false });
    setJobs(data || []);
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return jobs.filter(j => (
      (!q || j.title.toLowerCase().includes(q) || (j.description || '').toLowerCase().includes(q)) &&
      (!dept || (j.department || '') === dept) &&
      (!type || (j.employment_type || '') === type)
    ));
  }, [jobs, query, dept, type]);

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'var(--gradient-hero)' }} />
        <div className="relative mx-auto max-w-6xl px-6 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white">Join StafflyHub</h1>
          <p className="mt-3 text-white/90">Find roles that match your skills and ambition.</p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Search roles..." value={query} onChange={(e)=>setQuery(e.target.value)} className="bg-white" />
            <Select value={dept} onValueChange={setDept}>
              <SelectTrigger className="bg-white"><SelectValue placeholder="All departments" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
                <SelectItem value="Operations">Operations</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Engineering">Engineering</SelectItem>
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="bg-white"><SelectValue placeholder="All types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="Full-time">Full-time</SelectItem>
                <SelectItem value="Part-time">Part-time</SelectItem>
                <SelectItem value="Contract">Contract</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((j) => (
            <Card key={j.id} className="hover:shadow-medium transition-shadow">
              <CardContent className="p-6 space-y-2">
                <h3 className="text-lg font-semibold">{j.title}</h3>
                <p className="text-sm text-muted-foreground">{j.department || 'General'} • {j.employment_type || 'N/A'} • {j.location || 'Remote'}</p>
                <p className="text-sm line-clamp-3">{j.description}</p>
                <div className="pt-2">
                  <a href={`/jobs`}>
                    <Button>View & Apply</Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground">No job postings found.</div>
          )}
        </div>
      </section>
    </div>
  );
}


