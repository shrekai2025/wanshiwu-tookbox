'use client';

import React from 'react';
import { ExtractedPage } from '@/types/localExtractor';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FileListProps {
  pages: ExtractedPage[];
  currentPageIndex: number;
  onPageSelect: (index: number) => void;
}

export function FileList({ pages, currentPageIndex, onPageSelect }: FileListProps) {
  const getStatusColor = (status: ExtractedPage['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'parsing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: ExtractedPage['status']) => {
    switch (status) {
      case 'success':
        return '已解析';
      case 'error':
        return '错误';
      case 'parsing':
        return '解析中';
      default:
        return '待处理';
    }
  };

  if (pages.length === 0) {
    return (
      <div className="w-80 p-4 border-r border-gray-200">
        <div className="text-center text-gray-500 mt-8">
          <p>未发现HTML文件</p>
          <p className="text-sm mt-2">请选择包含网页文件的文件夹</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-r border-gray-200 bg-gray-50">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h3 className="font-semibold text-gray-900">文件列表</h3>
        <p className="text-sm text-gray-600 mt-1">
          共 {pages.length} 个HTML文件
        </p>
      </div>
      
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="p-2 space-y-2">
          {pages.map((page, index) => (
            <Card
              key={page.filePath}
              className={`p-3 cursor-pointer transition-all duration-200 hover:shadow-md ${
                index === currentPageIndex
                  ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200'
                  : 'hover:bg-white'
              }`}
              onClick={() => onPageSelect(index)}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium text-sm leading-tight text-gray-900 flex-1">
                    {page.title}
                  </h4>
                  <Badge
                    variant="outline"
                    className={`ml-2 text-xs ${getStatusColor(page.status)}`}
                  >
                    {getStatusText(page.status)}
                  </Badge>
                </div>
                
                <p className="text-xs text-gray-600 truncate" title={page.fileName}>
                  {page.fileName}
                </p>
                
                {page.status === 'success' && (
                  <div className="flex gap-2 text-xs text-gray-500">
                    <span>正文: {page.mainContent.length}块</span>
                    {page.comments.length > 0 && (
                      <span>评论: {page.comments.length}块</span>
                    )}
                  </div>
                )}
                
                {page.status === 'error' && page.error && (
                  <p className="text-xs text-red-600 truncate" title={page.error}>
                    {page.error}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
