// 任务优先级
export type Priority = "highest" | "high" | "normal";

// 完成情况
export type CompletionStatus = "pending" | "partial" | "completed";

// 结果验收
export type ReviewStatus = "satisfied" | "poor" | "redo";

// 排序方式
export type SortType = "time" | "priority";

// 任务组
export interface TaskGroup {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

// 任务
export interface Task {
  id: string;
  date: string; // YYYY-MM-DD格式
  timeSlot?: {
    start: string; // HH:MM格式
    end: string;   // HH:MM格式
  };
  content: string;
  groupIds: string[]; // 可属于多个任务组
  completionStatus: CompletionStatus;
  reviewStatus?: ReviewStatus;
  priority: Priority;
  createdAt: Date;
  updatedAt: Date;
}

// 日历数据
export interface CalendarData {
  year: number;
  month: number;
  tasks: Task[];
  taskGroups: TaskGroup[];
  customTitle?: string;
}

// 表单数据
export interface TaskFormData {
  timeSlot?: {
    start: string;
    end: string;
  };
  content: string;
  groupIds: string[];
  newGroupName?: string;
  newGroupColor?: string;
  completionStatus: CompletionStatus;
  reviewStatus?: ReviewStatus;
  priority: Priority;
}

// 颜色预设
export const PRESET_COLORS = [
  "#ef4444", // red-500
  "#f97316", // orange-500
  "#eab308", // yellow-500
  "#22c55e", // green-500
  "#06b6d4", // cyan-500
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#64748b", // slate-500
  "#6b7280", // gray-500
];

// 优先级配置
export const PRIORITY_CONFIG = {
  highest: { label: "最高", color: "#dc2626", weight: 3 },
  high: { label: "较高", color: "#ea580c", weight: 2 },
  normal: { label: "普通", color: "#64748b", weight: 1 },
};

// 完成状态配置
export const COMPLETION_STATUS_CONFIG = {
  pending: { label: "待完成", color: "#6b7280" },
  partial: { label: "部分完成", color: "#eab308" },
  completed: { label: "已完成", color: "#22c55e" },
};

// 验收状态配置
export const REVIEW_STATUS_CONFIG = {
  satisfied: { label: "满意", color: "#22c55e" },
  poor: { label: "较差", color: "#eab308" },
  redo: { label: "需重新完成", color: "#ef4444" },
};
