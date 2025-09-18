'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, RotateCcw, Save } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SystemPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrompt: string;
  onSave: (prompt: string) => void;
  defaultPrompt: string;
}

export function SystemPromptModal({ 
  isOpen, 
  onClose, 
  currentPrompt, 
  onSave, 
  defaultPrompt 
}: SystemPromptModalProps) {
  const [prompt, setPrompt] = useState(currentPrompt);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setPrompt(currentPrompt);
    setHasChanges(false);
  }, [currentPrompt, isOpen]);

  useEffect(() => {
    setHasChanges(prompt !== currentPrompt);
  }, [prompt, currentPrompt]);

  const handleSave = () => {
    onSave(prompt);
    onClose();
  };

  const handleReset = () => {
    setPrompt(defaultPrompt);
  };

  const handleClose = () => {
    if (hasChanges) {
      if (confirm('您有未保存的更改，确定要关闭吗？')) {
        setPrompt(currentPrompt); // 重置为原始值
        onClose();
      }
    } else {
      onClose();
    }
  };

  const isUsingDefault = prompt === defaultPrompt;
  const characterCount = prompt.length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            系统提示词设置
            {isUsingDefault && (
              <Badge variant="secondary" className="text-xs">
                使用默认
              </Badge>
            )}
            {hasChanges && (
              <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                未保存
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4 min-h-0">
          {/* 说明信息 */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              系统提示词决定了AI如何理解和处理您的图片。您可以根据需要修改提示词来获得更符合预期的识别结果。
            </AlertDescription>
          </Alert>

          {/* 提示词编辑区域 */}
          <div className="space-y-2 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <Label htmlFor="prompt">提示词内容</Label>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{characterCount} 字符</span>
                <Button
                  onClick={handleReset}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  disabled={isUsingDefault}
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  重置为默认
                </Button>
              </div>
            </div>
            
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[400px] font-mono text-sm resize-none"
              placeholder="输入您的系统提示词..."
            />
          </div>

          {/* 使用提示 */}
          <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-3 rounded-lg">
            <p className="font-medium text-gray-700">💡 提示词编写建议：</p>
            <p>• 明确指定需要提取的内容类型（原始文案、译文、图片描述）</p>
            <p>• 指定输出格式（建议使用JSON格式便于解析）</p>
            <p>• 针对特定场景添加特殊处理说明（如旋转文字、多语言等）</p>
            <p>• 避免过于复杂的指令，保持简洁明确</p>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button
              onClick={handleClose}
              variant="outline"
            >
              取消
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              disabled={isUsingDefault}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              重置
            </Button>
          </div>
          
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="min-w-[80px]"
          >
            <Save className="w-4 h-4 mr-1" />
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
