"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { NFTTrait } from "@/types/nft";
import { Trash2, Plus, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface TraitListProps {
  traits: NFTTrait[];
  selectedTraitId: string | null;
  onAddTrait: (name: string) => void;
  onDeleteTrait: (traitId: string) => void;
  onReorderTraits: (traits: NFTTrait[]) => void;
  onSelectTrait: (traitId: string) => void;
}

// 单个可排序的trait项
function SortableTraitItem({ trait, isSelected, onSelect, onDelete }: {
  trait: NFTTrait;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: trait.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`
        cursor-pointer transition-all
        ${isSelected 
          ? 'ring-2 ring-primary bg-primary/5' 
          : 'hover:shadow-md'
        }
        ${isDragging ? 'opacity-50 shadow-lg z-10' : ''}
      `}
      onClick={() => onSelect(trait.id)}
    >
      <CardContent className="flex items-center p-3">
        {/* 拖拽手柄 */}
        <Button
          {...attributes}
          {...listeners}
          variant="ghost"
          size="sm"
          className="cursor-grab active:cursor-grabbing h-8 w-8 p-0 mr-2"
        >
          <GripVertical className="h-4 w-4" />
        </Button>
        
        {/* Trait 信息 */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium truncate">
            {trait.name}
          </h3>
          <div className="flex items-center gap-1 mt-1">
            <Badge variant="secondary" className="text-xs">
              {trait.components.length} 个组件
            </Badge>
          </div>
        </div>
        
        {/* 删除按钮 */}
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(trait.id);
          }}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

// 添加新trait的表单
function AddTraitForm({ onAdd }: { onAdd: (name: string) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim());
      setName('');
      setIsAdding(false);
    }
  };

  if (!isAdding) {
    return (
      <Button
        onClick={() => setIsAdding(true)}
        variant="outline"
        className="w-full h-auto p-4 border-2 border-dashed text-muted-foreground hover:text-foreground"
      >
        <Plus className="h-4 w-4 mr-2" />
        添加特征
      </Button>
    );
  }

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardContent className="p-3">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入特征名称"
            autoFocus
          />
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setName('');
              }}
            >
              取消
            </Button>
            <Button
              type="submit"
              size="sm"
            >
              添加
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function TraitList({
  traits,
  selectedTraitId,
  onAddTrait,
  onDeleteTrait,
  onReorderTraits,
  onSelectTrait
}: TraitListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = traits.findIndex(trait => trait.id === active.id);
      const newIndex = traits.findIndex(trait => trait.id === over.id);
      
      const reorderedTraits = arrayMove(traits, oldIndex, newIndex);
      onReorderTraits(reorderedTraits);
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* trait列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={traits.map(t => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {traits.map((trait) => (
              <SortableTraitItem
                key={trait.id}
                trait={trait}
                isSelected={selectedTraitId === trait.id}
                onSelect={onSelectTrait}
                onDelete={onDeleteTrait}
              />
            ))}
          </SortableContext>
        </DndContext>
        
        {/* 添加新trait */}
        <AddTraitForm onAdd={onAddTrait} />
      </div>
      
      {/* 底部说明 */}
      {traits.length > 0 && (
        <div className="p-4 border-t bg-muted/50">
          <p className="text-xs text-muted-foreground">
            💡 拖拽可重新排序图层，上方特征会覆盖下方特征
          </p>
        </div>
      )}
    </div>
  );
}
