import { Button } from "@/components/ui/button";
import { Menu, Bell, User } from "lucide-react";

interface TopNavigationProps {
  onMenuClick?: () => void;
}

export function TopNavigation({ onMenuClick }: TopNavigationProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* 手機版選單按鈕 */}
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">開啟選單</span>
      </Button>

      {/* 分隔線 */}
      <div className="h-6 w-px bg-gray-200 lg:hidden" />

      {/* 空白區域取代搜尋框 */}
      <div className="flex flex-1"></div>

      {/* 右側按鈕組 */}
      <div className="flex items-center gap-x-4 lg:gap-x-6">
        {/* 通知按鈕 */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          <span className="sr-only">查看通知</span>
          {/* 通知小紅點 */}
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500"></span>
        </Button>

        {/* 分隔線 */}
        <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />

        {/* 用戶選單 */}
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <span className="hidden lg:block text-sm font-medium text-gray-700">
            用戶
          </span>
        </Button>
      </div>
    </header>
  );
}
