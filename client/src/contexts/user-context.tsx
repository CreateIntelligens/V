import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
  note?: string;
  createdAt?: string;
}

interface UserContextType {
  currentUser: User | null;
  login: (username: string, password?: string) => Promise<void>;
  guestLogin: () => void;
  logout: () => void;
  loading: boolean;
  error: string | null;
  isGlobalUser: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (!storedUser) return null;
    try {
      // 嘗試解析新格式 (JSON)
      return JSON.parse(storedUser);
    } catch (error) {
      // 如果解析失敗，可能是舊格式 (純字串)
      console.warn("Failed to parse user from localStorage, might be old format.", error);
      // 清除舊的無效資料
      localStorage.removeItem('currentUser');
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
    // 當用戶切換時，清空 sessionStorage 中的生成內容
    sessionStorage.removeItem('generatedVideo');
    sessionStorage.removeItem('generatedVideoId');
    sessionStorage.removeItem('generatedAudio');
    sessionStorage.removeItem('generatedAudioId');
  }, [currentUser]);

  const login = async (username: string, password?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || '登入失敗');
      }
      
      setCurrentUser(data.data);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const guestLogin = () => {
    setLoading(true);
    setError(null);
    // 模擬一個快速的訪客登入
    setTimeout(() => {
      setCurrentUser({ id: 0, username: 'global', role: 'user' });
      setLoading(false);
    }, 300);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const isGlobalUser = currentUser?.username === 'global';

  const value: UserContextType = {
    currentUser,
    login,
    guestLogin,
    logout,
    loading,
    error,
    isGlobalUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
