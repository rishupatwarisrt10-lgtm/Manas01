// src/app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/components/AuthProvider";
import LiveBackground from "@/app/components/LiveBackground";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Manas: The Mindful Pomodoro",
  description: "A sanctuary for deep focus and mindful productivity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* We apply our animated gradient and a base text color here */}
      <body className={`${inter.className} text-white h-screen overflow-hidden animated-gradient`}>
        <AuthProvider>
          <AppProvider>
            {/* Global Live Background - persists across all pages */}
            <LiveBackground />
            {children}
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}