import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, setUnauthorizedHandler, TOKEN_KEY } from '../lib/api';
import { storage } from '../lib/storage';
import type { Customer } from '../lib/types';
import { useUi } from './ui';

interface AuthValue {
  token: string | null;
  customer: Customer | null;
  ready: boolean;
  signIn: (token: string, customer: Customer) => void;
  signOut: () => void;
  setCustomer: (customer: Customer) => void;
  /** Runs `then` now if signed in, otherwise after the customer signs in. */
  requireAuth: (then?: () => void, reason?: string) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const { openAuth } = useUi();
  const [token, setToken] = useState<string | null>(() => storage.get<string | null>(TOKEN_KEY, null));

  const me = useQuery({
    queryKey: ['me', token],
    queryFn: api.me,
    enabled: !!token,
    staleTime: 60_000,
    retry: false,
  });

  const signOut = useCallback(() => {
    storage.remove(TOKEN_KEY);
    setToken(null);
    qc.removeQueries({ queryKey: ['me'] });
    qc.removeQueries({ queryKey: ['bookings'] });
    qc.removeQueries({ queryKey: ['booking'] });
  }, [qc]);

  useEffect(() => {
    setUnauthorizedHandler(signOut);
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const signIn = useCallback(
    (t: string, customer: Customer) => {
      storage.set(TOKEN_KEY, t);
      setToken(t);
      qc.setQueryData(['me', t], { customer });
    },
    [qc],
  );

  const setCustomer = useCallback((customer: Customer) => qc.setQueryData(['me', token], { customer }), [qc, token]);

  const customer = me.data?.customer ?? null;
  const requireAuth = useCallback(
    (then?: () => void, reason?: string) => {
      if (token && customer) then?.();
      else openAuth({ reason, onSuccess: then });
    },
    [token, customer, openAuth],
  );

  const value = useMemo<AuthValue>(
    () => ({ token, customer, ready: !token || !me.isLoading, signIn, signOut, setCustomer, requireAuth }),
    [token, customer, me.isLoading, signIn, signOut, setCustomer, requireAuth],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
