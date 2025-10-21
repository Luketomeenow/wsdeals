import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import ExcelJS from 'https://esm.sh/exceljs@4.4.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExcelRow {
  'Company Name'?: string;
  'Deal Name'?: string;
  "Client's Full Name"?: string;
  'Client First Name'?: string;
  'Client Last Name'?: string;
  "Client's Email"?: string;
  'Time Zone'?: string;
  "Client's Phone"?: string;
  'Sales Stage'?: string;
  'Notes'?: string;
}

const CHUNK_SIZE = 200; // Stream rows in batches
const MAX_ROWS = 15000; // Safety cap per run to avoid worker limits

// Format phone number - handle both string and numeric Excel values
function formatPhoneNumber(phone: any): string | undefined {
  if (!phone) return undefined;
  
  // Convert to string if it's a number
  let phoneStr = typeof phone === 'number' ? phone.toString() : phone.toString();
  
  console.log(`Raw phone value: ${phone} (type: ${typeof phone}), converted: ${phoneStr}`);
  
  // Remove all non-numeric characters
  let cleaned = phoneStr.replace(/[^\d]/g, '');
  
  console.log(`Cleaned phone: ${cleaned}`);
  
  // If empty after cleaning, return undefined
  if (!cleaned || cleaned.length === 0) return undefined;
  
  // Handle 10-digit North American numbers (604, 778 area codes)
  if (cleaned.length === 10) {
    const formatted = '+1' + cleaned;
    console.log(`Formatted 10-digit number: ${formatted}`);
    return formatted;
  }
  
  // Handle 11-digit numbers starting with 1 (US/Canada)
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const formatted = '+' + cleaned;
    console.log(`Formatted 11-digit number: ${formatted}`);
    return formatted;
  }
  
  // For other lengths, add + if not present
  const formatted = cleaned.startsWith('+') ? cleaned : '+' + cleaned;
  console.log(`Formatted other number: ${formatted}`);
  return formatted;
}

// Map Excel sales stage to database enum
function mapSalesStage(excelStage: string | undefined): string {
  if (!excelStage) return 'not contacted';
  
  const stage = excelStage.toLowerCase().trim();
  
  // Map Excel stages to database enum values
  const stageMapping: Record<string, string> = {
    'not contacted': 'not contacted',
    'no answer': 'no answer / gatekeeper',
    'no answer / gatekeeper': 'no answer / gatekeeper',
    'gatekeeper': 'no answer / gatekeeper',
    'decision maker': 'decision maker',
    'dm': 'decision maker',
    'nurturing': 'nurturing',
    'interested': 'interested',
    'strategy call booked': 'strategy call booked',
    'call booked': 'strategy call booked',
    'strategy call attended': 'strategy call attended',
    'call attended': 'strategy call attended',
    'proposal': 'proposal / scope',
    'proposal / scope': 'proposal / scope',
    'scope': 'proposal / scope',
    'closed won': 'closed won',
    'won': 'closed won',
    'closed lost': 'closed lost',
    'lost': 'closed lost'
  };
  
  return stageMapping[stage] || 'not contacted';
}

async function processChunk(
  supabase: any,
  chunk: ExcelRow[],
  startRow: number,
  existingCompanies: Map<string, string>,
  existingContacts: Map<string, string>
) {
  const results = {
    companiesCreated: 0,
    contactsCreated: 0,
    dealsCreated: 0,
    notesCreated: 0,
    errors: [] as string[],
  };

  // Batch data for inserts
  const newCompanies: any[] = [];
  const newContacts: any[] = [];
  const newDeals: any[] = [];
  const newNotes: any[] = [];

  // Process rows and prepare batch data
  for (let i = 0; i < chunk.length; i++) {
    const row = chunk[i];
    const rowNum = startRow + i;

    try {
      // Parse names
      let firstName = row['Client First Name'] || '';
      let lastName = row['Client Last Name'] || '';
      
      if (!firstName && !lastName && row["Client's Full Name"]) {
        const nameParts = row["Client's Full Name"].split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }

      if (!firstName || !lastName) {
        results.errors.push(`Row ${rowNum}: Missing client name`);
        continue;
      }

      const email = row["Client's Email"];
      const rawPhone = row["Client's Phone"];
      const phone = formatPhoneNumber(rawPhone);
      const timezone = row['Time Zone'] || 'UTC';
      const salesStage = mapSalesStage(row['Sales Stage']);
      
      console.log(`Row ${startRow + i}: Phone=${rawPhone} -> ${phone}, Stage=${row['Sales Stage']} -> ${salesStage}`);
      
      const companyName = row['Company Name'];
      const dealName = row['Deal Name'];
      const notes = row['Notes'];

      // Handle company
      let companyId = null;
      if (companyName) {
        companyId = existingCompanies.get(companyName);
        if (!companyId) {
          const tempId = `temp_company_${newCompanies.length}`;
          newCompanies.push({ name: companyName, timezone, tempId });
          companyId = tempId;
          existingCompanies.set(companyName, companyId);
        }
      }

      // Handle contact
      let contactId = null;
      const contactKey = email || `${firstName}_${lastName}_${phone}`;
      contactId = existingContacts.get(contactKey);
      
      if (!contactId) {
        const tempId = `temp_contact_${newContacts.length}`;
        newContacts.push({
          company_id: companyId,
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          timezone,
          tempId,
          contactKey,
        });
        contactId = tempId;
        existingContacts.set(contactKey, contactId);
      }

      // Prepare deal
      if (dealName) {
        newDeals.push({
          name: dealName,
          company_id: companyId,
          primary_contact_id: contactId,
          timezone,
          stage: salesStage,
          notes,
          tempCompanyId: companyId?.startsWith('temp_') ? companyId : null,
          tempContactId: contactId?.startsWith('temp_') ? contactId : null,
        });
      }

    } catch (error) {
      console.error(`Error processing row ${rowNum}:`, error);
      results.errors.push(`Row ${rowNum}: ${error.message}`);
    }
  }

  // Batch insert companies
  if (newCompanies.length > 0) {
    const companiesToInsert = newCompanies.map(({ tempId, ...c }) => c);
    const { data: insertedCompanies, error: companyError } = await supabase
      .from('companies')
      .insert(companiesToInsert)
      .select('id, name');

    if (companyError) {
      console.error('Company batch insert error:', companyError);
      results.errors.push(`Failed to insert companies: ${companyError.message}`);
    } else {
      results.companiesCreated += insertedCompanies.length;
      // Update company ID mappings
      insertedCompanies.forEach((company: any, idx: number) => {
        const tempId = newCompanies[idx].tempId;
        existingCompanies.set(company.name, company.id);
        // Update all references to temp IDs
        newContacts.forEach(c => {
          if (c.company_id === tempId) c.company_id = company.id;
        });
        newDeals.forEach(d => {
          if (d.company_id === tempId) d.company_id = company.id;
        });
      });
    }
  }

  // Batch insert contacts
  if (newContacts.length > 0) {
    const contactsToInsert = newContacts.map(({ tempId, contactKey, ...c }) => c);
    const { data: insertedContacts, error: contactError } = await supabase
      .from('contacts')
      .insert(contactsToInsert)
      .select('id, email, first_name, last_name, phone');

    if (contactError) {
      console.error('Contact batch insert error:', contactError);
      results.errors.push(`Failed to insert contacts: ${contactError.message}`);
    } else {
      results.contactsCreated += insertedContacts.length;
      // Update contact ID mappings
      insertedContacts.forEach((contact: any, idx: number) => {
        const tempId = newContacts[idx].tempId;
        const contactKey = newContacts[idx].contactKey;
        existingContacts.set(contactKey, contact.id);
        // Update all references to temp IDs
        newDeals.forEach(d => {
          if (d.primary_contact_id === tempId) d.primary_contact_id = contact.id;
        });
      });
    }
  }

  // Batch insert deals and notes
  if (newDeals.length > 0) {
    const dealsToInsert = newDeals.map(({ notes, tempCompanyId, tempContactId, ...d }) => d);
    const { data: insertedDeals, error: dealError } = await supabase
      .from('deals')
      .insert(dealsToInsert)
      .select('id');

    if (dealError) {
      console.error('Deal batch insert error:', dealError);
      results.errors.push(`Failed to insert deals: ${dealError.message}`);
    } else {
      results.dealsCreated += insertedDeals.length;
      
      // Batch insert notes for deals that have them
      const notesToInsert = [];
      insertedDeals.forEach((deal: any, idx: number) => {
        if (newDeals[idx].notes) {
          notesToInsert.push({
            deal_id: deal.id,
            contact_id: newDeals[idx].primary_contact_id,
            company_id: newDeals[idx].company_id,
            content: newDeals[idx].notes,
            note_type: 'manual',
          });
        }
      });

      if (notesToInsert.length > 0) {
        const { error: noteError } = await supabase
          .from('notes')
          .insert(notesToInsert);

        if (noteError) {
          console.error('Note batch insert error:', noteError);
          results.errors.push(`Failed to insert notes: ${noteError.message}`);
        } else {
          results.notesCreated += notesToInsert.length;
        }
      }
    }
  }

  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      throw new Error('No file provided');
    }

    // Read the Excel file using ExcelJS to access header colors
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new (ExcelJS as any).Workbook();
    await workbook.xlsx.load(arrayBuffer);
    const worksheet = workbook.worksheets[0];

    // Helper: classify ARGB color to a group
    function classifyColor(argb?: string): 'company' | 'deal' | 'contact' | null {
      if (!argb) return null;
      // argb like FFrrggbb
      const hex = argb.replace(/^#/,'');
      const r = parseInt(hex.slice(2,4), 16);
      const g = parseInt(hex.slice(4,6), 16);
      const b = parseInt(hex.slice(6,8), 16);
      const max = Math.max(r,g,b); const min = Math.min(r,g,b);
      // black
      if (max < 40) return 'contact';
      // gray (low saturation)
      if (max - min < 20) return 'company';
      // green-dominant
      if (g > r + 30 && g > b + 30) return 'deal';
      return null;
    }

    // Build header meta (index -> {name, group})
    const headerRow = worksheet.getRow(1);
    const headers: Array<{ index: number; name: string; group: 'company'|'deal'|'contact'|null }>=[];
    headerRow.eachCell((cell: any, col: number) => {
      const name = String(cell.text || cell.value || '').trim();
      const fill = cell.fill || {};
      const argb = (fill.fgColor && fill.fgColor.argb) || (fill?.backgroundColor && fill.backgroundColor.argb);
      const group = classifyColor(argb);
      headers.push({ index: col, name, group });
    });

    // Prepare maps once to avoid repeated lookups
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name');
    const existingCompanies = new Map<string, string>(
      companies?.map((c: any) => [c.name, c.id]) || []
    );

    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, email, first_name, last_name, phone');
    const existingContacts = new Map<string, string>();
    contacts?.forEach((c: any) => {
      const key = c.email || `${c.first_name}_${c.last_name}_${c.phone}`;
      existingContacts.set(key, c.id);
    });

    const totalResults = {
      companiesCreated: 0,
      contactsCreated: 0,
      dealsCreated: 0,
      notesCreated: 0,
      errors: [] as string[],
    };

    // Stream rows -> chunk -> processChunk -> aggregate
    let processed = 0;
    let chunk: ExcelRow[] = [];
    const maxRow = Math.min(worksheet.rowCount, MAX_ROWS + 1); // +1 because row 1 is header
    for (let rowNum = 2; rowNum <= maxRow; rowNum++) {
      const row = worksheet.getRow(rowNum);
      const out: ExcelRow = {};
      headers.forEach(h => {
        const cell = row.getCell(h.index);
        const value = String(cell?.text ?? cell?.value ?? '').trim();
        if (!value) return;
        const key = h.name.toLowerCase();
        if (key.includes('company name')) out['Company Name'] = out['Company Name'] || value;
        if (key.includes('deal name')) out['Deal Name'] = out['Deal Name'] || value;
        if (key.includes('deal stage') || key.includes('sales stage')) out['Sales Stage'] = out['Sales Stage'] || value;
        if (key.includes('notes')) out['Notes'] = out['Notes'] || value;
        if (key.includes('time') && key.includes('zone')) out['Time Zone'] = out['Time Zone'] || value;
        if (key.includes('first name')) out['Client First Name'] = out['Client First Name'] || value;
        if (key.includes('last name')) out['Client Last Name'] = out['Client Last Name'] || value;
        if (key.includes('email')) out["Client's Email"] = out["Client's Email"] || value;
        if (key.includes('phone')) out["Client's Phone"] = out["Client's Phone"] || value;
        if (key.includes('full name')) out["Client's Full Name"] = out["Client's Full Name"] || value;

        if (h.group === 'company' && !out['Company Name']) {
          if (key.includes('company')) out['Company Name'] = value;
        }
        if (h.group === 'deal') {
          if (!out['Deal Name'] && key.includes('deal')) out['Deal Name'] = value;
          if (!out['Sales Stage'] && key.includes('stage')) out['Sales Stage'] = value;
          if (!out['Notes'] && key.includes('note')) out['Notes'] = value;
        }
        if (h.group === 'contact') {
          if (!out['Client First Name'] && key.includes('first')) out['Client First Name'] = value;
          if (!out['Client Last Name'] && key.includes('last')) out['Client Last Name'] = value;
          if (!out["Client's Email"] && key.includes('email')) out["Client's Email"] = value;
          if (!out["Client's Phone"] && key.includes('phone')) out["Client's Phone"] = value;
          if (!out["Client's Full Name"]) out["Client's Full Name"] = value;
        }
      });
      const anyValue = Object.values(out).some(v => typeof v === 'string' && v.trim().length > 0);
      if (anyValue) chunk.push(out);
      processed++;

      if (chunk.length >= CHUNK_SIZE || rowNum === maxRow) {
        const startRow = rowNum - chunk.length + 2; // header offset
        const chunkResults = await processChunk(
          supabase,
          chunk,
          startRow,
          existingCompanies,
          existingContacts
        );
        totalResults.companiesCreated += chunkResults.companiesCreated;
        totalResults.contactsCreated += chunkResults.contactsCreated;
        totalResults.dealsCreated += chunkResults.dealsCreated;
        totalResults.notesCreated += chunkResults.notesCreated;
        totalResults.errors.push(...chunkResults.errors);
        chunk = [];
        // yield to event loop
        await new Promise(r => setTimeout(r, 5));
      }
    }

    console.log(`Processing ${data.length} rows from Excel file in chunks of ${CHUNK_SIZE}`);

    console.log('Processed rows:', processed, 'Import results:', totalResults);

    return new Response(JSON.stringify(totalResults), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
