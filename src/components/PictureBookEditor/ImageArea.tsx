"use client";

import { useEffect, useRef } from "react";
import { ImagePlus, Clipboard } from "lucide-react";

interface ImageAreaProps {
  image?: {
    src: string;
    mode: "cover" | "contain";
  };
  onPaste: (e: ClipboardEvent) => void;
  onImageSelect: () => void;
  onImageUpdate: (image: { src: string; file: File; mode: "cover" | "contain" }) => void;
}

export function ImageArea({ image, onPaste, onImageSelect, onImageUpdate }: ImageAreaProps) {
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      // 只有当焦点在图片区域时才处理粘贴
      if (areaRef.current?.contains(document.activeElement)) {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (const item of items) {
          if (item.type.startsWith("image/")) {
            e.preventDefault();
            const file = item.getAsFile();
            if (file) {
              const imageUrl = URL.createObjectURL(file);
              onImageUpdate({
                src: imageUrl,
                file,
                mode: image?.mode || "contain",
              });
            }
          }
        }
      }
    };

    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [onImageUpdate, image?.mode]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith("image/"));
    
    if (imageFile) {
      const imageUrl = URL.createObjectURL(imageFile);
      onImageUpdate({
        src: imageUrl,
        file: imageFile,
        mode: image?.mode || "contain",
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      ref={areaRef}
      className="h-full relative bg-gray-50 border-r border-gray-200 cursor-pointer group"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      tabIndex={0}
      onClick={() => areaRef.current?.focus()}
    >
      {image ? (
        <>
          {/* 图片显示 */}
          <img
            src={image.src}
            alt="页面图片"
            className={`w-full h-full ${
              image.mode === "cover" 
                ? "object-cover" 
                : "object-contain"
            }`}
          />
          
          {/* 遮罩层 - 悬停时显示操作按钮 */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onImageSelect();
                }}
                className="bg-white rounded-lg px-4 py-2 shadow-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <ImagePlus className="w-4 h-4" />
                  选择文件
                </div>
              </button>
            </div>
          </div>
        </>
      ) : (
        /* 空状态 */
        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
          <ImagePlus className="w-16 h-16" />
          <div className="text-center space-y-2">
            <div className="font-medium">添加图片</div>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-1 justify-center">
                <Clipboard className="w-4 h-4" />
                点击此区域后按 Ctrl+V 粘贴图片
              </div>
            </div>
          </div>
          
          {/* 选择文件按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onImageSelect();
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ImagePlus className="w-4 h-4" />
              选择文件
            </div>
          </button>
        </div>
      )}
      
      {/* 焦点指示器 */}
      <div className="absolute inset-0 border-2 border-transparent focus-within:border-blue-500 transition-colors pointer-events-none" />
    </div>
  );
}

