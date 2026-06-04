"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import ChatWidget from "@/components/chatbot/ChatbotWidget";
import AuthHydrator from "@/components/auth/auth-hydrator";

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
      <AuthHydrator />
      {!hideChrome ? <Header /> : null}
      {children}
      {!hideChrome ? <Footer /> : null}
      {!hideChrome ? <ChatWidget /> : null}
    </>
  );
}
