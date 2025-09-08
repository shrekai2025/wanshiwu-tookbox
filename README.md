# 万事屋 - Professional Toolkit

> 一个现代化的多功能文档处理和创作工具集，基于 Next.js 构建的本地 Web 应用程序。

## ✨ 功能特性

### 📂 PDF工具
- **图片转PDF** - 将多张图片合成为一个PDF文档，支持自定义布局和压缩
- **PDF转图片** - 将PDF页面转换为JPG图片或PPTX演示文稿，支持页面选择
- **文本转PDF** - 支持Markdown语法，将文本内容转换为格式化的PDF文档
- **PDF裁剪** - 精确裁剪PDF页面，支持压缩和页面提取

### 📚 书籍制作
- **图文绘本合成** - 创建精美的绘本作品，支持图文混排编辑

### 🎨 批量作图
- **NFT合成** - 生成独特的NFT艺术品，支持特征组合和批量创建

### 📅 计划任务表
- **计划表制作** - 创建和管理日程安排，支持任务分组和打印导出

## 🚀 技术栈

- **前端框架**: Next.js 14 (App Router)
- **编程语言**: TypeScript
- **样式系统**: Tailwind CSS
- **UI组件**: Radix UI + shadcn/ui
- **PDF处理**: jsPDF, pdf-lib, pdfjs-dist
- **图标系统**: Lucide React
- **拖拽功能**: @dnd-kit
- **文本处理**: Marked (Markdown解析)

## 📦 安装和运行

### 环境要求
- Node.js 18+
- npm 或 yarn

### 快速开始

1. **克隆项目**
```bash
git clone https://github.com/你的用户名/万事屋.git
cd 万事屋
```

2. **安装依赖**
```bash
npm install
# 或
yarn install
```

3. **启动开发服务器**
```bash
npm run dev
# 或
yarn dev
```

4. **打开浏览器**
访问 [http://localhost:3000](http://localhost:3000) 开始使用

## 🎯 使用指南

### PDF工具使用

#### 图片转PDF
1. 选择"PDF工具" → "图片转PDF"
2. 上传多张图片文件
3. 拖拽调整图片顺序
4. 配置压缩和布局选项
5. 生成并下载PDF文件

#### PDF转图片
1. 选择"PDF工具" → "PDF转图片"
2. 上传PDF文件
3. 选择要转换的页面
4. 选择输出格式（JPG/PPTX）
5. 下载转换结果

#### 文本转PDF
1. 选择"PDF工具" → "文本转PDF"
2. 在编辑器中输入Markdown文本
3. 插入图片（可选）
4. 配置PDF设置
5. 生成并下载PDF

#### PDF裁剪
1. 选择"PDF工具" → "PDF裁剪"
2. 上传PDF文件
3. 设置裁剪区域
4. 配置压缩选项
5. 下载裁剪后的PDF

### 其他工具

详细的使用说明请参考应用内的工具描述和帮助信息。

## 🏗️ 构建和部署

### 生产构建
```bash
npm run build
npm start
```

### 类型检查
```bash
npm run type-check
```

### 代码检查
```bash
npm run lint
```

## 🎨 UI设计特色

- **现代简约** - 采用西方现代工具webapp的设计理念
- **响应式布局** - 完美适配桌面、平板和手机设备
- **直观导航** - 分组折叠式导航，hover下拉交互
- **专业配色** - 蓝色主题，清晰的视觉层次
- **流畅动画** - 精心设计的过渡效果和交互反馈

## 🔧 开发说明

### 项目结构
```
src/
├── app/                 # Next.js App Router页面
├── components/          # React组件
│   ├── ui/             # 基础UI组件
│   └── [功能组件]/      # 各功能模块组件
├── lib/                # 工具库
├── types/              # TypeScript类型定义
└── utils/              # 工具函数
```

### 路由结构
- `/pdf` - 图片转PDF
- `/pdf2image` - PDF转图片
- `/text2pdf` - 文本转PDF
- `/pdfcrop` - PDF裁剪
- `/picturebook` - 绘本制作
- `/nft` - NFT合成
- `/schedule` - 计划表制作

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程
1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🎉 致谢

- [Next.js](https://nextjs.org/) - React框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS框架
- [Radix UI](https://www.radix-ui.com/) - 无样式UI组件
- [Lucide](https://lucide.dev/) - 图标库
- [jsPDF](https://github.com/parallax/jsPDF) - PDF生成库

---

<div align="center">
  <p>用 ❤️ 和 ⚡ 制作</p>
  <p><strong>万事屋 - 您的专业工具箱</strong></p>
</div>