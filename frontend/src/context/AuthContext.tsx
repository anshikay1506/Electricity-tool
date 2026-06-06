import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'SUPPLIER' | 'CONSUMER' | 'TRADER';
  profile?: any;
  k_number?: string;
  connection_type?: string;
  phoneNumber?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  updateUserRoleLocally: (role: 'ADMIN' | 'SUPPLIER' | 'CONSUMER' | 'TRADER') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('goar_token');
    const savedUser = localStorage.getItem('goar_user');

    if (savedToken && savedUser) {
      const parsedUser: User = JSON.parse(savedUser);
      // Remove the status/state checks
      setToken(savedToken);
      setUser(parsedUser);
    }
    setLoading(false);
  }, []);

  const login = useCallback((newToken: string, userData: User) => {
    localStorage.setItem('goar_token', newToken);
    localStorage.setItem('goar_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('goar_token');
    localStorage.removeItem('goar_user');
    setToken(null);
    setUser(null);
    window.location.href = '/auth';
  }, []);

  const updateUserRoleLocally = (newRole: 'ADMIN' | 'SUPPLIER' | 'CONSUMER' | 'TRADER') => {
    if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
      localStorage.setItem('goar_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUserRoleLocally }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};