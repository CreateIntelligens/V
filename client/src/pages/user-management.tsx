import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/user-context';
import { useLocation, Link } from 'wouter';

// 定義使用者類型
interface User {
  username: string;
  role: 'admin' | 'user';
  createdAt: string;
  note?: string;
}

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const { currentUser, loading: userLoading, logout } = useUser();
  const [, setLocation] = useLocation();

  // 獲取使用者列表
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('無法獲取使用者列表');
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setUsers(data.data);
      } else {
        throw new Error(data.message || '回傳的資料格式不正確');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '發生未知錯誤';
      setError(errorMessage);
      toast({
        title: '錯誤',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // 新增使用者
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: newUsername, 
          password: newPassword,
          note: newNote || undefined // 只在有值時才發送
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.detail || '建立使用者失敗');
      }
      toast({
        title: '成功',
        description: `使用者 ${newUsername} 已建立。`,
      });
      setNewUsername('');
      setNewPassword('');
      setNewNote('');
      fetchUsers(); // 重新獲取列表
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '發生未知錯誤';
      toast({
        title: '錯誤',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    // 直接獲取使用者列表，不需要登入檢查
    fetchUsers();
  }, []);

  // 刪除使用者
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const requestBody: any = {};
      
      if (isAdmin && currentUser) {
        // 管理員使用管理員權限
        requestBody.adminUsername = currentUser.username;
        requestBody.adminPassword = deletePassword;
      } else {
        // 普通用戶或未登入用戶使用該用戶的密碼
        requestBody.password = deletePassword;
      }
      
      const response = await fetch(`/api/users/${userToDelete.username}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || '刪除使用者失敗');
      }
      toast({
        title: '成功',
        description: data.message || `使用者 ${userToDelete.username} 已被刪除。`,
      });
      
      // 檢查是否刪除的是當前登入的用戶
      if (currentUser && userToDelete.username === currentUser.username) {
        toast({
          title: '帳號已刪除',
          description: '您的帳號已被刪除，即將自動登出。',
        });
        // 延遲一下讓用戶看到提示信息，然後登出並重定向
        setTimeout(() => {
          logout();
          setLocation('/login');
        }, 2000);
      }
      
      setUserToDelete(null);
      setDeletePassword('');
      fetchUsers(); // 重新獲取列表
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '發生未知錯誤';
      toast({
        title: '錯誤',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // 檢查是否有登入用戶以決定一些功能的顯示
  const isAdmin = currentUser?.role === 'admin';
  const displayUsers = users;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 簡單的導航欄 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/">
                <h1 className="text-xl font-bold text-primary cursor-pointer hover:text-primary/80">
                  AI Model Studio - 帳號管理
                </h1>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {currentUser ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    {currentUser.username}
                    {isAdmin && (
                      <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                        管理員
                      </span>
                    )}
                  </span>
                  <Link href="/">
                    <Button variant="outline" size="sm">
                      返回主頁
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/login">
                    <Button variant="outline" size="sm">
                      登入
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="ghost" size="sm">
                      返回主頁
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      
      {/* 主要內容 */}
      <div className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-6">帳號管理</h1>
      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>使用者列表</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && <p>載入中...</p>}
              {error && <p className="text-red-500">{error}</p>}
              {!loading && !error && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>使用者名稱</TableHead>
                      <TableHead>角色</TableHead>
                      <TableHead>備註</TableHead>
                      <TableHead>建立時間</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayUsers.map((user) => (
                      <TableRow key={user.username}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>{user.note || '-'}</TableCell>
                        <TableCell>
                          {user.createdAt 
                            ? new Date(user.createdAt).toLocaleString('zh-TW', {
                                timeZone: 'Asia/Taipei',
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          {/* 所有用戶都能刪除帳號（除了 global 系統用戶和 ai360 管理員） */}
                          {user.username !== 'global' && user.username !== 'ai360' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(user)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          {user.username === 'ai360' && (
                            <span className="text-xs text-gray-500">受保護</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="mr-2 h-5 w-5" />
                新增使用者
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-username">使用者名稱</Label>
                  <Input
                    id="new-username"
                    placeholder="請輸入名稱"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">密碼</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="請輸入密碼"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isCreating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-note">備註 (可選)</Label>
                  <Input
                    id="new-note"
                    placeholder="提示密碼或其他備註"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    disabled={isCreating}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isCreating}>
                  {isCreating ? '建立中...' : '建立帳號'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 刪除確認對話框 */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除使用者？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原。請輸入使用者 '{userToDelete?.username}' 的密碼以確認刪除。
              {currentUser && userToDelete?.username === currentUser.username && (
                <div className="mt-2 text-red-600 text-sm font-medium">
                  ⚠️ 您正在刪除自己的帳號，刪除後將自動登出
                </div>
              )}
              {isAdmin && currentUser && (
                <div className="mt-2 text-purple-600 text-sm">
                  管理員可以使用自己的密碼進行刪除
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            {isAdmin && currentUser && (
              <div className="space-y-2 p-3 bg-purple-50 rounded-lg border">
                <Label htmlFor="admin-password" className="text-purple-700 font-medium">
                  管理員權限刪除
                </Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="輸入您的管理員密碼"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                />
                <p className="text-xs text-purple-600">
                  使用管理員權限可以刪除任何用戶
                </p>
              </div>
            )}
            
            {(!isAdmin || !currentUser) && (
              <div className="space-y-2">
                <Label htmlFor="delete-password">用戶密碼</Label>
                <Input
                  id="delete-password"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder={`請輸入 ${userToDelete?.username} 的密碼`}
                />
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletePassword('')}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting || !deletePassword}>
              {isDeleting ? '刪除中...' : '確認刪除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
};

export default UserManagementPage;
