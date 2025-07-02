import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Brain, Home, Users, Video, Image, Menu, X, Bell, Settings, LogOut, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUser } from "@/contexts/user-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navigation() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentUser, logout } = useUser();

  const navigation = [
    { name: "首頁", href: "/", icon: Home },
    { name: "語音資源", href: "/voices", icon: Users },
    { name: "人物形象", href: "/models", icon: Users },
    { name: "影音生成", href: "/editor", icon: Video },
    { name: "作品管理", href: "/gallery", icon: Image },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Brain className="text-primary-foreground h-5 w-5" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">AI Model Studio</h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "text-primary bg-primary/10"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden sm:flex relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-bold">1</span>
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="px-3 py-2 border-b">
                  <h3 className="font-semibold text-sm">通知</h3>
                </div>
                <div className="p-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900">功能更新通知</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        聲音克隆功能正在開發中，敬請期待！目前您可以使用「用戶音頻」功能上傳自己的音頻檔案進行影片生成。
                      </p>
                      <p className="text-xs text-gray-500 mt-2">剛剛</p>
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* User menu */}
            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 px-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {currentUser.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-sm font-medium">
                      {currentUser.username}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {currentUser.username}
                    {currentUser.role === 'admin' && (
                      <span className="ml-2 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                        管理員
                      </span>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/user-management" className="flex items-center cursor-pointer">
                      <UserCog className="mr-2 h-4 w-4" />
                      帳號管理
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <div className="flex items-center cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      設定
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={logout}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    登出
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm">
                  登入
                </Button>
              </Link>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href}>
                    <div
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? "text-primary bg-primary/10"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                );
              })}
              
              {/* Mobile user menu */}
              {currentUser && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <Link href="/user-management">
                    <div
                      className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive("/user-management")
                          ? "text-primary bg-primary/10"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <UserCog className="h-5 w-5" />
                      <span>帳號管理</span>
                    </div>
                  </Link>
                  <div
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-5 w-5" />
                    <span>登出</span>
                  </div>
                </>
              )}
              
              {!currentUser && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <Link href="/login">
                    <div
                      className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span>登入</span>
                    </div>
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
