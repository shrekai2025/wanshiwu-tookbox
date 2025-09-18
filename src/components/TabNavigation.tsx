"use client";

import { useState, useEffect } from "react";
import { 
  FileImage, 
  BookOpen, 
  Palette, 
  Scissors, 
  FileText,
  Settings,
  ArrowLeftRight,
  Calendar,
  ChevronDown,
  FileType,
  Brush,
  CalendarDays,
  Zap,
  StickyNote,
  Download,
  Globe,
  Camera,
  Info,
  Twitter
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";

export type TabType = "pdf" | "picturebook" | "nft" | "pdfcrop" | "text2pdf" | "pdf2image" | "schedule" | "tasknotes" | "localextractor" | "screenshot-extractor" | "about";

interface TabNavigationProps {
  // 这些props现在是可选的，因为我们从URL中获取状态
  activeTab?: TabType;
  onTabChange?: (tab: TabType) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  // 从URL路径中获取当前激活的tab
  const getCurrentTab = (): TabType => {
    if (activeTab) return activeTab; // 向后兼容旧的props方式
    
    const path = pathname.split('/').pop();
    const validTabs: TabType[] = ["pdf", "picturebook", "nft", "pdfcrop", "text2pdf", "pdf2image", "schedule", "tasknotes", "localextractor", "screenshot-extractor", "about"];
    return validTabs.includes(path as TabType) ? (path as TabType) : "pdf";
  };

  const currentTab = getCurrentTab();

  // 处理点击外部区域关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const tabGroups = [
    {
      groupName: "PDF工具",
      groupIcon: FileType,
      tabs: [
        { 
          id: "pdf" as const, 
          label: "图片转PDF", 
          icon: FileImage,
          description: "将图片合成为PDF文档",
          path: "/pdf"
        },
        { 
          id: "pdf2image" as const, 
          label: "PDF转图片", 
          icon: ArrowLeftRight,
          description: "PDF转JPG图片或PPTX演示文稿，支持页面选择",
          path: "/pdf2image"
        },
        { 
          id: "text2pdf" as const, 
          label: "文本转PDF", 
          icon: FileText,
          description: "Markdown转换为PDF",
          path: "/text2pdf"
        },
        { 
          id: "pdfcrop" as const, 
          label: "PDF裁剪", 
          icon: Scissors,
          description: "精确裁剪PDF页面",
          path: "/pdfcrop"
        },
      ]
    },
    {
      groupName: "合成器",
      groupIcon: Brush,
      tabs: [
        { 
          id: "picturebook" as const, 
          label: "图文绘本合成", 
          icon: BookOpen,
          description: "创建精美的绘本作品",
          path: "/picturebook"
        },
        { 
          id: "nft" as const, 
          label: "NFT合成", 
          icon: Palette,
          description: "生成独特的NFT艺术品",
          path: "/nft"
        },
      ]
    },
    {
      groupName: "任务看板",
      groupIcon: CalendarDays,
      tabs: [
        { 
          id: "schedule" as const, 
          label: "满分课程表", 
          icon: Calendar,
          description: "创建和管理日程安排，支持任务分组和打印导出",
          path: "/schedule"
        },
        { 
          id: "tasknotes" as const, 
          label: "任务便签", 
          icon: StickyNote,
          description: "创建和管理可拖拽的任务便签，支持多种内容类型",
          path: "/tasknotes"
        },
      ]
    },
    {
      groupName: "内容提取",
      groupIcon: Download,
      tabs: [
        { 
          id: "localextractor" as const, 
          label: "本地提取", 
          icon: Globe,
          description: "从本地网页文件中提取正文和评论内容",
          path: "/localextractor"
        },
        { 
          id: "screenshot-extractor" as const, 
          label: "截图文案提取", 
          icon: Camera,
          description: "使用AI识别图片中的文字并提供翻译",
          path: "/screenshot-extractor"
        },
      ]
    }
  ];

  // 扁平化所有tabs用于查找
  // @ts-ignore
  const allTabs = tabGroups.flatMap(group => group.tabs);

  const handleTabChange = (tabId: TabType) => {
    setOpenDropdown(null); // 选择后关闭下拉菜单
    if (onTabChange) {
      // 向后兼容旧的props方式
      onTabChange(tabId);
    } else {
      // 新的路由方式
      if (tabId === "about") {
        router.push("/about");
      } else {
        // @ts-ignore
        const tab = allTabs.find(t => t.id === tabId);
        if (tab) {
          // @ts-ignore
          router.push(tab.path);
        }
      }
    }
  };

  const toggleDropdown = (groupName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 防止事件冒泡
    setOpenDropdown(openDropdown === groupName ? null : groupName);
  };

  // 获取当前活跃tab所属的分组
  const getCurrentGroup = () => {
    return tabGroups.find(group => 
      group.tabs.some(tab => tab.id === currentTab)
    ) || tabGroups[0];
  };

  const currentGroup = getCurrentGroup();

  return (
    <header className="sticky top-0 z-[100] bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto">
        {/* 主导航栏 */}
        <div className="flex items-center justify-between h-16 px-6">
          {/* 品牌标识 */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">万事屋</h1>
              <p className="text-xs text-gray-500 leading-none">Professional Toolkit</p>
            </div>
          </div>
          
          {/* 导航菜单 */}
          <nav className="flex items-center gap-2">
            {tabGroups.map((group) => {
              const GroupIcon = group.groupIcon;
              const hasActiveTab = group.tabs.some(tab => tab.id === currentTab);
              const isDropdownOpen = openDropdown === group.groupName;
              
              return (
                <div key={group.groupName} className="relative group">
                  {/* 分组按钮 */}
                  <button
                    onClick={(e) => toggleDropdown(group.groupName, e)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      hasActiveTab
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <GroupIcon className="w-4 h-4" />
                    <span className="hidden md:inline-block">{group.groupName}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${
                      isDropdownOpen ? 'rotate-180' : 'group-hover:rotate-180'
                    }`} />
                  </button>
                  
                  {/* 下拉菜单 */}
                  <div className={`absolute top-full right-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-lg transition-all duration-200 z-[110] ${
                    isDropdownOpen 
                      ? 'opacity-100 visible translate-y-0' 
                      : 'opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0'
                  }`}>
                    <div className="p-2">
                      {group.tabs.map((tab) => {
                        const TabIcon = tab.icon;
                        const isActive = currentTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-150 text-left ${
                              isActive
                                ? 'bg-blue-50 text-blue-700 font-medium'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <TabIcon className="w-4 h-4 flex-shrink-0" />
                            <span>{tab.label}</span>
                            {isActive && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full ml-auto" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* About 独立按钮 */}
            <button
              onClick={() => handleTabChange("about")}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                currentTab === "about"
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Info className="w-4 h-4" />
              <span className="hidden md:inline-block">关于</span>
            </button>
            
            {/* 推特链接 */}
            <a
              href="https://x.com/aiRickMomo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              title="关注我们的推特"
            >
              <Twitter className="w-4 h-4" />
            </a>
          </nav>
        </div>
        
      </div>
    </header>
  );
}
