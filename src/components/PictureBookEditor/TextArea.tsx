"use client";

import { Edit3 } from "lucide-react";
import { FONT_CSS_MAPPING } from "@/types/pictureBook";

interface TextAreaProps {
  text: {
    content: string;
    fontSize: number;
    fontFamily: string;
    padding: number;
  };
  onUpdateContent: (content: string) => void;
}

export function TextArea({ text, onUpdateContent }: TextAreaProps) {
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateContent(e.target.value);
  };

  return (
    <div className="h-full bg-white flex flex-col">
      {/* 文字显示/编辑区域 */}
      <div className="flex-1 relative">
        {text.content ? (
          /* 有内容时显示文字 */
          <div
            className="h-full flex items-center justify-center text-center overflow-hidden"
            style={{
              padding: `${text.padding}px`,
              fontSize: `${text.fontSize}px`,
              fontFamily: FONT_CSS_MAPPING[text.fontFamily] || text.fontFamily,
              color: '#000000',
              lineHeight: 1.5,
              fontWeight: 500,
            }}
          >
            <div style={{ color: '#000000' }}>
              {text.content}
            </div>
          </div>
        ) : (
          /* 空状态 */
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
            <Edit3 className="w-16 h-16" />
            <div className="text-center space-y-2">
              <div className="font-medium">添加文字</div>
              <div className="text-sm">点击下方区域开始输入</div>
            </div>
          </div>
        )}
      </div>

      {/* 底部编辑区域 */}
      <div className="border-t border-gray-200 p-3">
        <textarea
          value={text.content}
          onChange={handleTextChange}
          placeholder="在这里输入文字内容..."
          className="w-full h-20 p-2 text-sm text-gray-900 border border-gray-300 rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          style={{
            fontFamily: FONT_CSS_MAPPING[text.fontFamily] || text.fontFamily,
          }}
        />
        
        {/* 字数统计 */}
        <div className="mt-2 text-xs text-gray-500 text-right">
          {text.content.length} 字符
        </div>
      </div>
    </div>
  );
}
