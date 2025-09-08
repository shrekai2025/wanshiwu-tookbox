"use client";

import dynamic from "next/dynamic";

// 动态导入 PDF2ImageComposer 以避免 SSR 问题
const PDF2ImageComposer = dynamic(() => import("@/components/PDF2ImageComposer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-muted-foreground">加载PDF转图片工具...</p>
      </div>
    </div>
  ),
});

export default function PDF2ImagePage() {
  return <PDF2ImageComposer />;
}
