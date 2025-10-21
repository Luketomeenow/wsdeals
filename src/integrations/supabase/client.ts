// Mock Supabase client for development
import { mockSupabase } from '@/services/mockServices';

// Use mock services instead of real Supabase
export const supabase = mockSupabase;