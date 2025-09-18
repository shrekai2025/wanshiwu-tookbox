'use client';

import React from 'react';
import { ContentBlock } from '@/types/localExtractor';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatBlockPreview } from '@/utils/markdownConverter';
import { Copy, Check, Square } from 'lucide-react';

interface ContentPreviewProps {
  title: string;
  mainContent: ContentBlock[];
  comments: ContentBlock[];
  onBlockToggle: (blockId: string, section: 'main' | 'comments') => void;
  onSelectAll: (section: 'main' | 'comments') => void;
  onUnselectAll: (section: 'main' | 'comments') => void;
  onCopySelected: () => void;
  onBlockExpand: (blockId: string, section: 'main' | 'comments') => void;
}

export function ContentPreview({
  title,
  mainContent,
  comments,
  onBlockToggle,
  onSelectAll,
  onUnselectAll,
  onCopySelected,
  onBlockExpand
}: ContentPreviewProps) {
  const selectedMainCount = mainContent.filter(block => block.selected).length;
  const selectedCommentsCount = comments.filter(block => block.selected).length;
  const totalSelected = selectedMainCount + selectedCommentsCount;

  const getTypeIcon = (type: ContentBlock['type']) => {
    switch (type) {
      case 'heading':
        return '📝';
      case 'paragraph':
        return '📄';
      case 'list':
        return '📋';
      case 'quote':
        return '💬';
      case 'image':
        return '🖼️';
      default:
        return '📝';
    }
  };

  const getTypeLabel = (type: ContentBlock['type']) => {
    switch (type) {
      case 'heading':
        return '标题';
      case 'paragraph':
        return '段落';
      case 'list':
        return '列表';
      case 'quote':
        return '引用';
      case 'image':
        return '图片';
      default:
        return '文本';
    }
  };

  const renderContentSection = (
    blocks: ContentBlock[],
    sectionTitle: string,
    section: 'main' | 'comments'
  ) => {
    if (blocks.length === 0) return null;

    const selectedCount = blocks.filter(block => block.selected).length;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">{sectionTitle}</h3>
            <Badge variant="outline" className="text-xs">
              {blocks.length} 块
            </Badge>
            {selectedCount > 0 && (
              <Badge className="text-xs bg-blue-100 text-blue-800">
                已选择 {selectedCount}
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectAll(section)}
              className="text-xs"
            >
              <Check className="w-3 h-3 mr-1" />
              全选
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUnselectAll(section)}
              className="text-xs"
            >
              <Square className="w-3 h-3 mr-1" />
              反选
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {blocks.map((block) => (
            <Card
              key={block.id}
              className={`p-4 transition-all duration-200 ${
                block.selected
                  ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200'
                  : 'hover:shadow-md hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={block.selected}
                  onCheckedChange={() => onBlockToggle(block.id, section)}
                  className="mt-1 flex-shrink-0"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{getTypeIcon(block.type)}</span>
                    <Badge variant="secondary" className="text-xs">
                      {getTypeLabel(block.type)}
                    </Badge>
                    {block.level && (
                      <Badge variant="outline" className="text-xs">
                        H{block.level}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-900 leading-relaxed">
                    {block.type === 'image' ? (
                      <div className="flex items-center gap-2 text-gray-600">
                        <span>🖼️</span>
                        <span>{formatBlockPreview(block)}</span>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap break-words">
                        {block.expanded 
                          ? block.content 
                          : formatBlockPreview(block, 300)
                        }
                      </p>
                    )}
                  </div>
                  
                  {block.content.length > 300 && (
                    <div className="mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-blue-600 p-0 h-auto"
                        onClick={() => onBlockExpand(block.id, section)}
                      >
                        {block.expanded 
                          ? '收起内容' 
                          : `查看完整内容 (${block.content.length} 字符)`
                        }
                      </Button>
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // 复制单个块的内容
                    navigator.clipboard.writeText(block.content);
                  }}
                  className="flex-shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  if (mainContent.length === 0 && comments.length === 0) {
    return (
      <div className="flex-1 p-8">
        <div className="text-center text-gray-500 mt-20">
          <p className="text-lg">未找到可提取的内容</p>
          <p className="text-sm mt-2">请选择其他HTML文件或检查文件格式</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* 顶部操作栏 */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600 mt-1">
              共 {mainContent.length + comments.length} 个内容块
              {totalSelected > 0 && (
                <span className="text-blue-600 ml-2">
                  • 已选择 {totalSelected} 块
                </span>
              )}
            </p>
          </div>
          
          <Button
            onClick={onCopySelected}
            disabled={totalSelected === 0}
            className="flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            复制选中内容 ({totalSelected})
          </Button>
        </div>
      </div>

      {/* 内容区域 */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-8">
          {renderContentSection(mainContent, '主要内容', 'main')}
          {renderContentSection(comments, '评论内容', 'comments')}
        </div>
      </ScrollArea>
    </div>
  );
}
