// NFT合成相关的类型定义

export interface NFTComponent {
  id: string;
  name: string;
  file: File;
  imageUrl: string; // blob URL for preview
}

export interface NFTTrait {
  id: string;
  name: string;
  components: NFTComponent[];
  order: number; // 用于图层排序，数值越大越在上层
}

export interface NFTComposition {
  id: string;
  traits: { [traitId: string]: NFTComponent };
  previewUrl?: string;
}

export interface ExportSettings {
  width: number;
  height: number;
  quality: number; // 0-1 之间的值
  format: 'png';
}

export interface GenerationSettings {
  count: number;
  exportSettings: ExportSettings;
}

// 工作流步骤
export type NFTWorkflowStep = 'setup' | 'preview' | 'export';

export interface NFTState {
  currentStep: NFTWorkflowStep;
  traits: NFTTrait[];
  selectedTraitId: string | null;
  compositions: NFTComposition[];
  generationSettings: GenerationSettings;
}
