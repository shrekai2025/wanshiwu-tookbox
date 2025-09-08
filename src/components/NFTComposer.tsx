"use client";

import { useState, useCallback } from "react";
import { NFTState, NFTTrait, NFTWorkflowStep, ExportSettings } from "@/types/nft";
import { TraitList } from "./NFTComposer/TraitList";
import { ComponentGrid } from "./NFTComposer/ComponentGrid";
import { CompositionPreview } from "./NFTComposer/CompositionPreview";
import { ExportPanel } from "./NFTComposer/ExportPanel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Eye, Download } from "lucide-react";

export function NFTComposer() {
  const [state, setState] = useState<NFTState>({
    currentStep: 'setup',
    traits: [],
    selectedTraitId: null,
    compositions: [],
    generationSettings: {
      count: 10,
      exportSettings: {
        width: 512,
        height: 512,
        quality: 0.9,
        format: 'png'
      }
    }
  });

  // 添加新trait
  const addTrait = useCallback((name: string) => {
    const newTrait: NFTTrait = {
      id: `trait_${Date.now()}`,
      name,
      components: [],
      order: state.traits.length
    };
    
    setState(prev => ({
      ...prev,
      traits: [...prev.traits, newTrait]
    }));
  }, [state.traits.length]);

  // 删除trait
  const deleteTrait = useCallback((traitId: string) => {
    setState(prev => ({
      ...prev,
      traits: prev.traits.filter(t => t.id !== traitId),
      selectedTraitId: prev.selectedTraitId === traitId ? null : prev.selectedTraitId
    }));
  }, []);

  // 重新排序traits
  const reorderTraits = useCallback((traits: NFTTrait[]) => {
    setState(prev => ({
      ...prev,
      traits: traits.map((trait, index) => ({ ...trait, order: index }))
    }));
  }, []);

  // 选择trait
  const selectTrait = useCallback((traitId: string) => {
    setState(prev => ({
      ...prev,
      selectedTraitId: traitId
    }));
  }, []);

  // 切换工作流步骤
  const setCurrentStep = useCallback((step: NFTWorkflowStep) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  // 更新导出设置
  const updateExportSettings = useCallback((settings: ExportSettings) => {
    setState(prev => ({
      ...prev,
      generationSettings: {
        ...prev.generationSettings,
        exportSettings: settings
      }
    }));
  }, []);

  // 更新合成数量
  const updateCount = useCallback((count: number) => {
    setState(prev => ({
      ...prev,
      generationSettings: {
        ...prev.generationSettings,
        count
      }
    }));
  }, []);

  const selectedTrait = state.selectedTraitId 
    ? state.traits.find(t => t.id === state.selectedTraitId) || null
    : null;

  return (
    <div className="flex h-full min-h-screen">
      {/* 左侧 Trait 列表 */}
      <div className="w-80 border-r bg-card flex flex-col">
        <Card className="rounded-none border-0 border-b">
          <CardHeader>
            <CardTitle className="text-lg">特征列表</CardTitle>
            <CardDescription>
              拖拽排序，上方特征显示在图层前面
            </CardDescription>
          </CardHeader>
        </Card>
        
        <TraitList
          traits={state.traits}
          selectedTraitId={state.selectedTraitId}
          onAddTrait={addTrait}
          onDeleteTrait={deleteTrait}
          onReorderTraits={reorderTraits}
          onSelectTrait={selectTrait}
        />
      </div>

      {/* 中间内容区域 */}
      <div className="flex-1 flex flex-col">
        {/* 工作流步骤导航 */}
        <Card className="rounded-none border-0 border-b">
          <CardContent className="pt-6">
            <Tabs value={state.currentStep} onValueChange={setCurrentStep}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="setup" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">设置特征</span>
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">合成预览</span>
                </TabsTrigger>
                <TabsTrigger value="export" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">批量导出</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* 主要内容区域 */}
        <div className="flex-1 bg-background">
          {state.currentStep === 'setup' && (
            <div className="flex h-full">
              <ComponentGrid
                selectedTrait={selectedTrait}
                onUpdateTrait={(updatedTrait) => {
                  setState(prev => ({
                    ...prev,
                    traits: prev.traits.map(t => 
                      t.id === updatedTrait.id ? updatedTrait : t
                    )
                  }));
                }}
              />
            </div>
          )}
          
          {state.currentStep === 'preview' && (
            <CompositionPreview
              traits={state.traits}
              count={state.generationSettings.count}
              onUpdateCount={updateCount}
              onGenerateCompositions={(compositions) => {
                setState(prev => ({ ...prev, compositions }));
              }}
            />
          )}
          
          {state.currentStep === 'export' && (
            <ExportPanel
              compositions={state.compositions}
              traits={state.traits}
              exportSettings={state.generationSettings.exportSettings}
              onUpdateExportSettings={updateExportSettings}
            />
          )}
        </div>
      </div>
    </div>
  );
}
