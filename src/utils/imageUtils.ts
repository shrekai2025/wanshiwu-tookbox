/**
 * 压缩图片文件
 * @param file 原始图片文件
 * @param quality 压缩质量 (0-1)
 * @param maxWidth 最大宽度，可选
 * @param maxHeight 最大高度，可选
 * @returns 压缩后的文件
 */
export async function compressImage(
  file: File,
  quality: number = 0.8,
  maxWidth?: number,
  maxHeight?: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    if (!ctx) {
      reject(new Error("无法创建canvas上下文"));
      return;
    }

    img.onload = () => {
      try {
        let { width, height } = img;

        // 计算压缩后的尺寸
        if (maxWidth && width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (maxHeight && height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        // 设置canvas尺寸
        canvas.width = width;
        canvas.height = height;

        // 绘制图片到canvas
        ctx.drawImage(img, 0, 0, width, height);

        // 转换为blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("图片压缩失败"));
              return;
            }

            // 创建新的文件对象
            const compressedFile = new File([blob], file.name, {
              type: file.type.startsWith("image/png") ? "image/png" : "image/jpeg",
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          file.type.startsWith("image/png") ? "image/png" : "image/jpeg",
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("图片加载失败"));
    };

    // 加载图片
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 获取图片的尺寸信息
 * @param file 图片文件
 * @returns 图片尺寸
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      reject(new Error("无法加载图片"));
      URL.revokeObjectURL(img.src);
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * 判断是否支持的图片格式
 * @param file 文件对象
 * @returns 是否支持
 */
export function isSupportedImageFormat(file: File): boolean {
  const supportedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/svg+xml",
  ];

  return supportedTypes.includes(file.type);
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化的文件大小字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
