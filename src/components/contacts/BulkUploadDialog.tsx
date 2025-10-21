import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase, SUPABASE_URL } from "@/integrations/supabase/client";
import ExcelJS from "exceljs";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Pipeline {
  id: string;
  name: string;
  description: string | null;
  stages: any;
  stage_order?: any;
  is_active: boolean;
}

export function BulkUploadDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchPipelines();
    }
  }, [open]);

  const fetchPipelines = async () => {
    try {
      const { data, error } = await supabase
        .from('pipelines')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      if (data) {
        setPipelines(data);
        // Default to "Outbound Funnel" pipeline
        const outboundPipeline = data.find(p => p.name === 'Outbound Funnel');
        if (outboundPipeline) {
          setSelectedPipelineId(outboundPipeline.id);
        } else if (data.length > 0) {
          setSelectedPipelineId(data[0].id);
        }
      }
    } catch (error: any) {
      console.error('Error fetching pipelines:', error);
      toast({
        title: "Error loading pipelines",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      
      if (!validTypes.includes(selectedFile.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload an Excel file (.xls or .xlsx)",
          variant: "destructive",
        });
        return;
      }

      if (selectedFile.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 50MB",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
      setResults(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    if (!selectedPipelineId) {
      toast({
        title: "No pipeline selected",
        description: "Please select a pipeline for the imported deals",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setProgress(10);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      setProgress(30);

      // Always use client-side parsing + batched inserts to avoid worker limits
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error('You must be signed in to import');

      setProgress(35);
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);
      // Pick sheet with best header score
      const sheetScore = (ws: any) => {
        let best = 0;
        const max = Math.min(10, ws.rowCount);
        for (let r = 1; r <= max; r++) {
          const row = ws.getRow(r);
          row.eachCell((cell: any) => {
            const t = String(cell?.text || cell?.value || '').toLowerCase();
            if (!t) return;
            if (t.includes('company')) best++;
            if (t.includes('deal')) best++;
            if (t.includes('contact')) best++;
            if (t.includes('email')) best++;
            if (t.includes('phone')) best++;
          });
        }
        return best;
      };
      const ws = workbook.worksheets.reduce((a:any,b:any)=> sheetScore(b)>sheetScore(a)?b:a, workbook.worksheets[0]);

      const classifyColor = (argb?: string) => {
        if (!argb) return null as 'company' | 'deal' | 'contact' | null;
        const hex = argb.replace(/^#/, '');
        const r = parseInt(hex.slice(2,4), 16);
        const g = parseInt(hex.slice(4,6), 16);
        const b = parseInt(hex.slice(6,8), 16);
        const max = Math.max(r,g,b); const min = Math.min(r,g,b);
        if (max < 40) return 'contact';
        if (max - min < 20) return 'company';
        if (g > r + 30 && g > b + 30) return 'deal';
        return null;
      };

      // Detect header row within first 10 rows by keyword score
      const scoreHeader = (rowIdx: number) => {
        const row = ws.getRow(rowIdx);
        let score = 0;
        row.eachCell((cell) => {
          const t = String((cell as any).text || (cell as any).value || '').toLowerCase();
          if (!t) return;
          if (t.includes('company')) score++;
          if (t.includes('deal')) score++;
          if (t.includes('name')) score++;
          if (t.includes('email')) score++;
          if (t.includes('phone')) score++;
          if (t.includes('note')) score++;
          if (t.includes('time') && t.includes('zone')) score++;
          if (t.includes('stage')) score++;
        });
        return score;
      };
      let headerIdx = 1;
      let bestScore = -1;
      for (let r = 1; r <= Math.min(10, ws.rowCount); r++) {
        const s = scoreHeader(r);
        if (s > bestScore) { bestScore = s; headerIdx = r; }
      }

      const headerRow = ws.getRow(headerIdx);
      const headers: Array<{ index: number; name: string; group: 'company'|'deal'|'contact'|null }>=[];
      headerRow.eachCell((cell, col) => {
        const raw = String((cell as any).text || (cell as any).value || '').trim();
        const name = raw;
        const fill: any = (cell as any).fill || {};
        const argb = (fill.fgColor && fill.fgColor.argb) || (fill?.backgroundColor && fill.backgroundColor.argb);
        headers.push({ index: col, name, group: classifyColor(argb) });
      });
      console.log('[BulkImport] Using sheet:', ws.name, 'headerRow:', headerIdx, 'headers:', headers.map(h=>h.name));

      const formatPhoneNumber = (raw: any) => {
        if (!raw) return undefined as string | undefined;
        const digits = String(raw).replace(/[^\d+]/g, '');
        if (digits.startsWith('+')) return digits;
        if (digits.length === 10) return `+1${digits}`;
        if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
        return digits ? `+${digits}` : undefined;
      };

      // Get the selected pipeline and its first stage
      const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);
      // Allowed enum values (lowercase) to ensure DB compatibility regardless of custom pipeline labels
      const allowedEnumStagesLower = [
        'not contacted',
        'no answer / gatekeeper',
        'decision maker',
        'nurturing',
        'interested',
        'strategy call booked',
        'strategy call attended',
        'proposal / scope',
        'closed won',
        'closed lost',
        'uncontacted',
        'dm connected',
        'bizops audit agreement sent',
        'bizops audit paid / booked',
        'bizops audit attended',
        'ms agreement sent',
        'balance paid / deal won',
        'not interested',
        'not qualified',
        'onboarding call booked',
        'onboarding call attended',
        'active client (operator)',
        'active client - project in progress',
        'paused client',
        'candidate replacement',
        'project rescope / expansion',
        'active client - project maintenance',
        'cancelled / completed',
      ];

      // Safe default that exists in the base enum set even if newer migrations weren't applied
      let defaultStage = 'not contacted';

      let pipelineStagesLower: string[] = [];
      if (selectedPipeline) {
        // Parse stages from the pipeline
        if (Array.isArray(selectedPipeline.stages)) {
          if (typeof selectedPipeline.stages[0] === 'string') {
            pipelineStagesLower = (selectedPipeline.stages as string[]).map(s => s.toLowerCase());
          } else if ((selectedPipeline.stages as any[])[0]?.name) {
            pipelineStagesLower = (selectedPipeline.stages as any[]).map((s: any) => String(s.name).toLowerCase());
          }
        }

        // Use the first pipeline stage that is also an allowed enum; else keep safe default
        const firstAllowed = pipelineStagesLower.find(s => allowedEnumStagesLower.includes(s));
        if (firstAllowed) defaultStage = firstAllowed;
      }

      // Canonicalize a stage string to match EXACT enum values
      const canonicalizeStage = (raw?: string) => {
        let s = (raw || '').toLowerCase().trim();
        if (!s) return defaultStage;
        // Normalize spacing around slashes/dashes and collapse multiple spaces
        s = s.replace(/\s*[\/\-]\s*/g, ' / ').replace(/\s+/g, ' ').trim();
        
        // Map to EXACT enum values - must match database enum exactly
        const stageMapping: Record<string, string> = {
          // Base enum values
          'not contacted': 'not contacted',
          'no answer / gatekeeper': 'no answer / gatekeeper',
          'decision maker': 'decision maker',
          'nurturing': 'nurturing',
          'interested': 'interested',
          'strategy call booked': 'strategy call booked',
          'strategy call attended': 'strategy call attended',
          'proposal / scope': 'proposal / scope',
          'closed won': 'closed won',
          'closed lost': 'closed lost',
          
          // Extended enum values
          'uncontacted': 'uncontacted',
          'dm connected': 'dm connected',
          'not qualified': 'not qualified',
          'not interested': 'not interested',
          'bizops audit agreement sent': 'bizops audit agreement sent',
          'bizops audit paid / booked': 'bizops audit paid / booked',
          'bizops audit attended': 'bizops audit attended',
          'ms agreement sent': 'ms agreement sent',
          'balance paid / deal won': 'balance paid / deal won',
          'onboarding call booked': 'onboarding call booked',
          'onboarding call attended': 'onboarding call attended',
          'active client (operator)': 'active client (operator)',
          'active client - project in progress': 'active client - project in progress',
          'paused client': 'paused client',
          'candidate replacement': 'candidate replacement',
          'project rescope / expansion': 'project rescope / expansion',
          'active client - project maintenance': 'active client - project maintenance',
          'cancelled / completed': 'cancelled / completed',
          
          // All variants/synonyms
          'no answers / gatekeeper': 'no answer / gatekeeper',
          'gatekeeper': 'no answer / gatekeeper',
          'dm': 'dm connected',
          'proposal': 'proposal / scope',
          'scope': 'proposal / scope',
          'won': 'closed won',
          'lost': 'closed lost',
          'not qualified / disqualified': 'not qualified',
          'disqualified': 'not qualified',
          'do not call': 'not interested',
          'dnc': 'not interested',
          'candidate interview booked': 'strategy call booked',
          'candidate interview attended': 'strategy call attended',
        };
        
        return stageMapping[s] || defaultStage;
      };

      const mapStage = (s?: string) => {
        const candidate = canonicalizeStage(s);
        
        // First check: is the canonicalized value a valid enum?
        if (allowedEnumStagesLower.includes(candidate)) {
          console.log('[BulkImport] ✓ Stage mapped correctly:', { original: s, canonical: candidate, valid: true });
          return candidate;
        }
        
        // Fallback: try to find first valid stage in pipeline
        const fallbackFromPipeline = pipelineStagesLower.find(s2 => allowedEnumStagesLower.includes(s2));
        const result = fallbackFromPipeline || defaultStage;
        console.log('[BulkImport] ⚠ Stage fallback used:', { 
          original: s, 
          canonical: candidate, 
          notInEnum: true,
          fallbackTo: result 
        });
        return result;
      };

      // Preload existing
      const { data: companies } = await supabase.from('companies').select('id, name');
      const existingCompanies = new Map<string,string>((companies||[]).map((c:any)=>[c.name,c.id]));
      const { data: contacts } = await supabase.from('contacts').select('id, email, first_name, last_name, phone');
      const existingContacts = new Map<string,string>();
      (contacts||[]).forEach((c:any)=>{ existingContacts.set(c.email || `${c.first_name}_${c.last_name}_${c.phone}`, c.id); });

          const newCompanies: any[] = []; const newContacts: any[] = []; const newDeals: any[] = []; const newNotes: any[] = [];
      const getCell = (row: any, idx: number) => String(row.getCell(idx)?.text ?? row.getCell(idx)?.value ?? '').trim();

      let parsedRows = 0;
      for (let r = headerIdx + 1; r <= ws.rowCount; r++) {
        const row = ws.getRow(r);
        const out: any = {};
        headers.forEach(h => {
          const val = getCell(row, h.index);
          if (!val) return;
          const key = h.name.toLowerCase();
          if (key.includes('company name')) out.companyName = out.companyName || val;
          if (key.includes('deal name')) out.dealName = out.dealName || val;
          if (key.includes('stage')) out.salesStage = out.salesStage || val;
          if (key.includes('notes')) out.notes = out.notes || val;
          if (key.includes('time') && key.includes('zone')) out.timezone = out.timezone || val;
          if (key.includes('first') && key.includes('name')) out.firstName = out.firstName || val;
          if (key.includes('last') && key.includes('name')) out.lastName = out.lastName || val;
          if (key.includes('email')) out.email = out.email || val;
          if (key.includes('phone')) out.phone = out.phone || val;
          if (key.includes('full name') && !out.firstName && !out.lastName) {
            const parts = val.split(' '); out.firstName = parts[0]; out.lastName = parts.slice(1).join(' ');
          }
        });

        if (!(out.firstName || out.lastName || out.email || out.phone || out.companyName || out.dealName || out.notes)) continue;
        parsedRows++;

        const phone = formatPhoneNumber(out.phone);
        const stage = mapStage(out.salesStage);

            let companyId: string | null = null;
        if (out.companyName) {
          companyId = existingCompanies.get(out.companyName) || null;
          if (!companyId) {
            const temp = `temp_c_${newCompanies.length}`;
                newCompanies.push({ name: out.companyName, timezone: out.timezone || 'PST', temp });
            existingCompanies.set(out.companyName, temp);
            companyId = temp;
          }
        }

        const key = out.email || `${out.firstName}_${out.lastName}_${phone}`;
        let contactId: string | null = existingContacts.get(key) || null;
        if (!contactId) {
          const temp = `temp_p_${newContacts.length}`;
          newContacts.push({ company_id: companyId, first_name: out.firstName||'', last_name: out.lastName||'', email: out.email||null, phone, timezone: out.timezone||'PST', temp, key });
          existingContacts.set(key, temp);
          contactId = temp;
        }

        if (out.dealName) {
          newDeals.push({ 
            name: out.dealName, 
            company_id: companyId, 
            primary_contact_id: contactId, 
            timezone: out.timezone||'PST', 
            stage, 
            notes: out.notes, 
            pipeline_id: selectedPipelineId,
            tempCompanyId: companyId, 
            tempContactId: contactId 
          });
        }
      }

      console.log('[BulkImport] Parsed rows:', parsedRows);
      if (parsedRows === 0) {
        toast({ title: 'Nothing to import', description: 'No recognizable rows found. Please confirm the header row and column names/colors.', variant: 'destructive' });
      }

      // Insert batches
      if (newCompanies.length) {
        const toInsert = newCompanies.map(({temp, ...c})=>c);
        const { data: inserted, error: e } = await supabase
          .from('companies')
          .insert(toInsert)
          .select('id, name');
        if (e) throw e; setProgress(60);
        if (!inserted || inserted.length === 0) {
          // RLS might block returning; fetch mapping by names
          const names = toInsert.map(c=>c.name);
          const { data: fetched } = await supabase.from('companies').select('id,name').in('name', names);
          fetched?.forEach((c:any)=> existingCompanies.set(c.name, c.id));
        } else {
          inserted.forEach((c:any)=> existingCompanies.set(c.name, c.id));
        }
        // Replace temp IDs
        newCompanies.forEach((nc:any)=>{
          const realId = existingCompanies.get(nc.name);
          if (realId) {
            newContacts.forEach((p:any)=>{ if (p.company_id===nc.temp) p.company_id = realId; });
            newDeals.forEach((d:any)=>{ if (d.company_id===nc.temp) d.company_id = realId; });
          }
        });
      }

      if (newContacts.length) {
        const toInsert = newContacts.map(({temp, key, ...c})=>c);
        const { data: inserted, error: e } = await supabase
          .from('contacts')
          .insert(toInsert)
          .select('id, email, first_name, last_name, phone');
        if (e) throw e; setProgress(75);
        let mappings: Array<{id:string, key:string}> = [];
        if (inserted && inserted.length > 0) {
          mappings = inserted.map((p:any)=>({ id: p.id, key: p.email || `${p.first_name}_${p.last_name}_${p.phone}` }));
        } else {
          // RLS may block returning; fetch by emails and phones
          const emails = toInsert.map((c:any)=>c.email).filter(Boolean);
          if (emails.length) {
            const { data: fetchedEmails } = await supabase.from('contacts').select('id,email');
            fetchedEmails?.forEach((p:any)=>{ if (emails.includes(p.email)) mappings.push({ id: p.id, key: p.email }); });
          }
          const phones = toInsert.map((c:any)=>c.phone).filter(Boolean);
          if (phones.length) {
            const { data: fetchedPhones } = await supabase.from('contacts').select('id,first_name,last_name,phone');
            fetchedPhones?.forEach((p:any)=>{
              const k = `${p.first_name}_${p.last_name}_${p.phone}`;
              if (toInsert.some((c:any)=>!c.email && `${c.first_name}_${c.last_name}_${c.phone}`===k)) mappings.push({ id: p.id, key: k });
            });
          }
        }
        // Apply mappings
        mappings.forEach(m => existingContacts.set(m.key, m.id));
        // Resolve any remaining by fetching individually
        for (const nc of newContacts) {
          if (!existingContacts.get(nc.key)) {
            if (nc.email) {
              const { data: found } = await supabase.from('contacts').select('id').eq('email', nc.email).maybeSingle();
              if (found?.id) existingContacts.set(nc.key, found.id);
            } else if (nc.first_name && nc.last_name && nc.phone) {
              const { data: found } = await supabase.from('contacts')
                .select('id')
                .eq('first_name', nc.first_name)
                .eq('last_name', nc.last_name)
                .eq('phone', nc.phone)
                .maybeSingle();
              if (found?.id) existingContacts.set(nc.key, found.id);
            }
          }
        }
        // Replace temp IDs in deals
        const tempToKey = new Map<string,string>();
        newContacts.forEach((nc:any)=> tempToKey.set(nc.temp, nc.key));
        newDeals.forEach((d:any)=>{
          if (typeof d.primary_contact_id === 'string' && d.primary_contact_id.startsWith('temp_')) {
            const key = tempToKey.get(d.primary_contact_id);
            const realId = key ? existingContacts.get(key) : undefined;
            d.primary_contact_id = realId || null; // avoid UUID error if unresolved
          }
        });
      }

      if (newDeals.length) {
        const toInsert = newDeals.map(({notes, tempCompanyId, tempContactId, ...d})=>{
          // Final sanitization: drop any temp IDs that weren't resolved
          const isTemp = (v:any) => typeof v === 'string' && v.startsWith('temp_');
          return {
            ...d,
            company_id: isTemp(d.company_id) ? null : d.company_id,
            primary_contact_id: isTemp(d.primary_contact_id) ? null : d.primary_contact_id,
            pipeline_id: d.pipeline_id, // Keep the pipeline_id
          };
        });
        const hasTemps = toInsert.some((d:any)=>d.primary_contact_id===null || d.company_id===null);
        if (hasTemps) {
          console.warn('[BulkImport] Some unresolved temp IDs remained; inserting with null FKs');
        }
        const { data: inserted, error: e } = await supabase.from('deals').insert(toInsert).select('id');
        if (e) throw e; setProgress(90);
        const notesToInsert: any[] = [];
        const isUuid = (v:any) => typeof v === 'string' && /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/.test(v);
        inserted?.forEach((d:any, idx:number)=>{
          const orig = newDeals[idx];
          if (orig.notes) {
            const sanitizedContact = isUuid(toInsert[idx].primary_contact_id) ? toInsert[idx].primary_contact_id : null;
            const sanitizedCompany = isUuid(toInsert[idx].company_id) ? toInsert[idx].company_id : null;
            notesToInsert.push({
              deal_id: d.id,
              contact_id: sanitizedContact,
              company_id: sanitizedCompany,
              content: orig.notes,
              note_type: 'manual',
            });
          }
        });
        if (notesToInsert.length) {
          const { error: ne } = await supabase.from('notes').insert(notesToInsert);
          if (ne) throw ne;
        }
      }

      setProgress(100);
      const data = { companiesCreated: newCompanies.length, contactsCreated: newContacts.length, dealsCreated: newDeals.length, notesCreated: newDeals.filter(d=>d.notes).length } as any;
      setResults(data);
      toast({ title: 'Import completed', description: `Created ${data.companiesCreated} companies, ${data.contactsCreated} contacts, ${data.dealsCreated} deals, and ${data.notesCreated} notes` });
      setTimeout(()=>window.location.reload(), 1500);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: "Upload failed", description: error?.message || 'Unknown error', variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const resetDialog = () => {
    setFile(null);
    setResults(null);
    setProgress(0);
    // Don't reset selectedPipelineId - keep the last selection for user convenience
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetDialog();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk Import from Excel</DialogTitle>
          <DialogDescription>
            Upload an Excel file to automatically create companies, deals, contacts, and notes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Required columns: Company Name, Deal Name, Client's Full Name (or Client First Name & Client Last Name), Client's Email, Time Zone, Client's Phone, Notes
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="pipeline-select">Select Pipeline</Label>
            <Select 
              value={selectedPipelineId} 
              onValueChange={setSelectedPipelineId}
              disabled={uploading}
            >
              <SelectTrigger id="pipeline-select">
                <SelectValue placeholder="Choose a pipeline for the deals" />
              </SelectTrigger>
              <SelectContent>
                {pipelines.map((pipeline) => (
                  <SelectItem key={pipeline.id} value={pipeline.id}>
                    {pipeline.name}
                    {pipeline.description && (
                      <span className="text-xs text-muted-foreground ml-2">
                        - {pipeline.description}
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              All imported deals will be added to the selected pipeline
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="file-upload" className="block text-sm font-medium">
              Select Excel File
            </label>
            <input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              disabled={uploading}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">Processing...</p>
            </div>
          )}

          {results && (
            <div className="space-y-2">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p>✓ Companies created: {results.companiesCreated}</p>
                    <p>✓ Contacts created: {results.contactsCreated}</p>
                    <p>✓ Deals created: {results.dealsCreated}</p>
                    <p>✓ Notes created: {results.notesCreated}</p>
                  </div>
                </AlertDescription>
              </Alert>

              {results.errors && results.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-semibold">Errors:</p>
                      {results.errors.map((error: string, idx: number) => (
                        <p key={idx} className="text-xs">{error}</p>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={resetDialog} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? "Uploading..." : "Upload & Import"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
