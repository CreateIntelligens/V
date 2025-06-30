import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Mic, 
  User, 
  Video, 
  Image,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navigation = [
  { name: "首頁", href: "/", icon: Home },
  { name: "AI 模特", href: "/models", icon: User },
  { name: "影音生成器", href: "/editor", icon: Video },
  { name: "作品畫廊", href: "/gallery", icon: Image },
];

export function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const [location] = useLocation();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="p-4 border-b border-gray-200">
          <SheetTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Video className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">AI Model Studio</span>
          </SheetTitle>
        </SheetHeader>

        {/* 導航選單 */}
        <nav className="flex flex-1 flex-col px-4 py-4">
          <ul role="list" className="flex flex-1 flex-col gap-y-2">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <li key={item.name}>
                  <Link href={item.href}>
                    <a 
                      className={cn(
                        "group flex gap-x-3 rounded-md p-3 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "text-gray-700 hover:text-blue-700 hover:bg-gray-50"
                      )}
                      onClick={() => onOpenChange(false)}
                    >
                      <item.icon className={cn(
                        "h-5 w-5 shrink-0",
                        isActive ? "text-blue-700" : "text-gray-400 group-hover:text-blue-700"
                      )} />
                      <span className="truncate">{item.name}</span>
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* 底部資訊 */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            <p>AI Model Studio</p>
            <p className="mt-1">v1.0.0</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
