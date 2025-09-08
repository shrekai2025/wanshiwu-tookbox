"use client";

import { useState, useRef } from "react";
import {
  DocumentContent,
  Text2PDFSettings,
  InsertedImage,
  ImageSize,
  ImageAlignment,
  DEFAULT_TEXT2PDF_SETTINGS
} from "@/types/text2pdf";
import { generateText2PDF, fileToBase64, validateImageUrl } from "@/utils/text2pdfUtils";
import { 
  generateImageSyntax, 
  parseMarkdownWithImages, 
  getMarkdownStats,
  isImageUsed 
} from "@/utils/markdownUtils";
import {
  FileText,
  Download,
  ImagePlus,
  Eye,
  EyeOff,
  Settings,
  Trash2,
  Upload,
  Loader2,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PDFSettings } from "./Text2PDF/PDFSettings";

export function Text2PDFComposer() {
  // 文档内容状态
  const [content, setContent] = useState<DocumentContent>({
    markdown: "",
    images: []
  });
  
  // PDF设置状态
  const [settings, setSettings] = useState<Text2PDFSettings>(DEFAULT_TEXT2PDF_SETTINGS);
  
  // UI状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  
  // 图片相关状态
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [imageSize, setImageSize] = useState<ImageSize>("medium");
  const [imageAlignment, setImageAlignment] = useState<ImageAlignment>("center");
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [isLocalImage, setIsLocalImage] = useState(true);
  
  // 引用
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // 计算markdown统计信息
  const stats = getMarkdownStats(content.markdown);
  
  // 处理markdown文本变化
  const handleMarkdownChange = (value: string) => {
    setContent(prev => ({
      ...prev,
      markdown: value
    }));
  };
  
  // 处理本地图片选择
  const handleLocalImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      alert("请选择图片文件");
      return;
    }
    
    try {
      const base64 = await fileToBase64(file);
      const imageId = `img_${Date.now()}`;
      
      const newImage: InsertedImage = {
        id: imageId,
        url: base64,
        alt: imageAlt || file.name,
        size: imageSize,
        alignment: imageAlignment,
        isLocal: true,
        file: file
      };
      
      setContent(prev => ({
        ...prev,
        images: [...prev.images, newImage]
      }));
      
      // 插入到文本中
      insertImageSyntax(imageId);
      
      // 重置表单
      resetImageForm();
    } catch (error) {
      console.error("图片处理失败:", error);
      alert("图片处理失败，请重试");
    }
  };
  
  // 处理在线图片URL
  const handleUrlImageAdd = async () => {
    if (!imageUrl.trim()) {
      alert("请输入图片URL");
      return;
    }
    
    try {
      const isValid = await validateImageUrl(imageUrl);
      if (!isValid) {
        alert("图片URL无效或无法访问");
        return;
      }
      
      const imageId = `img_${Date.now()}`;
      
      const newImage: InsertedImage = {
        id: imageId,
        url: imageUrl,
        alt: imageAlt || "网络图片",
        size: imageSize,
        alignment: imageAlignment,
        isLocal: false
      };
      
      setContent(prev => ({
        ...prev,
        images: [...prev.images, newImage]
      }));
      
      // 插入到文本中
      insertImageSyntax(imageId);
      
      // 重置表单
      resetImageForm();
    } catch (error) {
      console.error("图片处理失败:", error);
      alert("图片处理失败，请重试");
    }
  };
  
  // 插入图片语法到文本
  const insertImageSyntax = (imageId: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const syntax = generateImageSyntax(imageId);
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const newText = content.markdown.slice(0, start) + 
                   "\n" + syntax + "\n" + 
                   content.markdown.slice(end);
    
    handleMarkdownChange(newText);
    
    // 恢复焦点并设置光标位置
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + syntax.length + 2;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };
  
  // 重置图片表单
  const resetImageForm = () => {
    setImageUrl("");
    setImageAlt("");
    setImageSize("medium");
    setImageAlignment("center");
    setShowImageDialog(false);
    setIsLocalImage(true);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  // 删除图片
  const removeImage = (imageId: string) => {
    setContent(prev => ({
      ...prev,
      images: prev.images.filter(img => img.id !== imageId)
    }));
    
    // 从markdown中移除图片引用
    const imageSyntax = generateImageSyntax(imageId);
    const newMarkdown = content.markdown.replace(new RegExp(imageSyntax, 'g'), '');
    handleMarkdownChange(newMarkdown);
  };
  
  // 生成PDF
  const handleGeneratePDF = async () => {
    if (!content.markdown.trim()) {
      alert("请输入文本内容");
      return;
    }
    
    setIsGenerating(true);
    try {
      await generateText2PDF(content, settings);
    } catch (error) {
      console.error("PDF生成失败:", error);
      alert(`PDF生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // 清空所有内容
  const clearAll = () => {
    if (content.markdown.trim() || content.images.length > 0) {
      if (confirm("确定要清空所有内容吗？")) {
        setContent({ markdown: "", images: [] });
      }
    }
  };
  
  // 导入文本文件
  const importTextFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md,.markdown';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          handleMarkdownChange(text);
        } catch (error) {
          alert("文件读取失败");
        }
      }
    };
    input.click();
  };

  return (
    <div>
      {/* 控制面板 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                文本转PDF工具
              </CardTitle>
              <CardDescription>
                使用Markdown语法创建专业的PDF文档，支持图片插入和智能分页
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                {stats.words} 词
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <ImagePlus className="h-3 w-3" />
                {content.images.length} 图片
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 主要操作按钮 */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={importTextFile}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              导入文件
            </Button>
            
            <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <ImagePlus className="h-4 w-4" />
                  插入图片
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <ImagePlus className="h-5 w-5" />
                    插入图片
                  </DialogTitle>
                  <DialogDescription>
                    选择本地文件或输入网络图片地址
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* 图片来源选择 */}
                  <Tabs value={isLocalImage ? "local" : "url"} onValueChange={(value) => setIsLocalImage(value === "local")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="local">本地文件</TabsTrigger>
                      <TabsTrigger value="url">网络地址</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="local" className="space-y-4">
                      <div className="space-y-2">
                        <Label>选择图片文件</Label>
                        <Input 
                          ref={fileInputRef}
                          type="file" 
                          accept="image/*" 
                          onChange={handleLocalImageSelect}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="url" className="space-y-4">
                      <div className="space-y-2">
                        <Label>图片URL</Label>
                        <Input 
                          type="url" 
                          value={imageUrl} 
                          onChange={(e) => setImageUrl(e.target.value)} 
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  {/* 图片设置 */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>替代文本</Label>
                      <Input 
                        type="text" 
                        value={imageAlt} 
                        onChange={(e) => setImageAlt(e.target.value)} 
                        placeholder="图片描述"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>尺寸</Label>
                        <Select value={imageSize} onValueChange={(value: ImageSize) => setImageSize(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">小 (200px)</SelectItem>
                            <SelectItem value="medium">中 (400px)</SelectItem>
                            <SelectItem value="large">大 (600px)</SelectItem>
                            <SelectItem value="full">全宽</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>对齐方式</Label>
                        <Select value={imageAlignment} onValueChange={(value: ImageAlignment) => setImageAlignment(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">左对齐</SelectItem>
                            <SelectItem value="center">居中</SelectItem>
                            <SelectItem value="right">右对齐</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  {/* 对话框操作按钮 */}
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button onClick={resetImageForm} variant="outline">
                      取消
                    </Button>
                    <Button 
                      onClick={isLocalImage ? () => fileInputRef.current?.click() : handleUrlImageAdd}
                    >
                      {isLocalImage ? "选择文件" : "添加图片"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button
              onClick={() => setShowPreview(!showPreview)}
              variant={showPreview ? "default" : "outline"}
              className="flex items-center gap-2"
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPreview ? "隐藏预览" : "显示预览"}
            </Button>
            
            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant={showSettings ? "default" : "outline"}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              PDF设置
            </Button>
            
            <Button
              onClick={handleGeneratePDF}
              disabled={!content.markdown.trim() || isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {isGenerating ? "智能分页生成中..." : "生成PDF"}
            </Button>
            
            {(content.markdown.trim() || content.images.length > 0) && (
              <Button
                onClick={clearAll}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                清空
              </Button>
            )}
          </div>
          
          <Separator />
          
          {/* 统计信息 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.characters}</div>
              <div className="text-xs text-muted-foreground">字符</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.words}</div>
              <div className="text-xs text-muted-foreground">单词</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.lines}</div>
              <div className="text-xs text-muted-foreground">行数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.paragraphs}</div>
              <div className="text-xs text-muted-foreground">段落</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{content.images.length}</div>
              <div className="text-xs text-muted-foreground">图片</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PDF设置面板 */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              PDF设置
            </CardTitle>
            <CardDescription>
              自定义PDF文档的格式和样式
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PDFSettings 
              settings={settings} 
              onSettingsChange={setSettings} 
            />
          </CardContent>
        </Card>
      )}

      {/* 主要内容区域 */}
      <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* 文本编辑器 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Markdown编辑器
            </CardTitle>
            <CardDescription>
              使用Markdown语法编写内容，支持标题、列表、链接等格式
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              ref={textareaRef}
              value={content.markdown}
              onChange={(e) => handleMarkdownChange(e.target.value)}
              placeholder="在这里输入Markdown文本...

# 示例标题
这是一个段落。支持 **粗体** 和 *斜体* 文本。

## 列表示例
- 列表项 1
- 列表项 2

> 这是引用文本

使用插入图片按钮添加图片到文档中。"
              className="w-full h-96 p-4 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-mono bg-background"
            />
          </CardContent>
        </Card>
        
        {/* 预览区域 */}
        {showPreview && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                预览
              </CardTitle>
              <CardDescription>
                查看Markdown内容的渲染效果
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="prose prose-slate max-w-none h-96 overflow-y-auto border rounded-md p-4 custom-scrollbar bg-muted/50 dark:prose-invert"
                dangerouslySetInnerHTML={{
                  __html: parseMarkdownWithImages(content.markdown, content.images)
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* 图片管理 */}
      {content.images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImagePlus className="h-5 w-5" />
              已插入的图片 ({content.images.length})
            </CardTitle>
            <CardDescription>
              管理文档中插入的图片，可以删除未使用的图片
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {content.images.map((image) => (
                <Card key={image.id}>
                  <CardContent className="p-4">
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="w-full h-32 object-cover rounded-md mb-3 border"
                    />
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium truncate">
                        {image.alt}
                      </h4>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {image.size}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {image.alignment}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant={isImageUsed(content.markdown, image.id) ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {isImageUsed(content.markdown, image.id) ? "已使用" : "未使用"}
                        </Badge>
                        
                        <Button
                          onClick={() => removeImage(image.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
