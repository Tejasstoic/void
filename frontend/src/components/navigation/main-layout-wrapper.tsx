"use client";

import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/use-auth-store";

export default function MainLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  
  const hideSidebar = !user || pathname === "/" || pathname === "/login" || pathname === "/register";

  return (
    <div className={hideSidebar ? "w-full" : "md:ml-64 min-h-screen"}>
      {children}
    </div>
  );
}
