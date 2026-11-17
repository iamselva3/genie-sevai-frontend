import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

export interface Toast {
  id: number;
  message: string;
  tone: 'ink' | 'ok' | 'bad';
}

interface AuthRequest {
  reason?: string;
  onSuccess?: () => void;
}

interface UiValue {
  searchOpen: boolean;
  cityOpen: boolean;
  auth: AuthRequest | null;
  toasts: Toast[];
  openSearch: () => void;
  closeSearch: () => void;
  openCity: () => void;
  closeCity: () => void;
  openAuth: (req?: AuthRequest) => void;
  closeAuth: () => void;
  toast: (message: string, tone?: Toast['tone']) => void;
  dismissToast: (id: number) => void;
}

const UiContext = createContext<UiValue | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [auth, setAuth] = useState<AuthRequest | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback(
    (message: string, tone: Toast['tone'] = 'ink') => {
      const id = nextId.current++;
      setToasts((t) => [...t.slice(-2), { id, message, tone }]);
      window.setTimeout(() => dismissToast(id), 3800);
    },
    [dismissToast],
  );

  const value = useMemo<UiValue>(
    () => ({
      searchOpen,
      cityOpen,
      auth,
      toasts,
      openSearch: () => setSearchOpen(true),
      closeSearch: () => setSearchOpen(false),
      openCity: () => setCityOpen(true),
      closeCity: () => setCityOpen(false),
      openAuth: (req = {}) => setAuth(req),
      closeAuth: () => setAuth(null),
      toast,
      dismissToast,
    }),
    [searchOpen, cityOpen, auth, toasts, toast, dismissToast],
  );
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUi must be used inside UiProvider');
  return ctx;
}
