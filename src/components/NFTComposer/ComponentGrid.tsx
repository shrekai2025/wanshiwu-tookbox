"use client";

import { useState, useRef } from "react";
import { NFTTrait, NFTComponent } from "@/types/nft";
import { Trash2, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ComponentGridProps {
  selectedTrait: NFTTrait | null;
  onUpdateTrait: (trait: NFTTrait) => void;
}

// 单个组件卡片
function ComponentCard({ component, onDelete }: {
  component: NFTComponent;
  onDelete: (componentId: string) => void;
}) {
  return (
    <Card className="relative group overflow-hidden hover:shadow-md transition-shadow">
      {/* 图片预览 */}
      <div className="aspect-square bg-muted flex items-center justify-center">
        <img
          src={component.imageUrl}
          alt={component.name}
          className="max-w-full max-h-full object-contain"
        />
      </div>
      
      {/* 组件名称 */}
      <CardContent className="p-3">
        <p className="text-sm font-medium truncate">
          {component.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {Math.round(component.file.size / 1024)} KB
        </p>
      </CardContent>
      
      {/* 删除按钮 */}
      <Button
        onClick={() => onDelete(component.id)}
        variant="destructive"
        size="sm"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </Card>
  );
}

// 空状态组件
function EmptyState({ onImport }: { onImport: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center h-64 p-8">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <ImagePlus className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">暂无组件</h3>
        <p className="text-sm text-center text-muted-foreground mb-4">
          点击导入按钮添加PNG图片组件
        </p>
        <Button onClick={onImport} className="flex items-center gap-2">
          <ImagePlus className="h-4 w-4" />
          导入组件
        </Button>
      </CardContent>
    </Card>
  );
}

// 未选中特征的状态
function NoSelectionState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center h-64 p-8">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 text-2xl">
          👈
        </div>
        <h3 className="text-lg font-medium mb-2">请选择特征</h3>
        <p className="text-sm text-center text-muted-foreground">
          从左侧列表选择一个特征来管理其组件
        </p>
      </CardContent>
    </Card>
  );
}

export function ComponentGrid({ selectedTrait, onUpdateTrait }: ComponentGridProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件导入
  const handleImport = () => {
    fileInputRef.current?.click();
  };

  // 处理文件选择
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !selectedTrait) return;

    const newComponents: NFTComponent[] = [];
    
    Array.from(files).forEach(file => {
      // 只处理PNG文件
      if (file.type === 'image/png') {
        const component: NFTComponent = {
          id: `component_${Date.now()}_${Math.random()}`,
          name: file.name.replace('.png', ''),
          file,
          imageUrl: URL.createObjectURL(file)
        };
        newComponents.push(component);
      }
    });

    if (newComponents.length > 0) {
      const updatedTrait: NFTTrait = {
        ...selectedTrait,
        components: [...selectedTrait.components, ...newComponents]
      };
      onUpdateTrait(updatedTrait);
    }

    // 重置文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 删除单个组件
  const handleDeleteComponent = (componentId: string) => {
    if (!selectedTrait) return;

    // 清理blob URL
    const componentToDelete = selectedTrait.components.find(c => c.id === componentId);
    if (componentToDelete) {
      URL.revokeObjectURL(componentToDelete.imageUrl);
    }

    const updatedTrait: NFTTrait = {
      ...selectedTrait,
      components: selectedTrait.components.filter(c => c.id !== componentId)
    };
    onUpdateTrait(updatedTrait);
  };

  // 清除所有组件
  const handleClearAll = () => {
    if (!selectedTrait) return;

    // 清理所有blob URLs
    selectedTrait.components.forEach(component => {
      URL.revokeObjectURL(component.imageUrl);
    });

    const updatedTrait: NFTTrait = {
      ...selectedTrait,
      components: []
    };
    onUpdateTrait(updatedTrait);
  };

  if (!selectedTrait) {
    return (
      <div className="flex-1 p-8">
        <NoSelectionState />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* 头部控制栏 */}
      <Card className="rounded-none border-0 border-b">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                {selectedTrait.name} 组件
              </CardTitle>
              <CardDescription>
                已导入 {selectedTrait.components.length} 个组件
              </CardDescription>
            </div>
            
            <div className="flex space-x-2">
              {selectedTrait.components.length > 0 && (
                <Button
                  onClick={handleClearAll}
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/20 hover:bg-destructive/10"
                >
                  清除全部
                </Button>
              )}
              <Button
                onClick={handleImport}
                size="sm"
                className="flex items-center gap-2"
              >
                <ImagePlus className="h-4 w-4" />
                导入组件
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 组件网格 */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedTrait.components.length === 0 ? (
          <EmptyState onImport={handleImport} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {selectedTrait.components.map(component => (
              <ComponentCard
                key={component.id}
                component={component}
                onDelete={handleDeleteComponent}
              />
            ))}
          </div>
        )}
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
