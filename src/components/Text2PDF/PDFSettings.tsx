"use client";

import { 
  Text2PDFSettings, 
  PAPER_SIZES, 
  FONT_FAMILIES,
  PaperSize,
  FontFamily 
} from "@/types/text2pdf";

interface PDFSettingsProps {
  settings: Text2PDFSettings;
  onSettingsChange: (settings: Text2PDFSettings) => void;
}

export function PDFSettings({ settings, onSettingsChange }: PDFSettingsProps) {
  const updateSettings = (updates: Partial<Text2PDFSettings>) => {
    onSettingsChange({ ...settings, ...updates });
  };

  const updateMargins = (margin: keyof Text2PDFSettings['margins'], value: number) => {
    updateSettings({
      margins: {
        ...settings.margins,
        [margin]: value
      }
    });
  };

  const updateFont = (updates: Partial<Text2PDFSettings['font']>) => {
    updateSettings({
      font: {
        ...settings.font,
        ...updates
      }
    });
  };

  const updateHeadings = (updates: Partial<Text2PDFSettings['headings']>) => {
    updateSettings({
      headings: {
        ...settings.headings,
        ...updates
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 纸张设置 */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">纸张规格</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(PAPER_SIZES).map(([key, paper]) => (
            <label
              key={key}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                settings.paperSize === key
                  ? "border-blue-500 bg-blue-50 text-blue-900"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input
                type="radio"
                name="paperSize"
                value={key}
                checked={settings.paperSize === key}
                onChange={(e) => updateSettings({ paperSize: e.target.value as PaperSize })}
                className="sr-only"
              />
              <div>
                <div className="font-medium">{paper.displayName}</div>
                <div className="text-xs text-gray-500">{paper.width}×{paper.height}mm</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* 页边距设置 */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">页边距 (mm)</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              上边距
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={settings.margins.top}
              onChange={(e) => updateMargins('top', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              右边距
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={settings.margins.right}
              onChange={(e) => updateMargins('right', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              下边距
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={settings.margins.bottom}
              onChange={(e) => updateMargins('bottom', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              左边距
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={settings.margins.left}
              onChange={(e) => updateMargins('left', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {/* 快速设置按钮 */}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => updateSettings({ 
              margins: { top: 20, right: 20, bottom: 20, left: 20 } 
            })}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            标准 (20mm)
          </button>
          <button
            onClick={() => updateSettings({ 
              margins: { top: 15, right: 15, bottom: 15, left: 15 } 
            })}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            紧密 (15mm)
          </button>
          <button
            onClick={() => updateSettings({ 
              margins: { top: 25, right: 25, bottom: 25, left: 25 } 
            })}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            宽松 (25mm)
          </button>
        </div>
      </div>

      {/* 字体设置 */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">字体设置</h3>
        
        {/* 字体族选择 */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-2">
            字体族
          </label>
          <select
            value={settings.font.family}
            onChange={(e) => updateFont({ family: e.target.value as FontFamily })}
            className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {Object.entries(FONT_FAMILIES).map(([key, font]) => (
              <option key={key} value={key}>
                {font.displayName}
              </option>
            ))}
          </select>
        </div>
        
        {/* 正文字体设置 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              正文字号 (pt)
            </label>
            <input
              type="number"
              min="8"
              max="24"
              value={settings.font.size}
              onChange={(e) => updateFont({ size: parseFloat(e.target.value) || 12 })}
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              行高倍数
            </label>
            <input
              type="number"
              min="1"
              max="3"
              step="0.1"
              value={settings.font.lineHeight}
              onChange={(e) => updateFont({ lineHeight: parseFloat(e.target.value) || 1.6 })}
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* 标题字体设置 */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">标题字号 (pt)</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              一级标题 (H1)
            </label>
            <input
              type="number"
              min="16"
              max="36"
              value={settings.headings.h1Size}
              onChange={(e) => updateHeadings({ h1Size: parseFloat(e.target.value) || 24 })}
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              二级标题 (H2)
            </label>
            <input
              type="number"
              min="14"
              max="32"
              value={settings.headings.h2Size}
              onChange={(e) => updateHeadings({ h2Size: parseFloat(e.target.value) || 20 })}
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              三级标题 (H3)
            </label>
            <input
              type="number"
              min="12"
              max="28"
              value={settings.headings.h3Size}
              onChange={(e) => updateHeadings({ h3Size: parseFloat(e.target.value) || 16 })}
              className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* 预设模板 */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">快速预设</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => onSettingsChange({
              paperSize: "a4",
              margins: { top: 20, right: 20, bottom: 20, left: 20 },
              font: { family: "inter", size: 12, lineHeight: 1.6 },
              headings: { h1Size: 24, h2Size: 20, h3Size: 16 }
            })}
            className="p-3 text-left border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
          >
            <div className="font-medium text-sm">标准模板</div>
            <div className="text-xs text-gray-500">A4, 20mm边距, Inter字体</div>
          </button>
          
          <button
            onClick={() => onSettingsChange({
              paperSize: "a4",
              margins: { top: 15, right: 15, bottom: 15, left: 15 },
              font: { family: "source-han-sans", size: 11, lineHeight: 1.5 },
              headings: { h1Size: 22, h2Size: 18, h3Size: 14 }
            })}
            className="p-3 text-left border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
          >
            <div className="font-medium text-sm">紧密排版</div>
            <div className="text-xs text-gray-500">A4, 15mm边距, 思源黑体</div>
          </button>
          
          <button
            onClick={() => onSettingsChange({
              paperSize: "b5",
              margins: { top: 18, right: 18, bottom: 18, left: 18 },
              font: { family: "noto-sans", size: 10, lineHeight: 1.7 },
              headings: { h1Size: 20, h2Size: 16, h3Size: 13 }
            })}
            className="p-3 text-left border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
          >
            <div className="font-medium text-sm">小册子</div>
            <div className="text-xs text-gray-500">B5, 18mm边距, Noto Sans</div>
          </button>
        </div>
      </div>
    </div>
  );
}
