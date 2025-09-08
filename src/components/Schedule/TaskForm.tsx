"use client";

import { useState, useEffect } from "react";
import { Task, TaskGroup, TaskFormData, PRESET_COLORS } from "@/types/schedule";
import { generateId } from "@/utils/scheduleUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";

interface TaskFormProps {
  taskGroups: TaskGroup[];
  editingTask?: Task | null;
  onSubmit: (data: TaskFormData) => void;
  onCancel: () => void;
}

export function TaskForm({
  taskGroups,
  editingTask,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    timeSlot: undefined,
    content: "",
    groupIds: [],
    completionStatus: "pending",
    priority: "normal",
  });

  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState(PRESET_COLORS[0]);

  // 初始化表单数据
  useEffect(() => {
    if (editingTask) {
      setFormData({
        timeSlot: editingTask.timeSlot,
        content: editingTask.content,
        groupIds: editingTask.groupIds,
        completionStatus: editingTask.completionStatus,
        reviewStatus: editingTask.reviewStatus,
        priority: editingTask.priority,
      });
    }
  }, [editingTask]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      alert("请填写任务内容");
      return;
    }

    const submitData: TaskFormData = {
      ...formData,
      newGroupName: showNewGroup && newGroupName.trim() ? newGroupName.trim() : undefined,
      newGroupColor: showNewGroup && newGroupName.trim() ? newGroupColor : undefined,
    };

    onSubmit(submitData);
  };

  const handleTimeSlotChange = (field: "start" | "end", value: string) => {
    setFormData(prev => ({
      ...prev,
      timeSlot: prev.timeSlot
        ? { ...prev.timeSlot, [field]: value }
        : { start: field === "start" ? value : "", end: field === "end" ? value : "" },
    }));
  };

  const clearTimeSlot = () => {
    setFormData(prev => ({ ...prev, timeSlot: undefined }));
  };

  const handleGroupToggle = (groupId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      groupIds: checked
        ? [...prev.groupIds, groupId]
        : prev.groupIds.filter(id => id !== groupId),
    }));
  };

  const addNewGroup = () => {
    if (!newGroupName.trim()) {
      alert("请填写任务组名称");
      return;
    }

    setShowNewGroup(false);
    setNewGroupName("");
    setNewGroupColor(PRESET_COLORS[0]);
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle>
          {editingTask ? "编辑任务" : "创建新任务"}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 时间段 */}
        <div className="space-y-2">
          <Label>时间段（选填）</Label>
          <div className="flex items-center gap-2">
            <Input
              type="time"
              value={formData.timeSlot?.start || ""}
              onChange={(e) => handleTimeSlotChange("start", e.target.value)}
              placeholder="开始时间"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="time"
              value={formData.timeSlot?.end || ""}
              onChange={(e) => handleTimeSlotChange("end", e.target.value)}
              placeholder="结束时间"
            />
            {formData.timeSlot && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearTimeSlot}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* 任务内容 */}
        <div className="space-y-2">
          <Label htmlFor="content">任务内容 *</Label>
          <Input
            id="content"
            value={formData.content}
            onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
            placeholder="请输入任务内容"
            required
          />
        </div>

        {/* 任务组选择 */}
        <div className="space-y-3">
          <Label>任务组</Label>
          
          {/* 现有任务组 */}
          {taskGroups.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">选择现有任务组：</div>
              <div className="grid grid-cols-2 gap-2">
                {taskGroups.map(group => (
                  <div key={group.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`group-${group.id}`}
                      checked={formData.groupIds.includes(group.id)}
                      onCheckedChange={(checked) => 
                        handleGroupToggle(group.id, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={`group-${group.id}`}
                      className="flex items-center gap-1 cursor-pointer"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="text-sm">{group.name}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 新建任务组 */}
          {!showNewGroup ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowNewGroup(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              新建任务组
            </Button>
          ) : (
            <Card className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">新建任务组</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewGroup(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <Input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="任务组名称"
                />
                
                <div className="space-y-2">
                  <Label className="text-sm">选择颜色：</Label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`w-6 h-6 rounded-full border-2 ${
                          newGroupColor === color ? "border-foreground" : "border-muted"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewGroupColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* 优先级 */}
        <div className="space-y-2">
          <Label>优先级</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => 
              setFormData(prev => ({ ...prev, priority: value as any }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="highest">最高</SelectItem>
              <SelectItem value="high">较高</SelectItem>
              <SelectItem value="normal">普通</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 完成情况 */}
        <div className="space-y-2">
          <Label>完成情况</Label>
          <Select
            value={formData.completionStatus}
            onValueChange={(value) => 
              setFormData(prev => ({ ...prev, completionStatus: value as any }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">待完成</SelectItem>
              <SelectItem value="partial">部分完成</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 结果验收 */}
        <div className="space-y-2">
          <Label>结果验收（选填）</Label>
          <Select
            value={formData.reviewStatus || "none"}
            onValueChange={(value) => 
              setFormData(prev => ({ 
                ...prev, 
                reviewStatus: value === "none" ? undefined : value as any
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="请选择验收结果" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">不选择</SelectItem>
              <SelectItem value="satisfied">满意</SelectItem>
              <SelectItem value="poor">较差</SelectItem>
              <SelectItem value="redo">需重新完成</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button type="submit">
            {editingTask ? "更新任务" : "创建任务"}
          </Button>
        </div>
      </form>
    </div>
  );
}
