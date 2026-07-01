import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
}

interface AuthContextType {
  setUser: (user: User) => void;
  user: User | null;
  loading: boolean;

  login: (email: string, password: string) => Promise<void>;

  register: (
    email: string,
    password: string,
    username: string,
    name: string,
    avatarId: string,
  ) => Promise<void>;

  logout: () => Promise<void>;

  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Uses localhost during development and Railway in production
const API_URL =
  `${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3001" : "")}/api/auth`;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // -------------------------
  // INIT AUTH (/me)
  // -------------------------
  useEffect(() => {
    const initAuth = async () => {
      try {
        const response = await fetch(`${API_URL}/me`, {
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setUser(data.data);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // -------------------------
  // LOGIN
  // -------------------------
  const login = useCallback(async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    console.log("[AuthContext] Login response:", data);

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Login failed");
    }

    console.log("[AuthContext] Setting user after login:", data.data.user);
    setUser(data.data.user);
  }, []);

  // -------------------------
  // REGISTER
  // -------------------------
  const register = useCallback(
    async (
      email: string,
      password: string,
      username: string,
      name: string,
      avatarId: string,
    ) => {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          username,
          name,
          avatarId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Registration failed");
      }

      setUser(data.data.user);
    },
    [],
  );

  // -------------------------
  // LOGOUT
  // -------------------------
  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore logout errors
    }

    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        setUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};