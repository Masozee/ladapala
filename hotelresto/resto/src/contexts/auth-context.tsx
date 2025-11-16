'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, type User, type Employee, type UserProfile, type Staff } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  employee: Employee | null;
  profile: UserProfile | null;
  staff: Staff | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = user !== null;

  // Check session on mount only
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await api.checkSession();
        if (response.authenticated && response.user) {
          setUser(response.user);
          setEmployee(response.employee || null);
          setProfile(response.profile || null);
          setStaff(response.staff || null);
        } else {
          setUser(null);
          setEmployee(null);
          setProfile(null);
          setStaff(null);
        }
      } catch (error) {
        console.error('Session check failed:', error);
        setUser(null);
        setEmployee(null);
        setProfile(null);
        setStaff(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manual refresh session function
  const refreshSession = useCallback(async () => {
    try {
      const response = await api.checkSession();
      if (response.authenticated && response.user) {
        setUser(response.user);
        setEmployee(response.employee || null);
        setProfile(response.profile || null);
        setStaff(response.staff || null);
      } else {
        setUser(null);
        setEmployee(null);
        setProfile(null);
        setStaff(null);
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setUser(null);
      setEmployee(null);
      setProfile(null);
      setStaff(null);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.login(email, password);
      setUser(response.user);
      setEmployee(response.employee || null);
      setProfile(response.profile || null);
      setStaff(response.staff || null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
      setUser(null);
      setEmployee(null);
      setProfile(null);
      setStaff(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Clear state anyway on logout failure
      setUser(null);
      setEmployee(null);
      setProfile(null);
      setStaff(null);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        employee,
        profile,
        staff,
        isLoading,
        isAuthenticated,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
