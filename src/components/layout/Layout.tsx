import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { DialpadCTI } from "@/components/calls/DialpadCTI";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [showCTI, setShowCTI] = useState(false);

  useEffect(() => {
    // Only show CTI on admin routes (not on EOD login/portal or public pages)
    const adminRoutes = ['/', '/deals', '/contacts', '/companies', '/calls', '/reports', '/calendar', '/tasks', '/admin', '/jobs', '/settings'];
    const isAdminRoute = adminRoutes.some(route => 
      location.pathname === route || location.pathname.startsWith(route + '/')
    );
    setShowCTI(isAdminRoute);
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      {showCTI && <DialpadCTI />}
    </div>
  );
}