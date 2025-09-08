"use client";

import { useState, useEffect, useMemo } from "react";
import { NFTTrait, NFTComposition } from "@/types/nft";
import { 
  calculateTotalCombinations, 
  generateUniqueCompositions, 
  compositeToCanvas 
} from "@/utils/nftUtils";

interface CompositionPreviewProps {
  traits: NFTTrait[];
  count: number;
  onUpdateCount: (count: number) => void;
  onGenerateCompositions: (compositions: NFTComposition[]) => void;
}

// 单个合成预览卡片
function CompositionCard({ 
  composition, 
  traits, 
  index 
}: { 
  composition: NFTComposition; 
  traits: NFTTrait[];
  index: number;
}) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const generatePreview = async () => {
      setIsLoading(true);
      try {
        const canvas = await compositeToCanvas(composition, traits, 200, 200);
        if (isMounted) {
          const url = canvas.toDataURL('image/png');
          setPreviewUrl(url);
        }
      } catch (error) {
        console.error('生成预览失败:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    generatePreview();

    return () => {
      isMounted = false;
    };
  }, [composition, traits]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="aspect-square bg-gray-100 flex items-center justify-center">
        {isLoading ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        ) : previewUrl ? (
          <img
            src={previewUrl}
            alt={`NFT #${index + 1}`}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="text-gray-400">预览失败</div>
        )}
      </div>
      <div className="p-2">
        <h3 className="text-sm font-medium text-gray-900">
          NFT #{index + 1}
        </h3>
        <p className="text-xs text-gray-500">
          {Object.keys(composition.traits).length} 个特征
        </p>
      </div>
    </div>
  );
}

export function CompositionPreview({
  traits,
  count,
  onUpdateCount,
  onGenerateCompositions
}: CompositionPreviewProps) {
  const [compositions, setCompositions] = useState<NFTComposition[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');

  // 计算可用的组合总数
  const totalCombinations = useMemo(() => {
    return calculateTotalCombinations(traits);
  }, [traits]);

  // 检查是否可以生成指定数量的组合
  const canGenerate = useMemo(() => {
    if (traits.length === 0) return false;
    if (traits.some(trait => trait.components.length === 0)) return false;
    return count <= totalCombinations;
  }, [traits, count, totalCombinations]);

  // 生成组合
  const handleGenerate = async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    setError('');

    try {
      const newCompositions = generateUniqueCompositions(traits, count);
      setCompositions(newCompositions);
      onGenerateCompositions(newCompositions);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  // 重新生成
  const handleRegenerate = () => {
    setCompositions([]);
    handleGenerate();
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* 控制面板 */}
      <div className="p-6 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">合成预览</h2>
          
          {/* 统计信息 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800">特征数量</h3>
              <p className="text-2xl font-bold text-blue-900">{traits.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-800">组件总数</h3>
              <p className="text-2xl font-bold text-green-900">
                {traits.reduce((sum, trait) => sum + trait.components.length, 0)}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-purple-800">可能组合</h3>
              <p className="text-2xl font-bold text-purple-900">{totalCombinations.toLocaleString()}</p>
            </div>
          </div>

          {/* 生成设置 */}
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="count" className="block text-sm font-medium text-gray-700 mb-2">
                生成数量
              </label>
              <input
                id="count"
                type="number"
                min="1"
                max={totalCombinations}
                value={count}
                onChange={(e) => onUpdateCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex space-x-2">
              {compositions.length > 0 && (
                <button
                  onClick={handleRegenerate}
                  disabled={isGenerating || !canGenerate}
                  className="px-4 py-2 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  重新生成
                </button>
              )}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !canGenerate}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? '生成中...' : '生成预览'}
              </button>
            </div>
          </div>

          {/* 错误提示或警告 */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {!canGenerate && !error && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              {traits.length === 0 ? (
                <p className="text-yellow-800">请先添加特征并导入组件</p>
              ) : traits.some(trait => trait.components.length === 0) ? (
                <p className="text-yellow-800">
                  存在未导入组件的特征：
                  {traits.filter(t => t.components.length === 0).map(t => t.name).join('、')}
                </p>
              ) : count > totalCombinations ? (
                <p className="text-yellow-800">
                  无法生成{count}个不重复组合，最多只能生成{totalCombinations}个
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* 预览网格 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {compositions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-lg font-medium mb-2">暂无预览</h3>
              <p className="text-sm text-center">
                设置生成数量并点击"生成预览"开始
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  预览结果 ({compositions.length} 个)
                </h3>
                {isGenerating && (
                  <div className="flex items-center text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                    生成预览中...
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {compositions.map((composition, index) => (
                  <CompositionCard
                    key={composition.id}
                    composition={composition}
                    traits={traits}
                    index={index}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
