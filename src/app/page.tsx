"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 重定向到默认的tab页面
    router.replace("/pdf");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">万事屋</h2>
        <p className="text-sm text-gray-500">正在跳转到工具页面...</p>
      </div>
    </div>
  );
}
