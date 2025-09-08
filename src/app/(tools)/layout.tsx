"use client";

import { TabNavigation } from "@/components/TabNavigation";

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <TabNavigation />
      
      {/* 主内容区域 */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
