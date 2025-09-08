"use client";

import { useMemo } from "react";
import { CalendarData, Task, TaskGroup, SortType } from "@/types/schedule";
import { CalendarView } from "./CalendarView";
import { TaskList } from "./TaskList";
import { 
  getTasksForDate, 
  getCalendarDates, 
  formatDate, 
  isCurrentMonth, 
  isToday,
  formatTimeSlot,
  sortTasks
} from "@/utils/scheduleUtils";
import { 
  PRIORITY_CONFIG, 
  COMPLETION_STATUS_CONFIG, 
  REVIEW_STATUS_CONFIG 
} from "@/types/schedule";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface PrintViewProps {
  data: CalendarData;
  selectedDate: string;
  selectedGroupIds: string[];
  sortType: SortType;
  onExitPrintMode?: () => void;
}

// 打印专用日历网格组件
function PrintCalendarGrid({ 
  year, 
  month, 
  tasks, 
  taskGroups, 
  selectedDate 
}: {
  year: number;
  month: number;
  tasks: Task[];
  taskGroups: TaskGroup[];
  selectedDate: string;
}) {
  const calendarDates = getCalendarDates(year, month);
  const weekDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

  return (
    <table style={{ 
      width: '100%', 
      borderCollapse: 'collapse',
      fontSize: '12px'
    }}>
      <thead>
        <tr>
          {weekDays.map((day, index) => (
            <th key={day} style={{
              padding: '8px 4px',
              border: '1px solid #d1d5db',
              backgroundColor: '#f3f4f6',
              fontSize: '11px',
              fontWeight: '600',
              textAlign: 'center',
              color: index === 0 ? '#dc2626' : index === 6 ? '#2563eb' : '#374151'
            }}>
              {day}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: 6 }, (_, weekIndex) => (
          <tr key={weekIndex}>
            {Array.from({ length: 7 }, (_, dayIndex) => {
              const dateIndex = weekIndex * 7 + dayIndex;
              const date = calendarDates[dateIndex];
              const dateString = formatDate(date);
              const isCurrentMonthDate = isCurrentMonth(date, year, month);
              const isTodayDate = isToday(date);
              const isSelected = selectedDate === dateString;
              const dateTasks = getTasksForDate(tasks, dateString);
              
              return (
                <td key={dayIndex} style={{
                  width: '14.28%',
                  height: '60px',
                  border: isTodayDate ? '2px solid #2563eb' : '1px solid #d1d5db',
                  padding: '4px',
                  verticalAlign: 'top',
                  backgroundColor: !isCurrentMonthDate ? '#f9fafb' : 
                                   isSelected ? '#bfdbfe' : 'white',
                  opacity: !isCurrentMonthDate ? 0.6 : 1
                }}>
                  {/* 日期数字 */}
                  <div style={{
                    fontSize: '12px',
                    fontWeight: isTodayDate ? '700' : '500',
                    marginBottom: '2px',
                    color: isTodayDate ? '#1d4ed8' : '#374151'
                  }}>
                    {date.getDate()}
                  </div>
                  
                  {/* 任务数量 */}
                  {dateTasks.length > 0 && (
                    <div style={{
                      fontSize: '11px',
                      color: '#374151',
                      textAlign: 'center',
                      marginTop: '8px',
                      padding: '2px 4px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '3px',
                      fontWeight: '500'
                    }}>
                      {dateTasks.length}个任务
                    </div>
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// 打印专用任务列表组件
function PrintTaskList({ 
  tasks, 
  taskGroups,
  selectedGroupIds
}: {
  tasks: Task[];
  taskGroups: TaskGroup[];
  selectedGroupIds: string[];
}) {
  // 任务已经在PrintView中排序过了，这里直接使用
  const sortedTasks = tasks;

  if (tasks.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        color: '#6b7280',
        fontSize: '14px',
        padding: '20px'
      }}>
        当天无任务安排
      </div>
    );
  }

  return (
    <div>
      {sortedTasks.map((task, index) => (
        <div key={task.id} style={{
          marginBottom: '6px',
          padding: '4px 6px',
          border: '1px solid #e5e7eb',
          borderRadius: '3px',
          backgroundColor: 'white'
        }}>
          {/* 第一行：时间 + 内容 */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px',
            marginBottom: '2px'
          }}>
            {task.timeSlot && (
              <span style={{
                fontSize: '11px',
                color: '#6b7280',
                flexShrink: 0,
                fontFamily: 'monospace'
              }}>
                {formatTimeSlot(task.timeSlot)}
              </span>
            )}
            <span style={{
              fontSize: '12px',
              fontWeight: '500',
              lineHeight: '1.4',
              flex: 1
            }}>
              {task.content}
            </span>
          </div>
          
          {/* 第二行：状态信息 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '9px',
            color: '#6b7280'
          }}>
            {/* 任务组 */}
            {task.groupIds.map(groupId => {
              const group = taskGroups.find(g => g.id === groupId);
              if (!group) return null;
              return (
                <span key={groupId} style={{
                  padding: '1px 3px',
                  borderRadius: '2px',
                  backgroundColor: group.color + '20',
                  border: `1px solid ${group.color}`,
                  color: group.color,
                  fontSize: '8px'
                }}>
                  {group.name}
                </span>
              );
            })}
            
            {/* 优先级 */}
            <span style={{ color: PRIORITY_CONFIG[task.priority].color }}>
              {PRIORITY_CONFIG[task.priority].label}
            </span>
            
            {/* 完成状态 */}
            <span style={{ color: COMPLETION_STATUS_CONFIG[task.completionStatus].color }}>
              {COMPLETION_STATUS_CONFIG[task.completionStatus].label}
            </span>
            
            {/* 验收状态 */}
            {task.reviewStatus && (
              <span style={{ color: REVIEW_STATUS_CONFIG[task.reviewStatus].color }}>
                {REVIEW_STATUS_CONFIG[task.reviewStatus].label}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PrintView({ data, selectedDate, selectedGroupIds, sortType, onExitPrintMode }: PrintViewProps) {
  // 获取选中日期的任务，并应用过滤和排序
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    const dateTasks = getTasksForDate(data.tasks, selectedDate);
    
    // 应用任务组过滤（与编辑模式相同的逻辑）
    let filteredTasks;
    if (selectedGroupIds.length === 0) {
      // 如果没有选中任何任务组，只显示未分组的任务
      filteredTasks = dateTasks.filter(task => task.groupIds.length === 0);
    } else {
      // 显示选中任务组的任务 + 未分组任务
      filteredTasks = dateTasks.filter(task => 
        task.groupIds.length === 0 || 
        task.groupIds.some(groupId => selectedGroupIds.includes(groupId))
      );
    }
    
    // 应用排序
    return sortTasks(filteredTasks, sortType);
  }, [selectedDate, data.tasks, selectedGroupIds, sortType]);

  const handleSaveAsImage = async () => {
    // 动态导入html2canvas以避免SSR问题
    const html2canvas = (await import("html2canvas")).default;
    
    const element = document.getElementById("print-area");
    if (!element) return;

    // 添加导出样式类
    element.classList.add("export-mode");

    try {
      // 等待一下让样式应用
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 2, // 高清晰度
        useCORS: true,
        allowTaint: true,
        width: 1200, // 固定宽度
        height: 800,  // 固定高度
      });

      const link = document.createElement("a");
      link.download = `schedule_${data.year}_${data.month}${selectedDate ? `_${selectedDate}` : ""}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error("Failed to save as image:", error);
      alert("保存图片失败，请重试");
    } finally {
      // 移除导出样式类
      element.classList.remove("export-mode");
    }
  };

  return (
    <div className="space-y-4">
      {/* 打印区域 - 使用table布局确保打印兼容性 */}
      <div id="print-area" style={{ 
        width: '100%', 
        backgroundColor: 'white', 
        padding: '16px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          tableLayout: 'fixed' 
        }}>
          <tbody>
            <tr>
              {/* 日历视图 */}
              <td style={{ 
                width: '50%', 
                verticalAlign: 'top', 
                paddingRight: '12px' 
              }}>
                <div style={{ 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px', 
                  overflow: 'hidden' 
                }}>
                  {/* 标题 */}
                  <div style={{ 
                    padding: '12px', 
                    borderBottom: '1px solid #e5e7eb', 
                    backgroundColor: '#f9fafb' 
                  }}>
                    <h2 style={{ 
                      margin: '0', 
                      fontSize: '18px', 
                      fontWeight: '600', 
                      textAlign: 'center' 
                    }}>
                      {data.customTitle || "学习计划月历表"} - {data.year}年 {data.month}月
                    </h2>
                  </div>
                  
                  {/* 日历网格 */}
                  <div style={{ padding: '12px' }}>
                    <PrintCalendarGrid 
                      year={data.year}
                      month={data.month}
                      tasks={data.tasks}
                      taskGroups={data.taskGroups}
                      selectedDate={selectedDate}
                    />
                  </div>
                </div>
              </td>

              {/* 任务列表 */}
              <td style={{ 
                width: '50%', 
                verticalAlign: 'top' 
              }}>
                <div style={{ 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px', 
                  overflow: 'hidden',
                  height: '100%'
                }}>
                  {/* 标题 */}
                  <div style={{ 
                    padding: '12px', 
                    borderBottom: '1px solid #e5e7eb', 
                    backgroundColor: '#f9fafb' 
                  }}>
                    <h3 style={{ 
                      margin: '0', 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      textAlign: 'center' 
                    }}>
                      {selectedDate ? `${selectedDate} 每日学习任务` : "任务详情"}
                    </h3>
                  </div>
                  
                  {/* 任务内容 */}
                  <div style={{ padding: '12px' }}>
                      <PrintTaskList
                        tasks={selectedDateTasks}
                        taskGroups={data.taskGroups}
                        selectedGroupIds={selectedGroupIds}
                      />
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 打印专用样式 */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0.5cm;
          }
          
          .no-print {
            display: none !important;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          table {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
