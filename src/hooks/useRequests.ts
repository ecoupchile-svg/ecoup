'use client';
import { useEffect, useState, useCallback } from 'react';
import { getUserRequests, getAvailableRequests, getRecyclerRequests } from '@/lib/supabase';
import type { RecycleRequest } from '@/types';

export function useUserRequests() {
  const [requests, setRequests] = useState<RecycleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUserRequests();
      setRequests(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { requests, loading, error, refresh };
}

export function useAvailableRequests() {
  const [requests, setRequests] = useState<RecycleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAvailableRequests();
      setRequests(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { requests, loading, error, refresh };
}

export function useRecyclerRequests() {
  const [requests, setRequests] = useState<RecycleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRecyclerRequests();
      setRequests(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  return { requests, loading, error, refresh };
}
