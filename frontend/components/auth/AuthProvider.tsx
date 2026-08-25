"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AuthSession,
  clearSession,
  getStoredSession,
  login as loginRequest,
  LoginRequest,
} from "@/lib/auth";

interface AuthContextValue {
  session: AuthSession | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (
    request: LoginRequest
  ) => Promise<AuthSession>;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined
  );

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [session, setSession] =
    useState<AuthSession | null>(null);

  const [loading, setLoading] = useState(true);

  const isLoginPage =
    pathname === "/login" ||
    pathname.startsWith("/login/");

  useEffect(() => {
    const storedSession = getStoredSession();

    setSession(storedSession);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (isLoginPage) {
      return;
    }

    if (!session) {
      router.replace("/login");
    }
  }, [
    loading,
    session,
    isLoginPage,
    router,
  ]);

  const login = useCallback(
    async (
      request: LoginRequest
    ): Promise<AuthSession> => {
      const authenticatedSession =
        await loginRequest(request);

      setSession(authenticatedSession);

      return authenticatedSession;
    },
    []
  );

  const logout = useCallback(() => {
    clearSession();
    setSession(null);

    router.replace("/login");
  }, [router]);

  const hasRole = useCallback(
    (role: string): boolean => {
      if (!session) {
        return false;
      }

      return session.roles.includes(role);
    },
    [session]
  );

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!session) {
        return false;
      }

      return session.permissions.includes(
        permission
      );
    },
    [session]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      isAuthenticated: session !== null,
      login,
      logout,
      hasRole,
      hasPermission,
    }),
    [
      session,
      loading,
      login,
      logout,
      hasRole,
      hasPermission,
    ]
  );

  if (
    loading &&
    !isLoginPage
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-sm font-bold text-white">
            NW
          </div>

          <p className="text-sm font-medium text-ink">
            Loading NextWare...
          </p>

          <p className="mt-1 text-xs text-ink-muted">
            Checking authentication
          </p>
        </div>
      </div>
    );
  }

  if (
    !loading &&
    !isLoginPage &&
    !session
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-sm font-bold text-white">
            NW
          </div>

          <p className="text-sm font-medium text-ink">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}