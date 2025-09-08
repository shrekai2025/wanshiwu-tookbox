"use client";

import { useState } from "react";
import { PictureBookPage } from "@/types/pictureBook";
import { Trash2 } from "lucide-react";

interface PagePreviewProps {
  pages: PictureBookPage[];
  selectedPageId: string | null;
  onSelectPage: (pageId: string) => void;
  onDeletePage: (pageId: string) => void;
  onMovePage: (dragIndex: number, hoverIndex: number) => void;
}

export function PagePreview({
  pages,
  selectedPageId,
  onSelectPage,
  onDeletePage,
  onMovePage,
}: PagePreviewProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      onMovePage(draggedIndex, index);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const renderPageThumbnail = (page: PictureBookPage, index: number) => {
    const isSelected = page.id === selectedPageId;
    const isDragging = draggedIndex === index;
    const isDragOver = dragOverIndex === index;

    return (
      <div
        key={page.id}
        draggable
        onDragStart={(e) => handleDragStart(e, index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, index)}
        onDragEnd={handleDragEnd}
        onClick={() => onSelectPage(page.id)}
        className={`
          relative group cursor-pointer p-3 rounded-lg transition-all
          ${isSelected 
            ? "bg-blue-50 border-2 border-blue-500" 
            : "bg-gray-50 border-2 border-transparent hover:border-gray-300"
          }
          ${isDragging ? "opacity-50 scale-95" : ""}
          ${isDragOver && !isDragging ? "border-blue-400 bg-blue-25 scale-105" : ""}
        `}
      >
        {/* 页面缩略图 */}
        <div className="aspect-[297/210] bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
          <div className="h-full flex">
            {/* 左侧图片区域 */}
            <div className="w-1/2 bg-gray-100 flex items-center justify-center">
              {page.image?.src ? (
                <img
                  src={page.image.src}
                  alt=""
                  className={`max-w-full max-h-full ${
                    page.image.mode === "cover" ? "object-cover w-full h-full" : "object-contain"
                  }`}
                />
              ) : (
                <div className="text-gray-400 text-xs text-center">
                  <div className="text-lg mb-1">🖼️</div>
                  <div>图片区域</div>
                </div>
              )}
            </div>
            
            {/* 右侧文字区域 */}
            <div className="w-1/2 bg-white flex items-center justify-center p-2">
              {page.text.content ? (
                <div 
                  className="text-xs text-center overflow-hidden"
                  style={{ 
                    fontFamily: page.text.fontFamily,
                    fontSize: Math.max(8, page.text.fontSize * 0.3), // 缩放字体大小
                    color: '#000000',
                    fontWeight: 500,
                  }}
                >
                  {page.text.content.length > 50 
                    ? `${page.text.content.substring(0, 50)}...` 
                    : page.text.content
                  }
                </div>
              ) : (
                <div className="text-gray-400 text-xs text-center">
                  <div className="text-lg mb-1">📝</div>
                  <div>文字区域</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 页面编号 */}
        <div className="mt-2 text-xs text-center text-gray-600">
          第 {index + 1} 页
        </div>

        {/* 删除按钮 */}
        {pages.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeletePage(page.id);
            }}
            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}

        {/* 选中指示器 */}
        {isSelected && (
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full"></div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 space-y-4">
      {pages.map((page, index) => renderPageThumbnail(page, index))}
    </div>
  );
}
