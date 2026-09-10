import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getCurrentUserApi, loginApi, registerApi } from '@/services/api/auth';
import type { LoginCredentials, RegisterCredentials, User } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (credentials: RegisterCredentials) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session on browser refresh (F5)
  useEffect(() => {
    async function restoreSession() {
      const storedToken = sessionStorage.getItem('token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await getCurrentUserApi();
        setUser(currentUser);
        setToken(storedToken);
      } catch {
        sessionStorage.removeItem('token');
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

const login = async (credentials: LoginCredentials): Promise<User> => {
    const response = await loginApi(credentials);

    // Save the token FIRST so every following API request is authenticated.
    sessionStorage.setItem('token', response.token);
    setToken(response.token);

    // Set the user immediately.
    setUser(response.user);

    // Login is complete; allow protected pages to load.
    setIsLoading(false);

    // Verify the authenticated session before navigating to the dashboard.
    try {
        const currentUser = await getCurrentUserApi();
        setUser(currentUser);
        return currentUser;
    } catch (error) {
        sessionStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setIsLoading(false);
        throw error;
    }
};

  const register = async (credentials: RegisterCredentials): Promise<User> => {
    const response = await registerApi(credentials);
    sessionStorage.setItem('token', response.token);
    setToken(response.token);
    setUser(response.user);
    return response.user;
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

