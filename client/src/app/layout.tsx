import type { Metadata } from "next";
import { Montserrat, Lexend, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/layouts/app-layout";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin", "vietnamese"],
  variable: "--font-heading",
  weight: ["500", "600", "700", "800", "900"],
  display: "swap",
});

const lexend = Lexend({
  subsets: ["latin", "vietnamese"],
  variable: "--font-heading-alt",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PlantWorld — Cây Cảnh Cao Cấp",
  description: "PlantWorld — Mua sắm cây cảnh cao cấp trực tuyến, giao hàng toàn quốc.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${beVietnamPro.variable} ${montserrat.variable} ${lexend.variable}`}>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
