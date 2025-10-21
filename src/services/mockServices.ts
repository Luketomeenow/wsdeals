// Mock services to replace Supabase calls
import { 
  mockUsers, 
  mockCompanies, 
  mockContacts, 
  mockDeals, 
  mockTasks, 
  mockCalls, 
  currentUser,
  type User,
  type Company,
  type Contact,
  type Deal,
  type Task,
  type Call
} from '../data/mockData';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock authentication service
export const mockAuth = {
  async getUser() {
    await delay(100);
    // Always return a valid user for demo purposes
    return { data: { user: currentUser }, error: null };
  },

  async signOut() {
    await delay(100);
    return { error: null };
  },

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    await delay(500);
    // Accept any email with password "password" for demo
    if (password === 'password') {
      return { data: { user: currentUser }, error: null };
    }
    return { data: { user: null }, error: { message: 'Invalid credentials' } };
  }
};

// Mock query builder for Supabase-like interface
class MockQueryBuilder {
  private table: string;
  private data: any[];
  private filters: any[] = [];
  private columns: string = '*';

  constructor(table: string, data: any[]) {
    this.table = table;
    this.data = data;
  }

  select(columns: string = '*') {
    this.columns = columns;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ type: 'eq', column, value });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push({ type: 'in', column, values });
    return this;
  }

  single() {
    return this.maybeSingle();
  }

  maybeSingle() {
    return this.then((result: any) => {
      if (result.data && result.data.length > 0) {
        return { data: result.data[0], error: null };
      }
      return { data: null, error: null };
    });
  }

  async then(callback: (result: any) => any) {
    await delay(200);
    let results = [...this.data];
    
    // Apply filters
    for (const filter of this.filters) {
      if (filter.type === 'eq') {
        results = results.filter(item => (item as any)[filter.column] === filter.value);
      } else if (filter.type === 'in') {
        results = results.filter(item => filter.values.includes((item as any)[filter.column]));
      }
    }
    
    const result = { data: results, error: null };
    return callback(result);
  }

  async insert(data: any) {
    await delay(300);
    const newData = Array.isArray(data) ? data : [data];
    const newItems = newData.map((item, index) => ({
      id: `${this.data.length + index + 1}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...item
    }));
    this.data.push(...newItems);
    return { data: newItems, error: null };
  }

  async update(data: any) {
    await delay(200);
    let results = [...this.data];
    
    // Apply filters
    for (const filter of this.filters) {
      if (filter.type === 'eq') {
        results = results.filter(item => (item as any)[filter.column] === filter.value);
      } else if (filter.type === 'in') {
        results = results.filter(item => filter.values.includes((item as any)[filter.column]));
      }
    }
    
    results.forEach(item => {
      Object.assign(item, { ...data, updated_at: new Date().toISOString() });
    });
    
    return { data: results, error: null };
  }

  async delete() {
    await delay(200);
    let indicesToDelete: number[] = [];
    
    // Apply filters to find items to delete
    for (let i = 0; i < this.data.length; i++) {
      let shouldDelete = true;
      for (const filter of this.filters) {
        if (filter.type === 'eq') {
          if ((this.data[i] as any)[filter.column] !== filter.value) {
            shouldDelete = false;
            break;
          }
        } else if (filter.type === 'in') {
          if (!filter.values.includes((this.data[i] as any)[filter.column])) {
            shouldDelete = false;
            break;
          }
        }
      }
      if (shouldDelete) {
        indicesToDelete.push(i);
      }
    }
    
    // Delete items in reverse order to maintain indices
    indicesToDelete.reverse().forEach(index => {
      this.data.splice(index, 1);
    });
    
    return { data: null, error: null };
  }
}

// Mock companies service
export const mockCompaniesService = {
  select(columns: string = '*') {
    return new MockQueryBuilder('companies', mockCompanies).select(columns);
  },

  insert(data: Partial<Company> | Partial<Company>[]) {
    return new MockQueryBuilder('companies', mockCompanies).insert(data);
  },

  update(data: Partial<Company>) {
    return new MockQueryBuilder('companies', mockCompanies).update(data);
  },

  delete() {
    return new MockQueryBuilder('companies', mockCompanies).delete();
  }
};

// Mock contacts service
export const mockContactsService = {
  select(columns: string = '*') {
    return new MockQueryBuilder('contacts', mockContacts).select(columns);
  },

  insert(data: Partial<Contact> | Partial<Contact>[]) {
    return new MockQueryBuilder('contacts', mockContacts).insert(data);
  },

  update(data: Partial<Contact>) {
    return new MockQueryBuilder('contacts', mockContacts).update(data);
  },

  delete() {
    return new MockQueryBuilder('contacts', mockContacts).delete();
  }
};

// Mock deals service
export const mockDealsService = {
  select(columns: string = '*') {
    return new MockQueryBuilder('deals', mockDeals).select(columns);
  },

  insert(data: Partial<Deal> | Partial<Deal>[]) {
    return new MockQueryBuilder('deals', mockDeals).insert(data);
  },

  update(data: Partial<Deal>) {
    return new MockQueryBuilder('deals', mockDeals).update(data);
  },

  delete() {
    return new MockQueryBuilder('deals', mockDeals).delete();
  }
};

// Mock tasks service
export const mockTasksService = {
  select(columns: string = '*') {
    return new MockQueryBuilder('tasks', mockTasks).select(columns);
  },

  insert(data: Partial<Task> | Partial<Task>[]) {
    return new MockQueryBuilder('tasks', mockTasks).insert(data);
  },

  update(data: Partial<Task>) {
    return new MockQueryBuilder('tasks', mockTasks).update(data);
  },

  delete() {
    return new MockQueryBuilder('tasks', mockTasks).delete();
  }
};

// Mock calls service
export const mockCallsService = {
  select(columns: string = '*') {
    return new MockQueryBuilder('calls', mockCalls).select(columns);
  },

  insert(data: Partial<Call> | Partial<Call>[]) {
    return new MockQueryBuilder('calls', mockCalls).insert(data);
  },

  update(data: Partial<Call>) {
    return new MockQueryBuilder('calls', mockCalls).update(data);
  },

  delete() {
    return new MockQueryBuilder('calls', mockCalls).delete();
  }
};

// Mock user profiles service
export const mockUserProfilesService = {
  select(columns: string = '*') {
    return new MockQueryBuilder('user_profiles', mockUsers).select(columns);
  },

  insert(data: Partial<User> | Partial<User>[]) {
    return new MockQueryBuilder('user_profiles', mockUsers).insert(data);
  },

  update(data: Partial<User>) {
    return new MockQueryBuilder('user_profiles', mockUsers).update(data);
  },

  delete() {
    return new MockQueryBuilder('user_profiles', mockUsers).delete();
  }
};

// Mock real-time channel
export const mockChannel = {
  on: (event: string, callback: (payload: any) => void) => {
    // Mock real-time subscription - just return the channel object
    return mockChannel;
  },
  subscribe: () => {
    // Mock subscription - just return the channel object
    return mockChannel;
  },
  unsubscribe: () => {
    // Mock unsubscribe - no-op
    return Promise.resolve();
  }
};

// Mock Supabase client
export const mockSupabase = {
  auth: mockAuth,
  from: (table: string) => {
    switch (table) {
      case 'companies':
        return mockCompaniesService;
      case 'contacts':
        return mockContactsService;
      case 'deals':
        return mockDealsService;
      case 'tasks':
        return mockTasksService;
      case 'calls':
        return mockCallsService;
      case 'user_profiles':
        return mockUserProfilesService;
      default:
        return mockCompaniesService; // fallback
    }
  },
  channel: (name: string) => {
    // Return mock channel for real-time subscriptions
    return mockChannel;
  }
};
