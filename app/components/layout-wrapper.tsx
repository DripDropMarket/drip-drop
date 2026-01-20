"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/app/lib/auth-context";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Sidebar from "./sidebar";
import BottomNav from "./bottom-nav";
import { MessagingProvider } from "@/app/lib/messaging-context";

const SchoolSelectionPopup = dynamic(
  () => import("./school-selection-popup"),
  { ssr: false }
);

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, loading, needsSchoolSelection, refreshUserData } = useAuth();
  const [showPopup, setShowPopup] = useState(false);

  const showSidebar = pathname !== "/" && !pathname.startsWith("/api/");

  useEffect(() => {
    if (!loading && user && needsSchoolSelection) {
      const timer = setTimeout(() => setShowPopup(true), 100);
      return () => clearTimeout(timer);
    }
  }, [user, loading, needsSchoolSelection]);

  function handlePopupComplete() {
    setShowPopup(false);
    refreshUserData();
  }

  return (
    <>
      {showPopup && <SchoolSelectionPopup onComplete={handlePopupComplete} />}
      <MessagingProvider>
        {showSidebar && <Sidebar />}
        <main className={showSidebar ? "lg:pl-64" : ""}>
          {children}
        </main>
        <BottomNav />
      </MessagingProvider>
    </>
  );
}
