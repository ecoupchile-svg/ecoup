import { createBrowserClient } from '@supabase/ssr';
import type { Profile, RecycleRequest, Evidence, Rating } from '@/types';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const MAX_EVIDENCE_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EVIDENCE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ── Auth ──────────────────────────────────────────────────────────────────────
export async function signUp(email: string, password: string, full_name: string, role: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { full_name, role } },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) return null;
  return data;
}

// ── Requests ──────────────────────────────────────────────────────────────────
export async function createRequest(payload: {
  title: string; description: string; waste_type: string;
  estimated_weight?: number; address: string; latitude: number;
  longitude: number; scheduled_at?: string;
}): Promise<RecycleRequest> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');
  const { data, error } = await supabase
    .from('requests')
    .insert({ ...payload, user_id: user.id, status: 'PENDING' })
    .select('*').single();
  if (error) throw error;
  return data;
}

export async function getUserRequests(): Promise<RecycleRequest[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('requests')
    .select(`*, user_profile:profiles!requests_user_id_fkey(*), recycler_profile:profiles!requests_recycler_id_fkey(*), evidence(*), rating(*)`)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getAvailableRequests(): Promise<RecycleRequest[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('requests')
    .select(`*, user_profile:profiles!requests_user_id_fkey(*)`)
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getRecyclerRequests(): Promise<RecycleRequest[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('requests')
    .select(`*, user_profile:profiles!requests_user_id_fkey(*), evidence(*), rating(*)`)
    .eq('recycler_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getRequestById(id: string): Promise<RecycleRequest | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('requests')
    .select(`*, user_profile:profiles!requests_user_id_fkey(*), recycler_profile:profiles!requests_recycler_id_fkey(*), evidence(*), rating(*)`)
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

export async function acceptRequest(requestId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');
  const { error } = await supabase
    .from('requests')
    .update({ recycler_id: user.id, status: 'ACCEPTED', updated_at: new Date().toISOString() })
    .eq('id', requestId).eq('status', 'PENDING');
  if (error) throw error;
}

export async function updateRequestStatus(requestId: string, status: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', requestId);
  if (error) throw error;
}

// ── Evidence ──────────────────────────────────────────────────────────────────
export async function uploadEvidence(
  requestId: string, imageFile: File, latitude: number, longitude: number, notes?: string
): Promise<Evidence> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');
  if (!ALLOWED_EVIDENCE_TYPES.includes(imageFile.type)) {
    throw new Error('Formato de imagen no permitido');
  }
  if (imageFile.size > MAX_EVIDENCE_FILE_SIZE) {
    throw new Error('La imagen no puede superar 5 MB');
  }

  const ext = imageFile.type.split('/')[1] || imageFile.name.split('.').pop();
  const path = `evidence/${requestId}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from('evidence')
    .upload(path, imageFile, { upsert: true });
  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage.from('evidence').getPublicUrl(path);

  const { data, error } = await supabase
    .from('evidence')
    .insert({ request_id: requestId, recycler_id: user.id, image_url: publicUrl, latitude, longitude, notes })
    .select('*').single();
  if (error) throw error;

  await updateRequestStatus(requestId, 'EVIDENCE_UPLOADED');
  return data;
}

// ── Rating ────────────────────────────────────────────────────────────────────
export async function submitRating(
  requestId: string, ratedId: string, score: number, comment?: string
): Promise<Rating> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data, error } = await supabase
    .from('rating')
    .insert({ request_id: requestId, rater_id: user.id, rated_id: ratedId, score, comment })
    .select('*').single();
  if (error) throw error;

  await updateRequestStatus(requestId, 'COMPLETED');
  return data;
}
