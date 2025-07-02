import { Button } from "@/components/ui/button";
import { Menu, Bell, User, LogOut, Settings, LifeBuoy, UserCog } from "lucide-react";
import { useUser } from "@/contexts/user-context";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TopNavigationProps {
  onMenuClick?: () => void;
}

export function TopNavigation({ onMenuClick }: TopNavigationProps) {
  const { currentUser, logout } = useUser();

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 dark:bg-gray-950 dark:border-gray-800">
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">開啟選單</span>
      </Button>

      <div className="h-6 w-px bg-gray-200 lg:hidden dark:bg-gray-700" />

      <div className="flex flex-1"></div>

      <div className="flex items-center gap-x-4 lg:gap-x-6">
        {/* 帳號管理按鈕 - 所有人都可以使用 */}
        <Button variant="ghost" size="sm" asChild>
          <Link href="/user-management" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            <span className="hidden lg:inline">帳號管理</span>
          </Link>
        </Button>

        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          <span className="sr-only">查看通知</span>
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></span>
        </Button>

        <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200 dark:bg-gray-700" />

        {currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://api.dicebear.com/7.x/micah/svg?seed=${currentUser.username}`} alt={currentUser.username} />
                  <AvatarFallback>{currentUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="hidden lg:inline">{currentUser.username}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex items-center">
                <span>我的帳號</span>
                {currentUser.role === 'admin' && (
                  <span className="ml-2 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                    管理員
                  </span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>個人資料</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>設定</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LifeBuoy className="mr-2 h-4 w-4" />
                <span>支援</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>登出</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
