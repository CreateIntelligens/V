import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Trash2, Shield, Key, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/contexts/user-context";

interface UserData {
  id: number;
  username: string;
  password: string | null;
  role: "admin" | "user";
}

export function UserManagement() {
  const [deleteUsername, setDeleteUsername] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentUser } = useUser();
  
  const isCurrentUserAdmin = currentUser?.role === "admin";

  // 獲取用戶列表
  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users");
      return response.json();
    },
  });

  const users: UserData[] = usersResponse?.data || [];

  // 刪除用戶的 mutation
  const deleteUserMutation = useMutation({
    mutationFn: async ({ username, password, useAdminPrivilege }: { 
      username: string; 
      password?: string; 
      useAdminPrivilege?: boolean;
    }) => {
      const requestBody: any = {};
      
      if (useAdminPrivilege && isCurrentUserAdmin) {
        requestBody.adminUsername = currentUser?.username;
        requestBody.adminPassword = adminPassword;
      } else {
        requestBody.password = password || undefined;
      }
      
      const response = await apiRequest("DELETE", `/api/users/${username}`, requestBody);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "刪除成功",
        description: data.message || "用戶已成功刪除",
      });
      setShowDeleteDialog(false);
      setDeleteUsername("");
      setDeletePassword("");
      setAdminPassword("");
      setUserToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "刪除失敗",
        description: error.message || "密碼錯誤或用戶不存在",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (user: UserData) => {
    if (user.username === "global") {
      toast({
        title: "無法刪除",
        description: "Global 用戶無法刪除",
        variant: "destructive",
      });
      return;
    }
    
    setUserToDelete(user);
    setDeleteUsername(user.username);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (!userToDelete) return;
    
    // 檢查是否使用管理員權限
    const useAdminPrivilege = isCurrentUserAdmin && adminPassword;
    
    deleteUserMutation.mutate({
      username: userToDelete.username,
      password: deletePassword || undefined,
      useAdminPrivilege,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>用戶管理</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>用戶管理</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暫無用戶數據
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    user.role === "admin" ? "bg-purple-100" : 
                    user.username === "global" ? "bg-blue-100" : "bg-gray-100"
                  }`}>
                    {user.role === "admin" ? (
                      <Crown className="h-5 w-5 text-purple-600" />
                    ) : user.username === "global" ? (
                      <Shield className="h-5 w-5 text-blue-600" />
                    ) : (
                      <User className="h-5 w-5 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-gray-500 flex items-center">
                      <Key className="h-3 w-3 mr-1" />
                      {user.password ? "有密碼" : "無密碼"}
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        user.role === "admin" ? "bg-purple-100 text-purple-700" :
                        user.username === "global" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {user.role === "admin" ? "管理員" : 
                         user.username === "global" ? "系統用戶" : "一般用戶"}
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {user.username !== "global" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(user)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 刪除確認對話框 */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>確認刪除用戶</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-600">
                確定要刪除用戶 <strong>{userToDelete?.username}</strong> 嗎？
              </p>
              
              {isCurrentUserAdmin && (
                <div className="space-y-2 p-3 bg-purple-50 rounded-lg border">
                  <Label htmlFor="admin-password" className="text-purple-700 font-medium">
                    管理員權限刪除 (無需用戶密碼)
                  </Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="輸入您的管理員密碼"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />
                  <p className="text-xs text-purple-600">
                    使用管理員權限將跳過用戶密碼驗證
                  </p>
                </div>
              )}
              
              {!isCurrentUserAdmin && userToDelete?.password && (
                <div className="space-y-2">
                  <Label htmlFor="delete-password">請輸入該用戶的密碼以確認刪除</Label>
                  <Input
                    id="delete-password"
                    type="password"
                    placeholder={`輸入 ${userToDelete.username} 的密碼`}
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                  />
                </div>
              )}
              
              {!isCurrentUserAdmin && !userToDelete?.password && (
                <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
                  該用戶沒有設置密碼，可以直接刪除
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setDeletePassword("");
                    setAdminPassword("");
                    setUserToDelete(null);
                  }}
                >
                  取消
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={deleteUserMutation.isPending || 
                    (isCurrentUserAdmin && !adminPassword) ||
                    (!isCurrentUserAdmin && userToDelete?.password && !deletePassword)}
                >
                  {deleteUserMutation.isPending ? "刪除中..." : 
                   isCurrentUserAdmin && adminPassword ? "管理員刪除" : "確認刪除"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}