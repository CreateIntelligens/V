import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider, useUser } from "@/contexts/user-context";
import { Sidebar } from "@/components/sidebar";
import { TopNavigation } from "@/components/top-navigation";
import { MobileSidebar } from "@/components/mobile-sidebar";
import Home from "@/pages/home";
import Models from "@/pages/models";
import Editor from "@/pages/editor";
import Gallery from "@/pages/gallery";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import UserManagementPage from "@/pages/user-management";
import { useState } from "react";

function MainApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex dark:bg-gray-900">
      <Sidebar 
        isCollapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      <MobileSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        <TopNavigation onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/models" component={Models} />
              <Route path="/editor" component={Editor} />
              <Route path="/gallery" component={Gallery} />
              <Route component={NotFound} />
            </Switch>
          </div>
        </main>
      </div>
    </div>
  );
}

function AppContent() {
  const { currentUser } = useUser();

  return (
    <Switch>
      {/* 帳號管理頁面完全開放，不需要登入 */}
      <Route path="/user-management" component={UserManagementPage} />
      <Route path="/login" component={LoginPage} />
      
      {/* 其他頁面需要登入 */}
      <Route path="*">
        {currentUser ? <MainApp /> : <LoginPage />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
