"use client";

import { TabNavigation } from "@/components/TabNavigation";
import { usePathname } from "next/navigation";

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isTaskNotesPage = pathname === "/tasknotes";

  if (isTaskNotesPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* 导航栏 */}
        <TabNavigation />
        
        {/* 任务便签全屏内容 */}
        <main className="w-full h-full">
          {children}
        </main>
      </div>
    );
  }

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
