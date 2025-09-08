"use client";

import { useState, useEffect, useMemo } from "react";
import { CalendarView } from "./Schedule/CalendarView";
import { TaskList } from "./Schedule/TaskList";
import { TaskForm } from "./Schedule/TaskForm";
import { ExportImport } from "./Schedule/ExportImport";
import { PrintView } from "./Schedule/PrintView";
import { 
  Task, 
  TaskGroup, 
  CalendarData, 
  TaskFormData,
  SortType 
} from "@/types/schedule";
import { 
  getCurrentYearMonth, 
  formatDate, 
  getTasksForDate,
  generateId
} from "@/utils/scheduleUtils";
import { 
  getStoredData, 
  saveData, 
  mergeImportedData 
} from "@/utils/scheduleStorage";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileDown, FileUp, Printer, Download } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export function ScheduleComposer() {
  const [calendarData, setCalendarData] = useState<CalendarData>(() => {
    const { year, month } = getCurrentYearMonth();
    
    // 在初始化时就尝试从本地存储加载数据
    if (typeof window !== "undefined") {
      const storedData = getStoredData();
      if (storedData) {
        return storedData;
      }
    }
    
    return {
      year,
      month,
      tasks: [],
      taskGroups: [],
    };
  });
  
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // 默认选中今天日期
    const today = new Date();
    return formatDate(today);
  });
  const [sortType, setSortType] = useState<SortType>("time");
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  // 标记是否是初次渲染
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // 保存数据到本地存储（只在初始化后保存）
  useEffect(() => {
    if (isInitialized) {
      saveData(calendarData);
    }
  }, [calendarData, isInitialized]);


  // 更新年月
  const handleYearMonthChange = (year: number, month: number) => {
    setCalendarData(prev => ({ ...prev, year, month }));
    setSelectedDate(""); // 清除选中的日期
  };

  // 选择日期
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  // 创建任务
  const handleCreateTask = (formData: TaskFormData) => {
    const now = new Date();
    
    setCalendarData(prev => {
      // 准备新的任务组和任务ID列表
      let newTaskGroups = [...prev.taskGroups];
      let groupIds = [...formData.groupIds];
      
      // 如果有新任务组，添加到列表中
      if (formData.newGroupName && formData.newGroupColor) {
        const newGroup: TaskGroup = {
          id: generateId(),
          name: formData.newGroupName,
          color: formData.newGroupColor,
          createdAt: now,
        };
        newTaskGroups.push(newGroup);
        groupIds.push(newGroup.id);
      }

      // 创建新任务
      const newTask: Task = {
        id: generateId(),
        date: selectedDate,
        timeSlot: formData.timeSlot,
        content: formData.content,
        groupIds,
        completionStatus: formData.completionStatus,
        reviewStatus: formData.reviewStatus,
        priority: formData.priority,
        createdAt: now,
        updatedAt: now,
      };

      // 一次性更新所有数据
      return {
        ...prev,
        taskGroups: newTaskGroups,
        tasks: [...prev.tasks, newTask],
      };
    });

    setIsTaskFormOpen(false);
  };

  // 编辑任务
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };

  // 更新任务
  const handleUpdateTask = (formData: TaskFormData) => {
    if (!editingTask) return;

    const now = new Date();
    
    setCalendarData(prev => {
      // 准备新的任务组和任务ID列表
      let newTaskGroups = [...prev.taskGroups];
      let groupIds = [...formData.groupIds];
      
      // 如果有新任务组，添加到列表中
      if (formData.newGroupName && formData.newGroupColor) {
        const newGroup: TaskGroup = {
          id: generateId(),
          name: formData.newGroupName,
          color: formData.newGroupColor,
          createdAt: now,
        };
        newTaskGroups.push(newGroup);
        groupIds.push(newGroup.id);
      }

      // 更新任务
      const updatedTask: Task = {
        ...editingTask,
        timeSlot: formData.timeSlot,
        content: formData.content,
        groupIds,
        completionStatus: formData.completionStatus,
        reviewStatus: formData.reviewStatus,
        priority: formData.priority,
        updatedAt: now,
      };

      // 一次性更新所有数据
      return {
        ...prev,
        taskGroups: newTaskGroups,
        tasks: prev.tasks.map(t => t.id === editingTask.id ? updatedTask : t),
      };
    });

    setEditingTask(null);
    setIsTaskFormOpen(false);
  };

  // 删除任务
  const handleDeleteTask = (taskId: string) => {
    setCalendarData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId),
    }));
  };

  // 导入数据
  const handleImportData = (importedData: CalendarData) => {
    const mergedData = mergeImportedData(calendarData, importedData);
    setCalendarData(mergedData);
  };

  // 处理标题变更
  const handleTitleChange = (title: string) => {
    setCalendarData(prev => ({
      ...prev,
      customTitle: title
    }));
  };

  // 初始化选中的任务组（默认全选）
  useEffect(() => {
    setSelectedGroupIds(calendarData.taskGroups.map(group => group.id));
  }, [calendarData.taskGroups]);

  // 获取当前选中日期的任务，并按任务组过滤
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    const dateTasks = getTasksForDate(calendarData.tasks, selectedDate);
    
    // 如果没有选中任何任务组，只显示未分组的任务
    if (selectedGroupIds.length === 0) {
      return dateTasks.filter(task => task.groupIds.length === 0);
    }
    
    // 过滤任务：显示选中任务组的任务 + 没有任务组的任务
    return dateTasks.filter(task => 
      task.groupIds.length === 0 || 
      task.groupIds.some(groupId => selectedGroupIds.includes(groupId))
    );
  }, [selectedDate, calendarData.tasks, selectedGroupIds]);

  // 处理任务组选择
  const handleGroupToggle = (groupId: string, checked: boolean) => {
    setSelectedGroupIds(prev => 
      checked 
        ? [...prev, groupId]
        : prev.filter(id => id !== groupId)
    );
  };

  // 全选/全不选
  const handleSelectAllGroups = (checked: boolean) => {
    setSelectedGroupIds(checked ? calendarData.taskGroups.map(group => group.id) : []);
  };

  // 保存为图片
  const handleSaveAsImage = async () => {
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
        scale: 2,
        useCORS: true,
        allowTaint: true,
        width: 1200, // 固定宽度
        height: 800,  // 固定高度
      });

      const link = document.createElement("a");
      link.download = `schedule_${calendarData.year}_${calendarData.month}${selectedDate ? `_${selectedDate}` : ""}.png`;
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

  // 如果是打印模式，使用PrintView组件
  if (isPrintMode) {
    return (
      <div className="print-mode">
        {/* 打印模式工具栏 */}
        <div className="fixed top-4 right-4 no-print flex gap-2 z-50 bg-white p-2 rounded-lg shadow-lg border">
          <Button onClick={handleSaveAsImage} size="sm">
            <Download className="h-4 w-4 mr-1" />
            保存图片
          </Button>
          <Button 
            onClick={() => setIsPrintMode(false)} 
            variant="outline" 
            size="sm"
          >
            退出打印模式
          </Button>
        </div>
        
                  <PrintView
                    data={calendarData}
                    selectedDate={selectedDate}
                    selectedGroupIds={selectedGroupIds}
                    sortType={sortType}
                    onExitPrintMode={() => setIsPrintMode(false)}
                  />
      </div>
    );
  }

  return (
    <div>
      {/* 主要内容区域 */}
      <div 
        id="schedule-print-area" 
        className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4 lg:gap-6"
      >
        {/* 日历视图 */}
        <div className="min-h-0">
          <CalendarView
            year={calendarData.year}
            month={calendarData.month}
            tasks={calendarData.tasks}
            taskGroups={calendarData.taskGroups}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            isPrintMode={false}
            onYearMonthChange={handleYearMonthChange}
            onExportImport={
              <ExportImport
                data={calendarData}
                onImport={handleImportData}
              />
            }
            onPrintMode={() => setIsPrintMode(true)}
            customTitle={calendarData.customTitle}
            onTitleChange={handleTitleChange}
          />
        </div>

        {/* 任务列表 */}
        <div className="min-h-0">
          <Card className="h-full">
            <div className="border-b">
              {/* 标题和操作栏 */}
              <div className="p-2 flex items-center justify-between gap-2">
                <h3 className="font-medium text-sm">
                  {selectedDate ? `${selectedDate} 的任务` : "选择日期查看任务"}
                </h3>
                
                <div className="flex items-center gap-1">
                  {/* 排序选择 */}
                  {selectedDateTasks.length > 0 && (
                    <select
                      value={sortType}
                      onChange={(e) => setSortType(e.target.value as SortType)}
                      className="text-xs px-1 py-1 border rounded bg-background"
                    >
                      <option value="time">按时间</option>
                      <option value="priority">按优先级</option>
                    </select>
                  )}
                  
                  {/* 添加任务按钮 */}
                  {selectedDate && (
                    <Dialog open={isTaskFormOpen} onOpenChange={setIsTaskFormOpen}>
                      <DialogTrigger asChild>
                        <button
                          onClick={() => setEditingTask(null)}
                          className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center gap-1"
                        >
                          <Plus className="h-3 w-3" />
                          任务
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <TaskForm
                          taskGroups={calendarData.taskGroups}
                          editingTask={editingTask}
                          onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
                          onCancel={() => {
                            setIsTaskFormOpen(false);
                            setEditingTask(null);
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>

              {/* 任务组过滤 */}
              {calendarData.taskGroups.length > 0 && (
                <div className="px-2 pb-2">
                  <div className="flex flex-wrap items-center gap-1 text-xs">
                    {/* 全选按钮 */}
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedGroupIds.length === calendarData.taskGroups.length}
                        onChange={(e) => handleSelectAllGroups(e.target.checked)}
                        className="w-3 h-3"
                      />
                      <span className="text-muted-foreground">全选</span>
                    </label>
                    
                    <span className="text-muted-foreground mx-1">|</span>
                    
                    {/* 任务组选择 */}
                    {calendarData.taskGroups.map(group => (
                      <label key={group.id} className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedGroupIds.includes(group.id)}
                          onChange={(e) => handleGroupToggle(group.id, e.target.checked)}
                          className="w-3 h-3"
                        />
                        <span 
                          className="px-1 py-0.5 rounded text-xs"
                          style={{
                            backgroundColor: group.color + "20",
                            color: group.color,
                            border: `1px solid ${group.color}40`
                          }}
                        >
                          {group.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-2">
              <TaskList
                tasks={selectedDateTasks}
                taskGroups={calendarData.taskGroups}
                sortType={sortType}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                isPrintMode={false}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* 响应式和打印样式 */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          @page {
            size: A4 landscape;
            margin: 1cm;
          }
        }
        
        @media (max-width: 768px) {
          .xl\\:grid-cols-\\[2fr_1fr\\] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
