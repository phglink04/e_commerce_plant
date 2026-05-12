"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import ChatWidget from "@/components/chat/ChatWidget";

type AppLayoutProps = {
  children: React.ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const hideChrome =
    //pathname.startsWith("/auth") ||
    pathname.startsWith("/admin") || pathname.startsWith("/deliveryPartner");

  return (
    <>
      {!hideChrome ? <Header /> : null}
      {children}
      {!hideChrome ? <Footer /> : null}
      {!hideChrome ? <ChatWidget /> : null}
    </>
  );
}
