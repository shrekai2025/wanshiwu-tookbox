"use client";

import { useState, useRef, useEffect } from "react";
import { Task, TaskGroup } from "@/types/schedule";
import { 
  getCalendarDates, 
  formatDate, 
  isCurrentMonth, 
  isToday, 
  getTasksForDate, 
  getTaskGroupColor 
} from "@/utils/scheduleUtils";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  year: number;
  month: number;
  tasks: Task[];
  taskGroups: TaskGroup[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
  isPrintMode?: boolean;
  onYearMonthChange?: (year: number, month: number) => void;
  onExportImport?: React.ReactNode;
  onPrintMode?: () => void;
  customTitle?: string;
  onTitleChange?: (title: string) => void;
}

export function CalendarView({
  year,
  month,
  tasks,
  taskGroups,
  selectedDate,
  onDateSelect,
  isPrintMode = false,
  onYearMonthChange,
  onExportImport,
  onPrintMode,
  customTitle,
  onTitleChange,
}: CalendarViewProps) {
  const calendarDates = getCalendarDates(year, month);
  const weekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  
  // 标题编辑状态
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitleValue, setEditingTitleValue] = useState(customTitle || "学习计划月历表");
  const inputRef = useRef<HTMLInputElement>(null);

  // 当customTitle变化时更新编辑值
  useEffect(() => {
    setEditingTitleValue(customTitle || "学习计划月历表");
  }, [customTitle]);

  // 开始编辑标题
  const handleTitleClick = () => {
    if (!isPrintMode && onTitleChange) {
      setIsEditingTitle(true);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
  };

  // 保存标题
  const handleTitleSave = () => {
    setIsEditingTitle(false);
    if (onTitleChange && editingTitleValue.trim()) {
      onTitleChange(editingTitleValue.trim());
    } else if (onTitleChange) {
      // 如果为空，恢复默认值
      setEditingTitleValue(customTitle || "学习计划月历表");
    }
  };

  // 键盘事件处理
  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditingTitleValue(customTitle || "学习计划月历表");
      setIsEditingTitle(false);
    }
  };

  const displayTitle = customTitle || "学习计划月历表";

  return (
    <Card className="h-full">
      {/* 标题和控制栏 */}
      <div className="p-3 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          {/* 标题和日期选择 */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 可编辑标题 */}
            {isEditingTitle ? (
              <input
                ref={inputRef}
                type="text"
                value={editingTitleValue}
                onChange={(e) => setEditingTitleValue(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                className="text-lg font-semibold bg-transparent border-b-2 border-primary focus:outline-none min-w-0 max-w-48"
                placeholder="学习计划月历表"
              />
            ) : (
              <h2 
                className={cn(
                  "text-lg font-semibold whitespace-nowrap",
                  !isPrintMode && onTitleChange && "cursor-pointer hover:text-primary hover:underline"
                )}
                onClick={handleTitleClick}
                title={!isPrintMode && onTitleChange ? "点击编辑标题" : undefined}
              >
                {displayTitle}
              </h2>
            )}
            
            <span className="text-lg font-semibold whitespace-nowrap">-</span>
            
            {!isPrintMode && onYearMonthChange ? (
              <>
                <select
                  value={year}
                  onChange={(e) => onYearMonthChange(parseInt(e.target.value), month)}
                  className="text-sm border rounded px-2 py-1 bg-background"
                >
                  {Array.from({ length: 11 }, (_, i) => {
                    const y = new Date().getFullYear() - 5 + i;
                    return (
                      <option key={y} value={y}>
                        {y}年
                      </option>
                    );
                  })}
                </select>
                <select
                  value={month}
                  onChange={(e) => onYearMonthChange(year, parseInt(e.target.value))}
                  className="text-sm border rounded px-2 py-1 bg-background"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}月
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <span className="text-lg font-semibold">{year}年 {month}月</span>
            )}
          </div>

          {/* 操作按钮 */}
          {!isPrintMode && (onExportImport || onPrintMode) && (
            <div className="flex items-center gap-1">
              {onExportImport}
              {onPrintMode && (
                <button
                  onClick={onPrintMode}
                  className="text-xs px-2 py-1 border rounded bg-background hover:bg-muted flex items-center gap-1"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  打印
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 日历网格 */}
      <div className={cn("p-2 lg:p-4", isPrintMode && "calendar-grid-container")}>
        <div className={cn(
          "grid grid-cols-7 gap-0.5 lg:gap-1 h-full min-h-[400px] lg:min-h-[500px]",
          isPrintMode && "export-calendar-grid"
        )}>
          {/* 星期标题 */}
          {weekDays.map((day, index) => (
            <div
              key={day}
              className={cn(
                "p-1 lg:p-2 text-xs lg:text-sm font-medium text-center border bg-primary/10",
                index === 0 && "text-red-600", // 星期日红色
                index === 6 && "text-blue-600"  // 星期六蓝色
              )}
            >
              {day}
            </div>
          ))}

          {/* 日期格子 */}
          {calendarDates.map((date, index) => {
            const dateString = formatDate(date);
            const isCurrentMonthDate = isCurrentMonth(date, year, month);
            const isTodayDate = isToday(date);
            const isSelected = selectedDate === dateString;
            const dateTasks = getTasksForDate(tasks, dateString);
            
            // 获取任务组颜色
            const taskGroupColors = Array.from(
              new Set(
                dateTasks.flatMap(task => 
                  task.groupIds.map(groupId => getTaskGroupColor(taskGroups, groupId))
                )
              )
            );

            return (
              <div
                key={dateString}
                className={cn(
                  "border p-0.5 lg:p-1 cursor-pointer transition-colors relative min-h-[60px] lg:min-h-[80px] flex flex-col",
                  !isCurrentMonthDate && "text-muted-foreground bg-muted/30",
                  isCurrentMonthDate && "hover:bg-muted/50",
                  isTodayDate && "bg-primary/20 border-primary",
                  isSelected && "bg-primary/30 border-primary border-2",
                  isPrintMode && "cursor-default"
                )}
                onClick={() => !isPrintMode && onDateSelect(dateString)}
              >
                {/* 日期数字 */}
                <div className={cn(
                  "text-xs lg:text-sm font-medium mb-0.5 lg:mb-1",
                  isTodayDate && "text-primary font-bold"
                )}>
                  {date.getDate()}
                </div>

                {/* 任务指示器 */}
                {dateTasks.length > 0 && (
                  <div className="flex-1 space-y-1">
                    {/* 任务数量 */}
                    <div className="text-xs text-muted-foreground">
                      <span className="hidden lg:inline">{dateTasks.length}个任务</span>
                      <span className="lg:hidden">{dateTasks.length}</span>
                    </div>
                    
                    {/* 任务组颜色点 */}
                    {taskGroupColors.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 lg:gap-1">
                        {taskGroupColors.slice(0, 3).map((color, colorIndex) => (
                          <div
                            key={colorIndex}
                            className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        {taskGroupColors.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{taskGroupColors.length - 3}
                          </div>
                        )}
                      </div>
                    )}

                    {/* 显示前1-2个任务的简要信息 */}
                    {isPrintMode && dateTasks.slice(0, 2).map((task, taskIndex) => (
                      <div
                        key={task.id}
                        className="text-xs p-0.5 lg:p-1 rounded bg-background/80 border truncate hidden lg:block"
                        title={task.content}
                      >
                        {task.timeSlot && (
                          <span className="text-muted-foreground mr-1">
                            {task.timeSlot.start}
                          </span>
                        )}
                        <span className="truncate">
                          {task.content.length > 10
                            ? task.content.substring(0, 10) + "..." 
                            : task.content
                          }
                        </span>
                      </div>
                    ))}
                    {/* 移动端只显示1个任务 */}
                    {isPrintMode && dateTasks.slice(0, 1).map((task, taskIndex) => (
                      <div
                        key={`mobile-${task.id}`}
                        className="text-xs p-0.5 rounded bg-background/80 border truncate lg:hidden"
                        title={task.content}
                      >
                        <span className="truncate">
                          {task.content.length > 6
                            ? task.content.substring(0, 6) + "..." 
                            : task.content
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 选中状态指示 */}
                {isSelected && !isPrintMode && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 图例 */}
      {!isPrintMode && taskGroups.length > 0 && (
        <div className="p-2 lg:p-4 border-t">
          <div className="text-sm font-medium mb-2">任务组图例：</div>
          <div className="flex flex-wrap gap-2 lg:gap-3">
            {taskGroups.map(group => (
              <div key={group.id} className="flex items-center gap-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: group.color }}
                />
                <span className="text-xs lg:text-sm">{group.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* 导出专用样式 */}
      {isPrintMode && (
        <style jsx global>{`
          .export-calendar-grid {
            display: grid !important;
            grid-template-columns: repeat(7, 1fr) !important;
            grid-template-rows: auto !important;
            gap: 1px !important;
            width: 100% !important;
            height: auto !important;
            min-height: 500px !important;
          }
          
          .export-calendar-grid > div {
            display: flex !important;
            flex-direction: column !important;
            min-height: 70px !important;
            border: 1px solid #e5e7eb !important;
            padding: 4px !important;
          }
          
          .calendar-grid-container {
            width: 100% !important;
            overflow: visible !important;
          }
        `}</style>
      )}
    </Card>
  );
}
