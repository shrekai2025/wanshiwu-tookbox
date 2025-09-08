import { NFTTrait, NFTComponent, NFTComposition } from "@/types/nft";

// 计算所有可能的组合数量
export function calculateTotalCombinations(traits: NFTTrait[]): number {
  if (traits.length === 0) return 0;
  
  return traits.reduce((total, trait) => {
    if (trait.components.length === 0) return 0; // 如果任何trait没有组件，则无法组合
    return total * trait.components.length;
  }, 1);
}

// 生成随机且不重复的组合
export function generateUniqueCompositions(
  traits: NFTTrait[], 
  count: number
): NFTComposition[] {
  const totalCombinations = calculateTotalCombinations(traits);
  
  if (count > totalCombinations) {
    throw new Error(`无法生成${count}个不重复组合，最多只能生成${totalCombinations}个`);
  }

  const compositions: NFTComposition[] = [];
  const usedCombinations = new Set<string>();

  while (compositions.length < count) {
    const composition: NFTComposition = {
      id: `composition_${Date.now()}_${Math.random()}`,
      traits: {}
    };

    // 为每个trait随机选择一个组件
    const combinationKey: string[] = [];
    for (const trait of traits) {
      if (trait.components.length === 0) {
        throw new Error(`特征"${trait.name}"没有组件，无法生成组合`);
      }
      
      const randomIndex = Math.floor(Math.random() * trait.components.length);
      const selectedComponent = trait.components[randomIndex];
      
      composition.traits[trait.id] = selectedComponent;
      combinationKey.push(`${trait.id}:${selectedComponent.id}`);
    }

    // 检查是否已存在相同组合
    const key = combinationKey.sort().join('|');
    if (!usedCombinations.has(key)) {
      usedCombinations.add(key);
      compositions.push(composition);
    }
  }

  return compositions;
}

// 在Canvas上合成图层
export async function compositeToCanvas(
  composition: NFTComposition,
  traits: NFTTrait[],
  width: number = 512,
  height: number = 512
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('无法创建Canvas上下文');
  }

  // 清空画布
  ctx.clearRect(0, 0, width, height);

  // 按照traits的顺序（order）渲染图层
  const sortedTraits = [...traits].sort((a, b) => a.order - b.order);

  for (const trait of sortedTraits) {
    const component = composition.traits[trait.id];
    if (component) {
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height);
          resolve();
        };
        img.onerror = reject;
        img.src = component.imageUrl;
      });
    }
  }

  return canvas;
}

// 将Canvas转换为Blob
export function canvasToBlob(
  canvas: HTMLCanvasElement, 
  quality: number = 0.9
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('无法生成图片Blob'));
      }
    }, 'image/png', quality);
  });
}

// 下载Blob文件到指定文件夹
export async function downloadBlobToFolder(
  blob: Blob, 
  filename: string, 
  directoryHandle?: FileSystemDirectoryHandle
) {
  if (directoryHandle) {
    try {
      // 使用 File System Access API 保存到选定文件夹
      const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
    } catch (error) {
      console.error('保存文件失败:', error);
      // 回退到传统下载方式
      downloadBlobFallback(blob, filename);
    }
  } else {
    // 传统下载方式
    downloadBlobFallback(blob, filename);
  }
}

// 传统下载方式（回退方案）
function downloadBlobFallback(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 批量生成并下载NFT
export async function batchGenerateAndDownload(
  compositions: NFTComposition[],
  traits: NFTTrait[],
  width: number,
  height: number,
  quality: number,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  // 尝试让用户选择保存文件夹
  let directoryHandle: FileSystemDirectoryHandle | undefined;
  
  // 检查是否支持 File System Access API
  if ('showDirectoryPicker' in window) {
    try {
      directoryHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite'
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.warn('用户取消选择文件夹或浏览器不支持，使用默认下载方式');
      } else {
        // 用户取消了操作
        return;
      }
    }
  }

  for (let i = 0; i < compositions.length; i++) {
    const composition = compositions[i];
    
    try {
      // 合成图片
      const canvas = await compositeToCanvas(composition, traits, width, height);
      const blob = await canvasToBlob(canvas, quality);
      
      // 下载到指定文件夹或使用默认下载方式
      const filename = `nft_${i + 1}.png`;
      await downloadBlobToFolder(blob, filename, directoryHandle);
      
      // 报告进度
      onProgress?.(i + 1, compositions.length);
      
      // 添加小延迟避免浏览器阻塞
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`生成第${i + 1}个NFT时出错:`, error);
    }
  }
}
