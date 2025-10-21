// Mock data for WS Deal Dash CRM
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  industry?: string;
  employees_count?: number;
  description?: string;
  linkedin_url?: string;
  city?: string;
  state?: string;
  country?: string;
  timezone?: string;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  company_id?: string;
  owner_id?: string;
  timezone?: string;
  lifecycle_stage?: 'lead' | 'prospect' | 'qualified' | 'customer' | 'evangelist';
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  name: string;
  stage: 'not contacted' | 'no answer / gatekeeper' | 'decision maker' | 'nurturing' | 'interested' | 'strategy call booked' | 'strategy call attended' | 'proposal / scope' | 'closed won' | 'closed lost';
  owner_id?: string;
  amount?: number;
  close_date?: string;
  company_id?: string;
  primary_contact_id?: string;
  priority?: 'low' | 'medium' | 'high';
  deal_status?: 'open' | 'closed';
  timezone?: string;
  currency?: string;
  description?: string;
  source?: string;
  income_amount?: number;
  contact_attempts?: number;
  last_contact_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  deal_id?: string;
  contact_id?: string;
  company_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Call {
  id: string;
  related_deal_id?: string;
  related_contact_id?: string;
  related_company_id?: string;
  outbound_type: 'outbound call' | 'inbound call' | 'strategy call' | 'scope call' | 'candidate interview' | 'onboarding call';
  call_outcome: 'do not call' | 'dash' | 'asked to be put on DNC list' | 'did not dial' | 'phone did not ring' | 'no answer' | 'gatekeeper' | 'voicemail' | 'DM' | 'introduction' | 'sensor decision maker' | 'DM short story' | 'DM discovery' | 'DM presentation' | 'DM resume request' | 'strategy call booked' | 'strategy call attended' | 'strategy call no show' | 'candidate interview booked' | 'candidate interview attended' | 'not interested' | 'no show' | 'onboarding call booked' | 'onboarding call attended' | 'nurturing';
  duration_seconds?: number;
  notes?: string;
  call_timestamp: string;
  rep_id?: string;
  created_at: string;
  updated_at: string;
}

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'john.doe@wsdealdash.com',
    first_name: 'John',
    last_name: 'Doe',
    avatar_url: '/avatars/01.png',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    email: 'jane.smith@wsdealdash.com',
    first_name: 'Jane',
    last_name: 'Smith',
    avatar_url: '/avatars/02.png',
    created_at: '2024-01-01T00:00:00Z'
  }
];

// Mock Companies
export const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'TechCorp Inc.',
    website: 'https://techcorp.com',
    phone: '+1-555-0123',
    email: 'info@techcorp.com',
    address: '123 Tech Street, San Francisco, CA 94105',
    industry: 'Technology',
    employees_count: 500,
    description: 'Leading technology solutions provider',
    linkedin_url: 'https://linkedin.com/company/techcorp',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    timezone: 'America/Los_Angeles',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Global Solutions Ltd.',
    website: 'https://globalsolutions.com',
    phone: '+1-555-0456',
    email: 'contact@globalsolutions.com',
    address: '456 Business Ave, New York, NY 10001',
    industry: 'Consulting',
    employees_count: 200,
    description: 'Strategic consulting and business solutions',
    linkedin_url: 'https://linkedin.com/company/globalsolutions',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    timezone: 'America/New_York',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  },
  {
    id: '3',
    name: 'StartupHub Co.',
    website: 'https://startuphub.com',
    phone: '+1-555-0789',
    email: 'hello@startuphub.com',
    address: '789 Innovation Blvd, Austin, TX 78701',
    industry: 'Startup',
    employees_count: 50,
    description: 'Innovative startup accelerator',
    linkedin_url: 'https://linkedin.com/company/startuphub',
    city: 'Austin',
    state: 'TX',
    country: 'USA',
    timezone: 'America/Chicago',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z'
  },
  {
    id: '4',
    name: 'MegaCorp Industries',
    website: 'https://megacorp.com',
    phone: '+1-555-0321',
    email: 'info@megacorp.com',
    address: '321 Corporate Plaza, Chicago, IL 60601',
    industry: 'Manufacturing',
    employees_count: 1000,
    description: 'Industrial manufacturing and automation',
    linkedin_url: 'https://linkedin.com/company/megacorp',
    city: 'Chicago',
    state: 'IL',
    country: 'USA',
    timezone: 'America/Chicago',
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z'
  },
  {
    id: '5',
    name: 'InnovateTech',
    website: 'https://innovatetech.io',
    phone: '+1-555-0654',
    email: 'contact@innovatetech.io',
    address: '654 Future Lane, Seattle, WA 98101',
    industry: 'AI/ML',
    employees_count: 150,
    description: 'Artificial intelligence and machine learning solutions',
    linkedin_url: 'https://linkedin.com/company/innovatetech',
    city: 'Seattle',
    state: 'WA',
    country: 'USA',
    timezone: 'America/Los_Angeles',
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-05T00:00:00Z'
  }
];

// Mock Contacts
export const mockContacts: Contact[] = [
  {
    id: '1',
    first_name: 'John',
    last_name: 'Smith',
    email: 'john.smith@techcorp.com',
    phone: '+1-555-0124',
    mobile: '+1-555-0125',
    company_id: '1',
    owner_id: '1',
    timezone: 'America/Los_Angeles',
    lifecycle_stage: 'qualified',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.johnson@globalsolutions.com',
    phone: '+1-555-0457',
    mobile: '+1-555-0458',
    company_id: '2',
    owner_id: '1',
    timezone: 'America/New_York',
    lifecycle_stage: 'prospect',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z'
  },
  {
    id: '3',
    first_name: 'Mike',
    last_name: 'Davis',
    email: 'mike.davis@startuphub.com',
    phone: '+1-555-0790',
    mobile: '+1-555-0791',
    company_id: '3',
    owner_id: '2',
    timezone: 'America/Chicago',
    lifecycle_stage: 'lead',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z'
  },
  {
    id: '4',
    first_name: 'Emily',
    last_name: 'Wilson',
    email: 'emily.wilson@megacorp.com',
    phone: '+1-555-0322',
    mobile: '+1-555-0323',
    company_id: '4',
    owner_id: '1',
    timezone: 'America/Chicago',
    lifecycle_stage: 'customer',
    created_at: '2024-01-04T00:00:00Z',
    updated_at: '2024-01-04T00:00:00Z'
  },
  {
    id: '5',
    first_name: 'David',
    last_name: 'Brown',
    email: 'david.brown@innovatetech.io',
    phone: '+1-555-0655',
    mobile: '+1-555-0656',
    company_id: '5',
    owner_id: '2',
    timezone: 'America/Los_Angeles',
    lifecycle_stage: 'evangelist',
    created_at: '2024-01-05T00:00:00Z',
    updated_at: '2024-01-05T00:00:00Z'
  }
];

// Mock Deals
export const mockDeals: Deal[] = [
  {
    id: '1',
    name: 'TechCorp Integration Project',
    stage: 'strategy call booked',
    owner_id: '1',
    amount: 85000,
    close_date: '2024-02-15',
    company_id: '1',
    primary_contact_id: '1',
    priority: 'high',
    deal_status: 'open',
    timezone: 'America/Los_Angeles',
    currency: 'USD',
    description: 'Large scale integration project for TechCorp platform architecture',
    source: 'Website',
    income_amount: 100000,
    contact_attempts: 3,
    last_contact_date: '2024-01-15T14:30:00Z',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  },
  {
    id: '2',
    name: 'Global Solutions Consulting',
    stage: 'proposal / scope',
    owner_id: '1',
    amount: 45000,
    close_date: '2024-02-28',
    company_id: '2',
    primary_contact_id: '2',
    priority: 'medium',
    deal_status: 'open',
    timezone: 'America/New_York',
    currency: 'USD',
    description: 'Strategic consulting engagement for digital transformation',
    source: 'Referral',
    income_amount: 60000,
    contact_attempts: 2,
    last_contact_date: '2024-01-14T10:15:00Z',
    created_at: '2024-01-14T00:00:00Z',
    updated_at: '2024-01-14T00:00:00Z'
  },
  {
    id: '3',
    name: 'StartupHub MVP Development',
    stage: 'nurturing',
    owner_id: '2',
    amount: 25000,
    close_date: '2024-03-10',
    company_id: '3',
    primary_contact_id: '3',
    priority: 'low',
    deal_status: 'open',
    timezone: 'America/Chicago',
    currency: 'USD',
    description: 'MVP development for new startup in the accelerator program',
    source: 'Cold Outbound',
    income_amount: 35000,
    contact_attempts: 1,
    last_contact_date: '2024-01-13T16:45:00Z',
    created_at: '2024-01-13T00:00:00Z',
    updated_at: '2024-01-13T00:00:00Z'
  },
  {
    id: '4',
    name: 'MegaCorp Digital Upgrade',
    stage: 'decision maker',
    owner_id: '1',
    amount: 150000,
    close_date: '2024-01-30',
    company_id: '4',
    primary_contact_id: '4',
    priority: 'high',
    deal_status: 'open',
    timezone: 'America/Chicago',
    currency: 'USD',
    description: 'Enterprise-wide digital infrastructure upgrade project',
    source: 'LinkedIn',
    income_amount: 200000,
    contact_attempts: 4,
    last_contact_date: '2024-01-12T09:20:00Z',
    created_at: '2024-01-12T00:00:00Z',
    updated_at: '2024-01-12T00:00:00Z'
  },
  {
    id: '5',
    name: 'InnovateTech AI Platform',
    stage: 'closed won',
    owner_id: '2',
    amount: 75000,
    close_date: '2024-01-20',
    company_id: '5',
    primary_contact_id: '5',
    priority: 'medium',
    deal_status: 'closed',
    timezone: 'America/Los_Angeles',
    currency: 'USD',
    description: 'AI platform development and deployment',
    source: 'Webinar',
    income_amount: 90000,
    contact_attempts: 5,
    last_contact_date: '2024-01-20T15:00:00Z',
    created_at: '2024-01-20T00:00:00Z',
    updated_at: '2024-01-20T00:00:00Z'
  }
];

// Mock Tasks
export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Follow up on TechCorp proposal',
    description: 'Call John Smith to discuss the integration project timeline and answer any questions',
    status: 'pending',
    priority: 'high',
    due_date: '2024-01-16T10:00:00Z',
    deal_id: '1',
    contact_id: '1',
    company_id: '1',
    notes: 'Focus on timeline and technical requirements',
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  },
  {
    id: '2',
    title: 'Send contract to Global Solutions',
    description: 'Prepare and send signed contract for consulting engagement',
    status: 'pending',
    priority: 'medium',
    due_date: '2024-01-17T14:00:00Z',
    deal_id: '2',
    contact_id: '2',
    company_id: '2',
    notes: 'Include SOW and payment terms',
    created_at: '2024-01-16T00:00:00Z',
    updated_at: '2024-01-16T00:00:00Z'
  },
  {
    id: '3',
    title: 'Research MegaCorp requirements',
    description: 'Deep dive into MegaCorp current infrastructure and digital transformation needs',
    status: 'in_progress',
    priority: 'high',
    due_date: '2024-01-18T09:00:00Z',
    deal_id: '4',
    contact_id: '4',
    company_id: '4',
    notes: 'Focus on scalability and compliance requirements',
    created_at: '2024-01-17T00:00:00Z',
    updated_at: '2024-01-17T00:00:00Z'
  },
  {
    id: '4',
    title: 'Schedule demo for StartupHub',
    description: 'Set up product demo for the MVP development project',
    status: 'pending',
    priority: 'low',
    due_date: '2024-01-19T15:00:00Z',
    deal_id: '3',
    contact_id: '3',
    company_id: '3',
    notes: 'Show core features and customization options',
    created_at: '2024-01-18T00:00:00Z',
    updated_at: '2024-01-18T00:00:00Z'
  },
  {
    id: '5',
    title: 'InnovateTech project kickoff',
    description: 'Initiate project kickoff meeting for AI platform development',
    status: 'completed',
    priority: 'medium',
    due_date: '2024-01-20T11:00:00Z',
    deal_id: '5',
    contact_id: '5',
    company_id: '5',
    notes: 'Project successfully launched',
    created_at: '2024-01-19T00:00:00Z',
    updated_at: '2024-01-20T00:00:00Z'
  }
];

// Mock Calls
export const mockCalls: Call[] = [
  {
    id: '1',
    related_deal_id: '1',
    related_contact_id: '1',
    related_company_id: '1',
    outbound_type: 'outbound call',
    call_outcome: 'interested',
    duration_seconds: 1800,
    notes: 'Great conversation about technical requirements. Next steps: send detailed proposal.',
    call_timestamp: '2024-01-15T14:30:00Z',
    rep_id: '1',
    created_at: '2024-01-15T14:30:00Z',
    updated_at: '2024-01-15T14:30:00Z'
  },
  {
    id: '2',
    related_deal_id: '2',
    related_contact_id: '2',
    related_company_id: '2',
    outbound_type: 'outbound call',
    call_outcome: 'callback_scheduled',
    duration_seconds: 900,
    notes: 'Initial interest shown. Scheduled follow-up call for next week.',
    call_timestamp: '2024-01-14T10:15:00Z',
    rep_id: '1',
    created_at: '2024-01-14T10:15:00Z',
    updated_at: '2024-01-14T10:15:00Z'
  },
  {
    id: '3',
    related_deal_id: '3',
    related_contact_id: '3',
    related_company_id: '3',
    outbound_type: 'outbound call',
    call_outcome: 'no_answer',
    duration_seconds: 600,
    notes: 'Left voicemail with callback request.',
    call_timestamp: '2024-01-13T16:45:00Z',
    rep_id: '2',
    created_at: '2024-01-13T16:45:00Z',
    updated_at: '2024-01-13T16:45:00Z'
  },
  {
    id: '4',
    related_deal_id: '4',
    related_contact_id: '4',
    related_company_id: '4',
    outbound_type: 'strategy call',
    call_outcome: 'strategy call attended',
    duration_seconds: 3600,
    notes: 'Comprehensive strategy discussion. Moving to proposal phase.',
    call_timestamp: '2024-01-12T09:20:00Z',
    rep_id: '1',
    created_at: '2024-01-12T09:20:00Z',
    updated_at: '2024-01-12T09:20:00Z'
  },
  {
    id: '5',
    related_deal_id: '5',
    related_contact_id: '5',
    related_company_id: '5',
    outbound_type: 'onboarding call',
    call_outcome: 'onboarding call attended',
    duration_seconds: 2700,
    notes: 'Successful project kickoff. All stakeholders aligned.',
    call_timestamp: '2024-01-20T15:00:00Z',
    rep_id: '2',
    created_at: '2024-01-20T15:00:00Z',
    updated_at: '2024-01-20T15:00:00Z'
  }
];

// Current user (for authentication simulation)
export const currentUser: User = mockUsers[0];
