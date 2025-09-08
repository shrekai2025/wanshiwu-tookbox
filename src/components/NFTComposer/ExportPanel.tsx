"use client";

import { useState } from "react";
import { NFTComposition, ExportSettings, NFTTrait } from "@/types/nft";
import { batchGenerateAndDownload } from "@/utils/nftUtils";

interface ExportPanelProps {
  compositions: NFTComposition[];
  traits: NFTTrait[];
  exportSettings: ExportSettings;
  onUpdateExportSettings: (settings: ExportSettings) => void;
}

// 预设尺寸选项
const sizePresets = [
  { name: "512x512 (标准)", width: 512, height: 512 },
  { name: "1024x1024 (高清)", width: 1024, height: 1024 },
  { name: "2048x2048 (超高清)", width: 2048, height: 2048 },
  { name: "自定义", width: 0, height: 0 },
];

export function ExportPanel({
  compositions,
  traits,
  exportSettings,
  onUpdateExportSettings
}: ExportPanelProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  const [selectedPreset, setSelectedPreset] = useState(() => {
    const preset = sizePresets.find(p => 
      p.width === exportSettings.width && p.height === exportSettings.height
    );
    return preset?.name || "自定义";
  });

  // 更新尺寸预设
  const handlePresetChange = (presetName: string) => {
    setSelectedPreset(presetName);
    const preset = sizePresets.find(p => p.name === presetName);
    if (preset && preset.width > 0) {
      onUpdateExportSettings({
        ...exportSettings,
        width: preset.width,
        height: preset.height
      });
    }
  };

  // 开始批量导出
  const handleExport = async () => {
    if (compositions.length === 0) return;

    setIsExporting(true);
    setExportProgress({ current: 0, total: compositions.length });

    try {
      await batchGenerateAndDownload(
        compositions,
        traits,
        exportSettings.width,
        exportSettings.height,
        exportSettings.quality,
        (current, total) => {
          setExportProgress({ current, total });
        }
      );

      alert(`成功导出 ${compositions.length} 个NFT！`);
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请检查控制台错误信息');
    } finally {
      setIsExporting(false);
      setExportProgress({ current: 0, total: 0 });
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* 导出设置 */}
      <div className="p-6 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">批量导出</h2>
          
          {compositions.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                请先在"合成预览"步骤中生成组合，然后回到此处进行导出设置
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 mb-2">导出信息</h3>
                <p className="text-blue-700">
                  将导出 <strong>{compositions.length}</strong> 个NFT图片，
                  格式为 <strong>PNG</strong>
                </p>
              </div>

              {/* 尺寸设置 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">图片尺寸</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {sizePresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handlePresetChange(preset.name)}
                      className={`
                        p-3 text-left border rounded-lg transition-colors
                        ${selectedPreset === preset.name
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      <div className="font-medium">{preset.name}</div>
                      {preset.width > 0 && (
                        <div className="text-sm text-gray-500">
                          {preset.width} × {preset.height}
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {selectedPreset === "自定义" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-1">
                        宽度 (px)
                      </label>
                      <input
                        id="width"
                        type="number"
                        min="64"
                        max="4096"
                        value={exportSettings.width}
                        onChange={(e) => onUpdateExportSettings({
                          ...exportSettings,
                          width: Math.max(64, parseInt(e.target.value) || 512)
                        })}
                        className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">
                        高度 (px)
                      </label>
                      <input
                        id="height"
                        type="number"
                        min="64"
                        max="4096"
                        value={exportSettings.height}
                        onChange={(e) => onUpdateExportSettings({
                          ...exportSettings,
                          height: Math.max(64, parseInt(e.target.value) || 512)
                        })}
                        className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 质量设置 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">图片质量</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">压缩质量</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round(exportSettings.quality * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={exportSettings.quality}
                    onChange={(e) => onUpdateExportSettings({
                      ...exportSettings,
                      quality: parseFloat(e.target.value)
                    })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>最小文件</span>
                    <span>最高质量</span>
                  </div>
                </div>
              </div>

              {/* 导出按钮 */}
              <div className="flex justify-center pt-6 border-t border-gray-200">
                <button
                  onClick={handleExport}
                  disabled={isExporting || compositions.length === 0}
                  className="px-8 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isExporting ? '导出中...' : `开始导出 ${compositions.length} 个NFT`}
                </button>
              </div>

              {/* 导出进度 */}
              {isExporting && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">导出进度</span>
                    <span className="text-sm text-blue-700">
                      {exportProgress.current} / {exportProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${exportProgress.total > 0 
                          ? (exportProgress.current / exportProgress.total) * 100 
                          : 0}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 导出提示 */}
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">使用说明</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 所有NFT将以PNG格式下载到您的默认下载文件夹</li>
              <li>• 文件命名格式：nft_1.png, nft_2.png, ...</li>
              <li>• 导出过程中请不要关闭浏览器标签页</li>
              <li>• 大批量导出可能需要较长时间，请耐心等待</li>
              <li>• 高分辨率设置将产生更大的文件</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
