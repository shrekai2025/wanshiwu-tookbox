import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "万事屋",
  description: "Professional toolkit for document processing, image creation, and productivity",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="h-full antialiased">
        <div className="relative flex min-h-screen flex-col bg-background">
          {children}
        </div>
      </body>
    </html>
  );
}
