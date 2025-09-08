import { Task, TaskGroup, CalendarData } from "@/types/schedule";

const STORAGE_KEY = "schedule_data";

/**
 * 获取存储的数据
 */
export function getStoredData(): CalendarData | null {
  if (typeof window === "undefined") {
    console.log("⚠️  服务端环境，跳过localStorage读取");
    return null;
  }
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    console.log("🔍 从localStorage读取原始数据:", data ? `${data.length}字符` : "无数据");
    
    if (!data) {
      console.log("📭 localStorage中无保存数据");
      return null;
    }
    
    const parsed = JSON.parse(data);
    console.log("📋 解析后的数据:", { 
      tasks: parsed.tasks?.length || 0, 
      taskGroups: parsed.taskGroups?.length || 0,
      year: parsed.year,
      month: parsed.month 
    });
    
    // 转换日期字符串为Date对象
    const result = {
      ...parsed,
      tasks: parsed.tasks?.map((task: any) => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
      })) || [],
      taskGroups: parsed.taskGroups?.map((group: any) => ({
        ...group,
        createdAt: new Date(group.createdAt),
      })) || [],
    };
    
    console.log("✅ 数据加载成功");
    return result;
  } catch (error) {
    console.error("❌ 解析存储数据失败:", error);
    return null;
  }
}

/**
 * 保存数据到本地存储
 */
export function saveData(data: CalendarData): void {
  if (typeof window === "undefined") {
    console.log("⚠️  服务端环境，跳过localStorage保存");
    return;
  }
  
  try {
    const dataStr = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, dataStr);
    console.log("✅ 数据已保存到localStorage，大小:", dataStr.length, "字符");
    console.log("📦 保存的数据:", { 
      tasks: data.tasks.length, 
      taskGroups: data.taskGroups.length,
      year: data.year,
      month: data.month 
    });
  } catch (error) {
    console.error("❌ 保存数据失败:", error);
    alert("保存数据失败: " + error);
  }
}

/**
 * 导出数据为JSON文件
 */
export function exportData(data: CalendarData): void {
  try {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `schedule_${data.year}_${data.month}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to export data:", error);
  }
}

/**
 * 导入数据
 */
export function importData(file: File): Promise<CalendarData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // 验证数据格式
        if (!data.tasks || !Array.isArray(data.tasks)) {
          throw new Error("Invalid data format: missing tasks array");
        }
        
        if (!data.taskGroups || !Array.isArray(data.taskGroups)) {
          throw new Error("Invalid data format: missing taskGroups array");
        }
        
        // 转换日期字符串为Date对象
        const parsedData: CalendarData = {
          year: data.year || new Date().getFullYear(),
          month: data.month || new Date().getMonth() + 1,
          tasks: data.tasks.map((task: any) => ({
            ...task,
            createdAt: new Date(task.createdAt || Date.now()),
            updatedAt: new Date(task.updatedAt || Date.now()),
          })),
          taskGroups: data.taskGroups.map((group: any) => ({
            ...group,
            createdAt: new Date(group.createdAt || Date.now()),
          })),
        };
        
        resolve(parsedData);
      } catch (error) {
        reject(new Error(`导入失败: ${error instanceof Error ? error.message : "未知错误"}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error("文件读取失败"));
    };
    
    reader.readAsText(file);
  });
}

/**
 * 合并导入的数据（增量导入）
 */
export function mergeImportedData(currentData: CalendarData, importedData: CalendarData): CalendarData {
  // 合并任务组（按名称去重）
  const existingGroupNames = new Set(currentData.taskGroups.map(g => g.name));
  const newTaskGroups = importedData.taskGroups.filter(g => !existingGroupNames.has(g.name));
  
  // 合并任务（直接添加，不去重）
  const allTasks = [...currentData.tasks, ...importedData.tasks];
  const allTaskGroups = [...currentData.taskGroups, ...newTaskGroups];
  
  return {
    year: currentData.year,
    month: currentData.month,
    tasks: allTasks,
    taskGroups: allTaskGroups,
  };
}

/**
 * 清空所有数据
 */
export function clearData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
