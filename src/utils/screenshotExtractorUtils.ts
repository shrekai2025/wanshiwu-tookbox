import { OpenAIVisionResponse } from '@/types/screenshotExtractor';

// 默认系统提示词
export const DEFAULT_SYSTEM_PROMPT = `请分析这张图片，并按以下要求返回结果：

1. 原始文案：提取图片中的所有文字内容，以合理的方式断句返回。如果没有文字，返回"无文字内容"。
   注意：如果文字较小或模糊，请尽力识别，如遇旋转文字请纠正方向后识别。

2. 译文：
   - 如果图片中的文字是中文，请翻译成地道的英语
   - 如果图片中的文字是非中文（包括但不限于英语、日语、韩语等），请翻译成中文
   - 如果没有文字，返回"无需翻译"
   - 对于非拉丁字母文字（如日文、韩文），请特别仔细识别

3. 图片描述：如果这张图不是纯文字图片，还包含其他图像信息（如人物、物品、场景等），请用中文简要描述图片内容。如果是纯文字图片，返回"纯文字图片"。
   注意：请提供准确的描述，避免推测性内容。

请严格按照以下JSON格式返回结果：
{
  "originalText": "原始文案内容",
  "translation": "翻译内容", 
  "imageDescription": "图片描述内容"
}`;

// OpenAI Vision API调用
export async function callOpenAIVision(
  apiKey: string, 
  imageDataUrls: string[], // 支持多张图片
  provider: 'openai' | 'openai-badger' = 'openai-badger',
  customPrompt?: string
): Promise<OpenAIVisionResponse> {
  const prompt = customPrompt || DEFAULT_SYSTEM_PROMPT;

  // 构建内容数组，包含文本和多张图片
  const content: any[] = [
    {
      type: 'text',
      text: imageDataUrls.length > 1 
        ? `${prompt}\n\n注意：我提供了${imageDataUrls.length}张图片，请综合分析所有图片的内容。`
        : prompt
    }
  ];

  // 添加所有图片到内容数组
  imageDataUrls.forEach((imageDataUrl, index) => {
    content.push({
      type: 'image_url',
      image_url: {
        url: imageDataUrl,
        detail: 'high'
      }
    });
  });

  // 根据供应商选择端点和模型
  const apiEndpoint = provider === 'openai' 
    ? 'https://api.openai.com/v1/chat/completions'
    : 'https://api.tu-zi.com/v1/chat/completions';
  
  const modelName = provider === 'openai' ? 'gpt-4o' : 'gpt-4o-mini';

  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        {
          role: 'user',
          content: content
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    if (response.status === 401) {
      throw new Error('API Key无效，请检查您的OpenAI API Key');
    } else if (response.status === 429) {
      throw new Error('API调用频率超限，请稍后重试');
    } else if (response.status === 413) {
      throw new Error('图片文件过大，请压缩后重试');
    } else if (response.status === 400) {
      const errorMsg = errorData.error?.message || '';
      if (errorMsg.includes('safety') || errorMsg.includes('policy')) {
        throw new Error('图片内容不符合OpenAI安全政策（可能包含不当内容）');
      } else if (errorMsg.includes('image')) {
        throw new Error('图片格式或内容有问题，请检查图片是否清晰且格式正确');
      } else {
        throw new Error('请求参数错误，请重试');
      }
    } else if (response.status === 500) {
      throw new Error('OpenAI服务器错误，请稍后重试');
    } else {
      throw new Error(errorData.error?.message || `API调用失败 (${response.status})`);
    }
  }

  return response.json();
}

// 解析OpenAI响应
export function parseVisionResponse(response: OpenAIVisionResponse): {
  originalText: string;
  translation: string;
  imageDescription: string;
} {
  try {
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('API返回内容为空');
    }

    // 尝试解析JSON格式的响应
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        originalText: parsed.originalText || '无法提取原始文案',
        translation: parsed.translation || '无法生成翻译',
        imageDescription: parsed.imageDescription || '无法生成图片描述'
      };
    }

    // 如果不是JSON格式，尝试按行解析
    const lines = content.split('\n').filter(line => line.trim());
    let originalText = '';
    let translation = '';
    let imageDescription = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.includes('原始文案') || trimmed.includes('originalText')) {
        originalText = extractContentFromLine(trimmed);
      } else if (trimmed.includes('译文') || trimmed.includes('translation')) {
        translation = extractContentFromLine(trimmed);
      } else if (trimmed.includes('图片描述') || trimmed.includes('imageDescription')) {
        imageDescription = extractContentFromLine(trimmed);
      }
    }

    // 如果解析失败，返回原始内容
    if (!originalText && !translation && !imageDescription) {
      return {
        originalText: content,
        translation: '请手动翻译',
        imageDescription: '请手动描述'
      };
    }

    return {
      originalText: originalText || '无法提取原始文案',
      translation: translation || '无法生成翻译',
      imageDescription: imageDescription || '无法生成图片描述'
    };

  } catch (error) {
    console.error('解析响应失败:', error);
    throw new Error('解析AI响应失败，请重试');
  }
}

// 从行中提取内容
function extractContentFromLine(line: string): string {
  // 移除常见的前缀
  const cleaned = line
    .replace(/^\d+\.\s*/, '') // 移除数字开头
    .replace(/^[-*]\s*/, '') // 移除列表符号
    .replace(/^[^:：]*[:：]\s*/, '') // 移除冒号前的内容
    .replace(/^"/, '') // 移除开头引号
    .replace(/"$/, '') // 移除结尾引号
    .trim();
    
  return cleaned;
}

// 图片文件转换为DataURL
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 压缩图片（如果需要）
export function compressImage(dataUrl: string, maxWidth: number = 1920, quality: number = 0.8): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    
    img.src = dataUrl;
  });
}
