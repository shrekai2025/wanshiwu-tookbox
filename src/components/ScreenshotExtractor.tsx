'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ScreenshotExtractorState, ExtractionResult, ApiConfig, ImageItem } from '@/types/screenshotExtractor';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  Clipboard, 
  Eye, 
  Copy, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Key,
  History,
  Settings
} from 'lucide-react';
import { callOpenAIVision, parseVisionResponse, compressImage, DEFAULT_SYSTEM_PROMPT } from '@/utils/screenshotExtractorUtils';
import { SystemPromptModal } from './SystemPromptModal';

const STORAGE_KEYS = {
  API_CONFIG: 'screenshot_extractor_api_config',
  HISTORY: 'screenshot_extractor_history',
  SYSTEM_PROMPT: 'screenshot_extractor_system_prompt'
};

const MAX_HISTORY_COUNT = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGES_COUNT = 5; // 最多5张图片

export function ScreenshotExtractor() {
  const [state, setState] = useState<ScreenshotExtractorState>({
    selectedMode: 'clipboard',
    currentImages: [],
    isProcessing: false,
    apiKey: '',
    apiProvider: 'openai-badger',
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    results: [],
    currentResult: null
  });

  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  } | null>(null);

  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // 初始化时从localStorage加载配置和历史
  useEffect(() => {
    // 加载API配置
    const savedConfig = localStorage.getItem(STORAGE_KEYS.API_CONFIG);
    if (savedConfig) {
      try {
        const config: ApiConfig = JSON.parse(savedConfig);
        setState(prev => ({
          ...prev,
          apiKey: config.apiKey,
          apiProvider: config.provider
        }));
      } catch (error) {
        console.error('加载API配置失败:', error);
      }
    }

    // 加载历史记录
    const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (savedHistory) {
      try {
        const history: ExtractionResult[] = JSON.parse(savedHistory);
        setState(prev => ({ ...prev, results: history }));
      } catch (error) {
        console.error('加载历史记录失败:', error);
      }
    }

    // 加载系统提示词
    const savedPrompt = localStorage.getItem(STORAGE_KEYS.SYSTEM_PROMPT);
    if (savedPrompt) {
      setState(prev => ({ ...prev, systemPrompt: savedPrompt }));
    }
  }, []);

  // 显示通知
  const showNotification = useCallback((type: 'success' | 'error' | 'info' | 'warning', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // 保存API配置
  const saveApiConfig = useCallback(() => {
    if (!state.apiKey.trim()) {
      showNotification('error', '请输入API Key');
      return;
    }

    const config: ApiConfig = {
      provider: state.apiProvider,
      apiKey: state.apiKey
    };

    localStorage.setItem(STORAGE_KEYS.API_CONFIG, JSON.stringify(config));
    showNotification('success', 'API配置已保存');
  }, [state.apiKey, state.apiProvider, showNotification]);

  // 清除API配置
  const clearApiConfig = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.API_CONFIG);
    setState(prev => ({ ...prev, apiKey: '' }));
    showNotification('info', 'API配置已清除');
  }, [showNotification]);

  // 保存历史记录
  const saveToHistory = useCallback((result: ExtractionResult) => {
    setState(prev => {
      const newResults = [result, ...prev.results].slice(0, MAX_HISTORY_COUNT);
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(newResults));
      return { ...prev, results: newResults };
    });
  }, []);

  // 保存系统提示词
  const saveSystemPrompt = useCallback((prompt: string) => {
    localStorage.setItem(STORAGE_KEYS.SYSTEM_PROMPT, prompt);
    setState(prev => ({ ...prev, systemPrompt: prompt }));
    showNotification('success', '系统提示词已保存');
  }, [showNotification]);

  // 验证图片文件
  const validateImageFile = useCallback((file: File): boolean => {
    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      showNotification('error', '图片文件大小不能超过10MB');
      return false;
    }

    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      showNotification('error', '只支持JPG、PNG、WebP、非动画GIF格式的图片');
      return false;
    }

    // 检查文件名，避免明显的验证码文件
    const fileName = file.name.toLowerCase();
    const captchaKeywords = ['captcha', 'verify', 'verification', '验证码', 'code'];
    if (captchaKeywords.some(keyword => fileName.includes(keyword))) {
      showNotification('error', '出于安全考虑，不支持验证码图片识别');
      return false;
    }

    return true;
  }, [showNotification]);

  // 添加图片
  const addImageFile = useCallback(async (file: File) => {
    if (!validateImageFile(file)) return;

    // 检查图片数量限制
    if (state.currentImages.length >= MAX_IMAGES_COUNT) {
      showNotification('error', `最多只能添加${MAX_IMAGES_COUNT}张图片`);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        let dataUrl = e.target?.result as string;
        
        // 如果图片过大，进行压缩
        if (file.size > 5 * 1024 * 1024) { // 5MB以上压缩
          showNotification('info', '图片较大，正在压缩以提高识别速度...');
          dataUrl = await compressImage(dataUrl, 1920, 0.85);
        }
        
        const imageItem: ImageItem = {
          id: Date.now().toString() + Math.random(),
          dataUrl,
          name: file.name,
          size: file.size,
          timestamp: Date.now()
        };
        
        setState(prev => ({ 
          ...prev, 
          currentImages: [...prev.currentImages, imageItem]
        }));
        
        showNotification('success', `图片"${file.name}"添加成功`);
      } catch (error) {
        showNotification('error', '图片处理失败');
      }
    };
    reader.onerror = () => {
      showNotification('error', '图片加载失败');
    };
    reader.readAsDataURL(file);
  }, [validateImageFile, showNotification, state.currentImages.length]);

  // 移除指定图片
  const removeImage = useCallback((imageId: string) => {
    setState(prev => ({
      ...prev,
      currentImages: prev.currentImages.filter(img => img.id !== imageId)
    }));
    showNotification('info', '图片已移除');
  }, [showNotification]);

  // 清空所有图片
  const clearAllImages = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      currentImages: [],
      currentResult: null 
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showNotification('info', '已清空所有图片');
  }, [showNotification]);

  // 处理剪贴板粘贴
  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (state.selectedMode !== 'clipboard') return;

    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          addImageFile(file);
        }
        break;
      }
    }
  }, [state.selectedMode, addImageFile]);

  // 注册剪贴板事件
  useEffect(() => {
    if (state.selectedMode === 'clipboard') {
      document.addEventListener('paste', handlePaste);
      return () => document.removeEventListener('paste', handlePaste);
    }
  }, [state.selectedMode, handlePaste]);

  // 处理文件选择
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // 支持多文件选择，但受数量限制
    const remainingSlots = MAX_IMAGES_COUNT - state.currentImages.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    
    if (files.length > remainingSlots) {
      showNotification('warning', `只能再添加${remainingSlots}张图片，已自动选择前${remainingSlots}张`);
    }

    filesToProcess.forEach(file => {
      addImageFile(file);
    });
  }, [addImageFile, state.currentImages.length, showNotification]);

  // 处理拖拽
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files) return;

    // 筛选图片文件并限制数量
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    const remainingSlots = MAX_IMAGES_COUNT - state.currentImages.length;
    const filesToProcess = imageFiles.slice(0, remainingSlots);
    
    if (imageFiles.length > remainingSlots) {
      showNotification('warning', `只能再添加${remainingSlots}张图片，已自动选择前${remainingSlots}张`);
    }

    filesToProcess.forEach(file => {
      addImageFile(file);
    });
  }, [addImageFile, state.currentImages.length, showNotification]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // 开始识别
  const handleExtract = useCallback(async () => {
    if (state.currentImages.length === 0) {
      showNotification('error', '请先添加图片');
      return;
    }

    if (!state.apiKey.trim()) {
      showNotification('error', '请先配置API Key');
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      const imageDataUrls = state.currentImages.map(img => img.dataUrl);
      const response = await callOpenAIVision(state.apiKey, imageDataUrls, state.apiProvider, state.systemPrompt);
      const result = parseVisionResponse(response);
      
      const extractionResult: ExtractionResult = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        ...result,
        imageDataUrls: imageDataUrls,
        imageCount: state.currentImages.length
      };

      setState(prev => ({ ...prev, currentResult: extractionResult }));
      saveToHistory(extractionResult);
      showNotification('success', `${state.currentImages.length}张图片识别完成`);
    } catch (error) {
      console.error('识别失败:', error);
      showNotification('error', error instanceof Error ? error.message : '识别失败，请重试');
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [state.currentImages, state.apiKey, state.apiProvider, state.systemPrompt, showNotification, saveToHistory]);

  // 复制文本到剪贴板
  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification('success', `${label}已复制到剪贴板`);
    } catch (error) {
      showNotification('error', '复制失败');
    }
  }, [showNotification]);


  return (
    <div className="h-screen flex flex-col bg-white">
      {/* 通知区域 */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50">
          <Alert className={`w-80 ${
            notification.type === 'success' ? 'border-green-200 bg-green-50' :
            notification.type === 'error' ? 'border-red-200 bg-red-50' :
            notification.type === 'warning' ? 'border-orange-200 bg-orange-50' :
            'border-blue-200 bg-blue-50'
          }`}>
            {notification.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
            {notification.type === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
            {notification.type === 'warning' && <AlertCircle className="h-4 w-4 text-orange-600" />}
            {notification.type === 'info' && <Info className="h-4 w-4 text-blue-600" />}
            <AlertDescription className={
              notification.type === 'success' ? 'text-green-800' :
              notification.type === 'error' ? 'text-red-800' :
              notification.type === 'warning' ? 'text-orange-800' :
              'text-blue-800'
            }>
              {notification.message}
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 标题 */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">截图文案提取</h1>
            <p className="text-gray-600 mt-1">使用OpenAI Vision AI识别图片中的文字并提供翻译</p>
            <div className="mt-2 text-xs text-gray-500">
              💡 提示：图片清晰度越高识别效果越好，支持多语言文字识别和翻译
            </div>
          </div>

          {/* API配置区域 */}
          <Card className="p-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-gray-500" />
                <Label className="text-sm font-medium">API配置</Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="provider" className="text-xs text-gray-600">供应商</Label>
                  <Select
                    value={state.apiProvider}
                    onValueChange={(value: 'openai' | 'openai-badger') => 
                      setState(prev => ({ ...prev, apiProvider: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai-badger">OpenAI-badger</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="apiKey" className="text-xs text-gray-600">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={state.apiKey}
                    onChange={(e) => setState(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="输入您的API Key"
                  />
                </div>
                
                <div className="flex items-end gap-2">
                  <Button onClick={saveApiConfig} size="sm">
                    保存Key
                  </Button>
                  <Button onClick={clearApiConfig} variant="outline" size="sm">
                    清除Key
                  </Button>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p>• 您的API Key仅在本地浏览器保存，绝对安全</p>
                <p>• 需要相应供应商的API Key才能使用图片识别功能</p>
                <p>• 如果没有API Key，可添加微信：artist3yehe</p>
                <p>• OpenAI-badger为默认推荐供应商</p>
              </div>

              {/* 系统提示词设置 */}
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-gray-500" />
                  <Label className="text-sm font-medium">系统提示词</Label>
                  {state.systemPrompt !== DEFAULT_SYSTEM_PROMPT && (
                    <Badge variant="outline" className="text-xs">
                      已自定义
                    </Badge>
                  )}
                </div>
                <Button
                  onClick={() => setIsPromptModalOpen(true)}
                  variant="outline"
                  size="sm"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  修改提示词
                </Button>
              </div>
              
              <p className="text-xs text-gray-500">
                系统提示词决定了AI如何理解和处理您的图片，您可以根据需要进行自定义
              </p>
            </div>
          </Card>

          {/* 图片输入区域 */}
          <Card className="p-4">
            <div className="space-y-4">
              <Label className="text-sm font-medium">图片输入方式</Label>
              
              {/* Radio选项 */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="inputMode"
                    value="clipboard"
                    checked={state.selectedMode === 'clipboard'}
                    onChange={(e) => setState(prev => ({ 
                      ...prev, 
                      selectedMode: e.target.value as 'clipboard' | 'file' 
                    }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <Clipboard className="w-4 h-4" />
                  <span className="text-sm">从剪贴板粘贴</span>
                  {state.selectedMode === 'clipboard' && (
                    <Badge variant="secondary" className="text-xs">默认</Badge>
                  )}
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="inputMode"
                    value="file"
                    checked={state.selectedMode === 'file'}
                    onChange={(e) => setState(prev => ({ 
                      ...prev, 
                      selectedMode: e.target.value as 'clipboard' | 'file' 
                    }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">选择本地文件</span>
                </label>
              </div>

              {/* 图片管理区域 */}
              {state.currentImages.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      已添加图片 ({state.currentImages.length}/{MAX_IMAGES_COUNT})
                    </Label>
                    <Button
                      onClick={clearAllImages}
                      variant="outline"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      清空所有
                    </Button>
                  </div>
                  
                  {/* 图片网格展示 */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {state.currentImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-300 transition-colors">
                          <img
                            src={image.dataUrl}
                            alt={image.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* 移除按钮 */}
                        <button
                          onClick={() => removeImage(image.id)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        
                        {/* 图片信息 */}
                        <div className="mt-1 text-xs text-gray-500 text-center truncate">
                          {image.name}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 识别按钮 */}
                  <div className="flex justify-center">
                    <Button
                      onClick={handleExtract}
                      disabled={state.isProcessing || !state.apiKey.trim()}
                      className="px-8"
                      size="lg"
                    >
                      {state.isProcessing ? '识别中...' : `识别 ${state.currentImages.length} 张图片`}
                    </Button>
                  </div>
                </div>
              )}

              {/* 添加图片区域 */}
              <div
                ref={dropZoneRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  state.currentImages.length >= MAX_IMAGES_COUNT
                    ? 'border-gray-200 bg-gray-100 opacity-50'
                    : state.selectedMode === 'clipboard' 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="space-y-3">
                  {state.currentImages.length >= MAX_IMAGES_COUNT ? (
                    <>
                      <Upload className="w-12 h-12 mx-auto text-gray-300" />
                      <div>
                        <p className="text-gray-500">已达到最大图片数量限制</p>
                        <p className="text-sm text-gray-400">最多支持{MAX_IMAGES_COUNT}张图片同时识别</p>
                      </div>
                    </>
                  ) : state.selectedMode === 'clipboard' ? (
                    <>
                      <Clipboard className="w-12 h-12 mx-auto text-blue-400" />
                      <div>
                        <p className="text-gray-600">按 Ctrl+V 粘贴图片</p>
                        <p className="text-sm text-gray-500">或拖拽图片到此区域</p>
                        <p className="text-xs text-gray-500 mt-1">
                          可添加 {MAX_IMAGES_COUNT - state.currentImages.length} 张图片
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mx-auto text-gray-400" />
                      <div>
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          variant="outline"
                          disabled={state.currentImages.length >= MAX_IMAGES_COUNT}
                        >
                          选择图片文件
                        </Button>
                        <p className="text-sm text-gray-500 mt-2">
                          支持JPG、PNG、WebP、非动画GIF格式，每张最大10MB
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          • 最多可添加{MAX_IMAGES_COUNT}张图片，当前可添加 {MAX_IMAGES_COUNT - state.currentImages.length} 张
                          <br />• 图片需清晰可读，避免水印或Logo
                          <br />• 文字较小时建议放大图片以提高识别率
                          <br />• 不支持验证码(CAPTCHA)识别
                        </p>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* 识别结果展示 */}
          {state.currentResult && (
            <Card className="p-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gray-500" />
                  <Label className="text-sm font-medium">识别结果</Label>
                </div>

                <div className="grid gap-4">
                  {/* 原始文案 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs text-gray-600">原始文案</Label>
                      <Button
                        onClick={() => copyToClipboard(state.currentResult!.originalText, '原始文案')}
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <Textarea
                      value={state.currentResult.originalText}
                      readOnly
                      className="min-h-[100px] bg-gray-50"
                    />
                  </div>

                  {/* 译文 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-xs text-gray-600">译文</Label>
                      <Button
                        onClick={() => copyToClipboard(state.currentResult!.translation, '译文')}
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <Textarea
                      value={state.currentResult.translation}
                      readOnly
                      className="min-h-[100px] bg-gray-50"
                    />
                  </div>

                  {/* 图片描述 */}
                  {state.currentResult.imageDescription && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs text-gray-600">图片描述</Label>
                        <Button
                          onClick={() => copyToClipboard(state.currentResult!.imageDescription, '图片描述')}
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <Textarea
                        value={state.currentResult.imageDescription}
                        readOnly
                        className="min-h-[60px] bg-gray-50"
                      />
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* 历史记录 */}
          {state.results.length > 0 && (
            <Card className="p-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-gray-500" />
                  <Label className="text-sm font-medium">识别历史</Label>
                  <Badge variant="secondary" className="text-xs">
                    最近{state.results.length}条
                  </Badge>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {state.results.map((result, index) => (
                    <div
                      key={result.id}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setState(prev => ({ ...prev, currentResult: result }))}
                    >
                        <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm text-gray-900 truncate">
                              {result.originalText.substring(0, 40)}
                              {result.originalText.length > 40 ? '...' : ''}
                            </p>
                            <Badge variant="secondary" className="text-xs">
                              {result.imageCount || 1}张
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">
                            {new Date(result.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          {(result.imageDataUrls || [(result as any).imageDataUrl]).filter(url => url).slice(0, 3).map((url, index) => (
                            <img
                              key={index}
                              src={url}
                              alt=""
                              className="w-8 h-8 rounded object-cover"
                            />
                          ))}
                          {(result.imageDataUrls?.length || ((result as any).imageDataUrl ? 1 : 0)) > 3 && (
                            <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                              +{(result.imageDataUrls?.length || ((result as any).imageDataUrl ? 1 : 0)) - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* 系统提示词修改弹窗 */}
      <SystemPromptModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        currentPrompt={state.systemPrompt}
        onSave={saveSystemPrompt}
        defaultPrompt={DEFAULT_SYSTEM_PROMPT}
      />
    </div>
  );
}
