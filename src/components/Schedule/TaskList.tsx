"use client";

import { Task, TaskGroup, SortType } from "@/types/schedule";
import { 
  sortTasks, 
  formatTimeSlot, 
  getTaskGroupColor 
} from "@/utils/scheduleUtils";
import { 
  PRIORITY_CONFIG, 
  COMPLETION_STATUS_CONFIG, 
  REVIEW_STATUS_CONFIG 
} from "@/types/schedule";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, Clock, Flag, CheckCircle, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskListProps {
  tasks: Task[];
  taskGroups: TaskGroup[];
  sortType: SortType;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  isPrintMode?: boolean;
}

export function TaskList({
  tasks,
  taskGroups,
  sortType,
  onEditTask,
  onDeleteTask,
  isPrintMode = false,
}: TaskListProps) {
  const sortedTasks = sortTasks(tasks, sortType);

  if (tasks.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        {isPrintMode ? "当天无任务安排" : "暂无任务，点击\"添加任务\"创建新任务"}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sortedTasks.map((task) => (
        <Card key={task.id} className="p-3">
          <div className="space-y-2">
            {/* 第一行：时间段 + 任务内容 + 操作按钮 */}
            <div className="flex items-start gap-2">
              {/* 时间段 */}
              {task.timeSlot && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                  <Clock className="h-3 w-3" />
                  <span>{formatTimeSlot(task.timeSlot)}</span>
                </div>
              )}
              
              {/* 任务内容 */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight break-words">
                  {task.content}
                </p>
              </div>
              
              {/* 操作按钮 */}
              {!isPrintMode && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditTask(task)}
                    className="h-6 w-6 p-0"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteTask(task.id)}
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* 第二行：任务组 + 状态信息 */}
            <div className="flex flex-wrap items-center gap-1 text-xs">
              {/* 任务组标签 */}
              {task.groupIds.map(groupId => {
                const group = taskGroups.find(g => g.id === groupId);
                if (!group) return null;
                
                return (
                  <Badge
                    key={groupId}
                    variant="secondary"
                    className="text-xs px-1.5 py-0.5 h-5"
                    style={{
                      backgroundColor: group.color + "20",
                      borderColor: group.color,
                      color: group.color,
                    }}
                  >
                    {group.name}
                  </Badge>
                );
              })}

              {/* 优先级 */}
              <div className="flex items-center gap-1">
                <Flag
                  className="h-3 w-3"
                  style={{ color: PRIORITY_CONFIG[task.priority].color }}
                />
                <span className="text-muted-foreground">
                  {PRIORITY_CONFIG[task.priority].label}
                </span>
              </div>

              {/* 完成状态 */}
              <div className="flex items-center gap-1">
                <CheckCircle
                  className="h-3 w-3"
                  style={{ color: COMPLETION_STATUS_CONFIG[task.completionStatus].color }}
                />
                <span className="text-muted-foreground">
                  {COMPLETION_STATUS_CONFIG[task.completionStatus].label}
                </span>
              </div>

              {/* 验收状态 */}
              {task.reviewStatus && (
                <div className="flex items-center gap-1">
                  <Star
                    className="h-3 w-3"
                    style={{ color: REVIEW_STATUS_CONFIG[task.reviewStatus].color }}
                  />
                  <span className="text-muted-foreground">
                    {REVIEW_STATUS_CONFIG[task.reviewStatus].label}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
