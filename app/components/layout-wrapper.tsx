"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./sidebar";
import BottomNav from "./bottom-nav";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showSidebar = pathname !== "/" && !pathname.startsWith("/api/");

  return (
    <>
      {showSidebar && <Sidebar />}
      <main className={showSidebar ? "lg:pl-64" : ""}>
        {children}
      </main>
      <BottomNav />
    </>
  );
}
