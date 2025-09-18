'use client';

import React, { useState, useCallback } from 'react';
import { ExtractedPage, LocalExtractorState } from '@/types/localExtractor';
import { FileList } from './FileList';
import { ContentPreview } from './ContentPreview';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { scanDirectoryForHTMLFiles, readFileContent, parseHTMLContent } from '@/utils/htmlParser';
import { copyBlocksToClipboard } from '@/utils/markdownConverter';
import { FolderOpen, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function LocalExtractor() {
  const [state, setState] = useState<LocalExtractorState>({
    selectedFolder: null,
    pages: [],
    currentPageIndex: 0,
    isProcessing: false,
    totalFiles: 0,
    processedFiles: 0
  });

  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // 显示通知
  const showNotification = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // 选择文件夹
  const handleSelectFolder = useCallback(async () => {
    try {
      // 检查浏览器是否支持File System Access API
      if (!('showDirectoryPicker' in window)) {
        showNotification('error', '您的浏览器不支持文件夹选择功能，请使用Chrome 86+或Edge 86+');
        return;
      }

      const directoryHandle = await (window as any).showDirectoryPicker();
      setState(prev => ({ ...prev, selectedFolder: directoryHandle, isProcessing: true }));

      // 扫描文件夹
      const htmlFiles = await scanDirectoryForHTMLFiles(directoryHandle, 500);
      
      if (htmlFiles.length === 0) {
        showNotification('info', '在选择的文件夹中未找到HTML文件');
        setState(prev => ({ ...prev, isProcessing: false }));
        return;
      }

      showNotification('info', `发现 ${htmlFiles.length} 个HTML文件，开始解析...`);

      // 初始化页面状态
      const initialPages: ExtractedPage[] = htmlFiles.map(fileHandle => ({
        fileName: fileHandle.name,
        filePath: fileHandle.name, // 在File System Access API中，我们只能获取文件名
        title: fileHandle.name,
        mainContent: [],
        comments: [],
        status: 'pending'
      }));

      setState(prev => ({
        ...prev,
        pages: initialPages,
        totalFiles: htmlFiles.length,
        processedFiles: 0,
        currentPageIndex: 0
      }));

      // 逐个解析文件
      for (let i = 0; i < htmlFiles.length; i++) {
        const fileHandle = htmlFiles[i];
        
        try {
          // 更新当前文件状态为解析中
          setState(prev => ({
            ...prev,
            pages: prev.pages.map((page, index) => 
              index === i ? { ...page, status: 'parsing' } : page
            )
          }));

          const file = await fileHandle.getFile();
          const content = await readFileContent(file);
          const parsedContent = parseHTMLContent(content);

          // 更新解析成功的页面
          setState(prev => ({
            ...prev,
            pages: prev.pages.map((page, index) => 
              index === i ? {
                ...page,
                ...parsedContent,
                status: 'success'
              } : page
            ),
            processedFiles: i + 1
          }));

        } catch (error) {
          console.error(`解析文件 ${fileHandle.name} 失败:`, error);
          
          // 更新解析失败的页面
          setState(prev => ({
            ...prev,
            pages: prev.pages.map((page, index) => 
              index === i ? {
                ...page,
                status: 'error',
                error: error instanceof Error ? error.message : '解析失败'
              } : page
            ),
            processedFiles: i + 1
          }));
        }
      }

      setState(prev => ({ ...prev, isProcessing: false }));
      showNotification('success', `解析完成！成功处理了 ${htmlFiles.length} 个文件`);

    } catch (error) {
      console.error('选择文件夹失败:', error);
      showNotification('error', '选择文件夹失败，请重试');
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [showNotification]);

  // 选择页面
  const handlePageSelect = useCallback((index: number) => {
    setState(prev => ({ ...prev, currentPageIndex: index }));
  }, []);

  // 切换内容块选择状态
  const handleBlockToggle = useCallback((blockId: string, section: 'main' | 'comments') => {
    setState(prev => ({
      ...prev,
      pages: prev.pages.map((page, index) => {
        if (index !== prev.currentPageIndex) return page;

        const targetContent = section === 'main' ? page.mainContent : page.comments;
        const updatedContent = targetContent.map(block =>
          block.id === blockId ? { ...block, selected: !block.selected } : block
        );

        return {
          ...page,
          [section === 'main' ? 'mainContent' : 'comments']: updatedContent
        };
      })
    }));
  }, []);

  // 全选/反选
  const handleSelectAll = useCallback((section: 'main' | 'comments') => {
    setState(prev => ({
      ...prev,
      pages: prev.pages.map((page, index) => {
        if (index !== prev.currentPageIndex) return page;

        const targetContent = section === 'main' ? page.mainContent : page.comments;
        const updatedContent = targetContent.map(block => ({ ...block, selected: true }));

        return {
          ...page,
          [section === 'main' ? 'mainContent' : 'comments']: updatedContent
        };
      })
    }));
  }, []);

  const handleUnselectAll = useCallback((section: 'main' | 'comments') => {
    setState(prev => ({
      ...prev,
      pages: prev.pages.map((page, index) => {
        if (index !== prev.currentPageIndex) return page;

        const targetContent = section === 'main' ? page.mainContent : page.comments;
        const updatedContent = targetContent.map(block => ({ ...block, selected: false }));

        return {
          ...page,
          [section === 'main' ? 'mainContent' : 'comments']: updatedContent
        };
      })
    }));
  }, []);

  // 复制选中内容
  const handleCopySelected = useCallback(async () => {
    const currentPage = state.pages[state.currentPageIndex];
    if (!currentPage) return;

    const selectedBlocks = [
      ...currentPage.mainContent.filter(block => block.selected),
      ...currentPage.comments.filter(block => block.selected)
    ];

    if (selectedBlocks.length === 0) {
      showNotification('error', '请先选择要复制的内容');
      return;
    }

    try {
      await copyBlocksToClipboard(selectedBlocks);
      showNotification('success', `已复制 ${selectedBlocks.length} 个内容块到剪贴板`);
    } catch (error) {
      console.error('复制失败:', error);
      showNotification('error', '复制到剪贴板失败，请重试');
    }
  }, [state.pages, state.currentPageIndex, showNotification]);

  // 展开/收起内容块
  const handleBlockExpand = useCallback((blockId: string, section: 'main' | 'comments') => {
    setState(prev => ({
      ...prev,
      pages: prev.pages.map((page, index) => {
        if (index !== prev.currentPageIndex) return page;

        const targetContent = section === 'main' ? page.mainContent : page.comments;
        const updatedContent = targetContent.map(block =>
          block.id === blockId ? { ...block, expanded: !block.expanded } : block
        );

        return {
          ...page,
          [section === 'main' ? 'mainContent' : 'comments']: updatedContent
        };
      })
    }));
  }, []);

  const currentPage = state.pages[state.currentPageIndex];

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* 通知区域 */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50">
          <Alert className={`w-80 ${
            notification.type === 'success' ? 'border-green-200 bg-green-50' :
            notification.type === 'error' ? 'border-red-200 bg-red-50' :
            'border-blue-200 bg-blue-50'
          }`}>
            {notification.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
            {notification.type === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
            {notification.type === 'info' && <Info className="h-4 w-4 text-blue-600" />}
            <AlertDescription className={
              notification.type === 'success' ? 'text-green-800' :
              notification.type === 'error' ? 'text-red-800' :
              'text-blue-800'
            }>
              {notification.message}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* 主要内容区域 */}
      {state.pages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="p-8 max-w-md w-full text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <FolderOpen className="w-8 h-8 text-blue-600" />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  本地网页内容提取
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  选择包含HTML文件的文件夹，系统将自动解析网页内容，
                  提取主要正文和评论，支持批量选择和复制到剪贴板。
                </p>
              </div>

              <Button
                onClick={handleSelectFolder}
                disabled={state.isProcessing}
                className="w-full"
                size="lg"
              >
                {state.isProcessing ? '解析中...' : '选择文件夹'}
              </Button>

              <div className="text-xs text-gray-500 space-y-1">
                <p>• 支持Chrome 86+、Edge 86+等现代浏览器</p>
                <p>• 最多处理500个HTML文件</p>
                <p>• 智能识别正文内容和用户评论</p>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <div className="flex-1 flex">
          <FileList
            pages={state.pages}
            currentPageIndex={state.currentPageIndex}
            onPageSelect={handlePageSelect}
          />
          
          {currentPage && (
            <ContentPreview
              title={currentPage.title}
              mainContent={currentPage.mainContent}
              comments={currentPage.comments}
              onBlockToggle={handleBlockToggle}
              onSelectAll={handleSelectAll}
              onUnselectAll={handleUnselectAll}
              onCopySelected={handleCopySelected}
              onBlockExpand={handleBlockExpand}
            />
          )}
        </div>
      )}

      {/* 处理进度指示 */}
      {state.isProcessing && state.totalFiles > 0 && (
        <div className="border-t border-gray-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-800">
              正在解析文件... ({state.processedFiles}/{state.totalFiles})
            </span>
            <div className="w-32 bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(state.processedFiles / state.totalFiles) * 100}%`
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
