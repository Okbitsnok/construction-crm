import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { ThemeRegistry } from "@/materialUI/ThemeRegistry";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Мини-CRM: объекты и задачи",
  description: "Постановка и контроль задач по строительным объектам",
  robots: { index: false, follow: false },
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ru" className={inter.variable} suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="class" />
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
