import { Task, TaskGroup, Priority, SortType } from "@/types/schedule";

/**
 * 获取指定年月的天数
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * 获取指定年月第一天是星期几 (0-6, 0为星期日)
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

/**
 * 获取日历显示的日期数组 (6周 * 7天)
 */
export function getCalendarDates(year: number, month: number): Date[] {
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);
  
  const dates: Date[] = [];
  
  // 上个月的尾部日期
  for (let i = firstDay - 1; i >= 0; i--) {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    dates.push(new Date(prevYear, prevMonth - 1, daysInPrevMonth - i));
  }
  
  // 当前月的日期
  for (let day = 1; day <= daysInMonth; day++) {
    dates.push(new Date(year, month - 1, day));
  }
  
  // 下个月的开头日期（补齐42天）
  const remainingDays = 42 - dates.length;
  for (let day = 1; day <= remainingDays; day++) {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    dates.push(new Date(nextYear, nextMonth - 1, day));
  }
  
  return dates;
}

/**
 * 格式化日期为 YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 解析日期字符串
 */
export function parseDate(dateString: string): Date {
  return new Date(dateString + 'T00:00:00');
}

/**
 * 判断是否为当前月
 */
export function isCurrentMonth(date: Date, year: number, month: number): boolean {
  return date.getFullYear() === year && date.getMonth() === month - 1;
}

/**
 * 判断是否为今天
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return formatDate(date) === formatDate(today);
}

/**
 * 获取指定日期的任务
 */
export function getTasksForDate(tasks: Task[], date: string): Task[] {
  return tasks.filter(task => task.date === date);
}

/**
 * 按时间排序任务
 */
export function sortTasksByTime(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // 没有时间段的任务排在最后
    if (!a.timeSlot && !b.timeSlot) return 0;
    if (!a.timeSlot) return 1;
    if (!b.timeSlot) return -1;
    
    // 按开始时间排序
    return a.timeSlot.start.localeCompare(b.timeSlot.start);
  });
}

/**
 * 按优先级排序任务
 */
export function sortTasksByPriority(tasks: Task[]): Task[] {
  const priorityOrder: Record<Priority, number> = {
    highest: 3,
    high: 2,
    normal: 1,
  };
  
  return [...tasks].sort((a, b) => {
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // 优先级相同时按时间排序
    return sortTasksByTime([a, b])[0] === a ? -1 : 1;
  });
}

/**
 * 排序任务
 */
export function sortTasks(tasks: Task[], sortType: SortType): Task[] {
  switch (sortType) {
    case "time":
      return sortTasksByTime(tasks);
    case "priority":
      return sortTasksByPriority(tasks);
    default:
      return tasks;
  }
}

/**
 * 格式化时间显示
 */
export function formatTimeSlot(timeSlot?: { start: string; end: string }): string {
  if (!timeSlot) return "";
  return `${timeSlot.start}-${timeSlot.end}`;
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 获取任务组的颜色
 */
export function getTaskGroupColor(taskGroups: TaskGroup[], groupId: string): string {
  const group = taskGroups.find(g => g.id === groupId);
  return group?.color || "#64748b";
}

/**
 * 获取当前年月
 */
export function getCurrentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
}

/**
 * 获取年份选项
 */
export function getYearOptions(): number[] {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    years.push(i);
  }
  return years;
}

/**
 * 获取月份选项
 */
export function getMonthOptions(): { value: number; label: string }[] {
  return [
    { value: 1, label: "1月" },
    { value: 2, label: "2月" },
    { value: 3, label: "3月" },
    { value: 4, label: "4月" },
    { value: 5, label: "5月" },
    { value: 6, label: "6月" },
    { value: 7, label: "7月" },
    { value: 8, label: "8月" },
    { value: 9, label: "9月" },
    { value: 10, label: "10月" },
    { value: 11, label: "11月" },
    { value: 12, label: "12月" },
  ];
}
