import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { SessionProvider } from "@/components/session-provider";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NuvaiTodo",
  description: "Task management dashboard with MCP integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${dmSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <SessionProvider>
          <Nav />
          <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
