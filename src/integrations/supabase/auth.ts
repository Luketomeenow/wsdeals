import { mockAuth } from "@/services/mockServices";

export async function signInWithEmailPassword(email: string, password: string) {
  const { data, error } = await mockAuth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpWithEmailPassword(email: string, password: string) {
  // For mock purposes, just sign in with the provided credentials
  const { data, error } = await mockAuth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await mockAuth.signOut();
  if (error) throw error;
}

export async function getCurrentSession() {
  const { data } = await mockAuth.getUser();
  return { session: data.user ? { user: data.user } : null };
}


