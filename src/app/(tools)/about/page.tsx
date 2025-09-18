"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Database, 
  Wifi, 
  Key, 
  MessageCircle,
  Github,
  Heart,
  Zap,
  Lock,
  Download,
  CheckCircle2,
  FileImage,
  BookOpen,
  Palette,
  Scissors,
  FileText,
  ArrowLeftRight,
  Calendar,
  StickyNote,
  Globe,
  Camera,
  Twitter,
  ExternalLink
} from "lucide-react";

export default function AboutPage() {
  const features = [
    {
      category: "PDF工具",
      icon: FileImage,
      items: [
        { name: "图片转PDF", desc: "将多张图片合成为PDF文档" },
        { name: "PDF转图片", desc: "PDF转JPG图片或PPTX演示文稿，支持页面选择" },
        { name: "文本转PDF", desc: "Markdown转换为PDF" },
        { name: "PDF裁剪", desc: "精确裁剪PDF页面" }
      ]
    },
    {
      category: "合成器",
      icon: Palette,
      items: [
        { name: "图文绘本合成", desc: "创建精美的绘本作品" },
        { name: "NFT合成", desc: "生成独特的NFT艺术品" }
      ]
    },
    {
      category: "任务看板",
      icon: Calendar,
      items: [
        { name: "满分课程表", desc: "创建和管理日程安排，支持任务分组和打印导出" },
        { name: "任务便签", desc: "创建和管理可拖拽的任务便签，支持多种内容类型" }
      ]
    },
    {
      category: "内容提取",
      icon: Download,
      items: [
        { name: "本地提取", desc: "从本地网页文件中提取正文和评论内容" },
        { name: "截图文案提取", desc: "使用AI识别图片中的文字并提供翻译" }
      ]
    }
  ];

  const highlights = [
    {
      icon: Lock,
      title: "数据安全",
      desc: "所有数据均在浏览器本地保存，不会上传到任何服务器"
    },
    {
      icon: Database,
      title: "本地存储",
      desc: "使用浏览器本地存储技术，数据完全属于您"
    },
    {
      icon: Wifi,
      title: "离线可用",
      desc: "支持离线使用，无需网络连接即可处理本地文件"
    },
    {
      icon: Shield,
      title: "隐私保护",
      desc: "无后端接口，您的隐私得到最大程度保护"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 头部介绍 */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-bold text-gray-900">万事屋</h1>
            <p className="text-lg text-gray-600">Professional Toolkit</p>
          </div>
        </div>
        
        <p className="text-xl text-gray-700 leading-relaxed">
          一个功能丰富的在线工具集合，专为提高工作效率而设计
        </p>
        
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          <Badge variant="secondary" className="text-sm">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            完全免费
          </Badge>
          <Badge variant="secondary" className="text-sm">
            <Lock className="w-3 h-3 mr-1" />
            数据安全
          </Badge>
          <Badge variant="secondary" className="text-sm">
            <Wifi className="w-3 h-3 mr-1" />
            离线可用
          </Badge>
        </div>
      </div>

      {/* 核心特性 */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {highlights.map((highlight, index) => {
            const Icon = highlight.icon;
            return (
              <div key={index} className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{highlight.title}</h3>
                  <p className="text-gray-600 text-sm">{highlight.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>


      {/* 联系方式 */}
      <Card className="p-6 bg-purple-50 border-purple-200">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-purple-800">
          <MessageCircle className="w-6 h-6" />
          联系瑞克克
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-purple-800">微信</p>
              <p className="text-purple-700">
                <code className="bg-purple-100 px-2 py-1 rounded text-sm font-mono">artist3yehe</code>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Twitter className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-purple-800">推特</p>
              <a 
                href="https://x.com/aiRickMomo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-700 hover:text-purple-900 transition-colors duration-200 flex items-center gap-1"
              >
                <span>@aiRickMomo</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
        <div className="flex items-start gap-3">
            <MessageCircle className="w-5 h-5 mt-0.5 text-blue-600" />
            <div>
            <p>部分功能（如AI识别、图像生成等）需要使用第三方API服务。</p>
              <p className="mt-1">请联系<code className="bg-blue-100 px-2 py-1 rounded text-sm font-mono">瑞克克</code></p>
            </div>
          </div>
      </Card>

      {/* 使用建议 */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-600" />
          使用建议
        </h2>
        <div className="space-y-3 text-gray-700">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
            <p>建议使用现代浏览器（Chrome、Firefox、Safari、Edge）以获得最佳体验</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
            <p>首次使用时，浏览器可能会要求权限，请允许以确保功能正常</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
            <p>定期备份重要数据，虽然数据本地存储很安全，但清除浏览器数据会导致丢失</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
            <p>如遇到问题或有建议，欢迎通过微信联系我们</p>
          </div>
        </div>
      </Card>

      {/* 版权信息 */}
      <div className="text-center text-gray-500 text-sm pt-6 border-t border-gray-200">
        <p className="flex items-center justify-center gap-2">
          Made with <Heart className="w-4 h-4 text-red-500" /> by 万事屋团队
        </p>
        <p className="mt-2">© 2025 万事屋. 本项目开源免费使用.</p>
      </div>
    </div>
  );
}
