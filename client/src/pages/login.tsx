import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@/contexts/user-context';
import { LogIn, Users, UserCog } from 'lucide-react';
import { Link, useLocation } from 'wouter';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, guestLogin, loading, error } = useUser();
  const [, setLocation] = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      // 登入成功後重定向到首頁
      setLocation('/');
    } catch (error) {
      // 錯誤已經由 login 函數處理
    }
  };

  const handleGuestLogin = () => {
    guestLogin();
    // 訪客登入後也重定向到首頁
    setTimeout(() => {
      setLocation('/');
    }, 500);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* 右上角帳號管理按鈕 */}
      <div className="absolute top-4 right-4">
        <Button variant="outline" asChild>
          <Link href="/user-management" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            帳號管理
          </Link>
        </Button>
      </div>
      
      <Card className="w-full max-w-md mx-4 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <LogIn className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">登入 AI Model Studio</CardTitle>
          <CardDescription>請登入您的帳號或以訪客身份繼續</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">使用者名稱</Label>
              <Input
                id="username"
                type="text"
                placeholder="請輸入使用者名稱"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密碼</Label>
              <Input
                id="password"
                type="password"
                placeholder="請輸入密碼"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登入中...' : '登入'}
            </Button>
          </form>
          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500 dark:bg-gray-950">
                或者
              </span>
            </div>
          </div>
          <Button variant="outline" className="w-full mt-6" onClick={handleGuestLogin} disabled={loading}>
            <Users className="mr-2 h-4 w-4" />
            訪客登入
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
