import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type UserInfo = {
  id: number;
  username: string;
  email: string;
  role: string;
  accessToken: string;
};

interface AuthContextType {
  user: UserInfo | null;
  login: (userData: UserInfo) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserInfo | null>(() => {
    try {
      const savedUser = localStorage.getItem('translate_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('translate_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('translate_user');
    }
  }, [user]);

  const login = (userData: UserInfo) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
