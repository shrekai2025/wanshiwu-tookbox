"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Trash2, Eye, Edit3, FileText, Link, Terminal, GripVertical, Search, StickyNote } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { NoteLine, TaskNote } from '@/types/tasknotes';

interface EditTaskNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (title: string, lines: NoteLine[]) => void;
  initialTitle: string;
  initialLines: NoteLine[];
  allNotes: TaskNote[];
}

interface DraggableLineProps {
  line: NoteLine;
  index: number;
  previewIndex: number | null;
  onUpdateLine: (id: string, updates: Partial<NoteLine>) => void;
  onDeleteLine: (id: string) => void;
  onMoveLine: (dragIndex: number, hoverIndex: number) => void;
  setPreviewIndex: (index: number | null) => void;
  canDelete: boolean;
  allNotes: TaskNote[];
}

const DraggableLine: React.FC<DraggableLineProps> = ({
  line,
  index,
  previewIndex,
  onUpdateLine,
  onDeleteLine,
  onMoveLine,
  setPreviewIndex,
  canDelete,
  allNotes
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNoteSearch, setShowNoteSearch] = useState(false);

  const [{ isDragging }, drag] = useDrag({
    type: 'line',
    item: { id: line.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'line',
    hover: (draggedItem: { id: string; index: number }) => {
      if (draggedItem.index !== index) {
        onMoveLine(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  // Filter notes based on search query
  const filteredNotes = allNotes.filter(note => {
    const query = searchQuery.toLowerCase();
    const titleMatch = note.title?.toLowerCase().includes(query) || false;
    const contentMatch = note.lines.some(line => 
      line.content.toLowerCase().includes(query)
    );
    return titleMatch || contentMatch;
  });

  const getTypeIcon = (type: NoteLine['type']) => {
    switch (type) {
      case 'url': return <Link className="w-4 h-4" />;
      case 'command': return <Terminal className="w-4 h-4" />;
      case 'note': return <StickyNote className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: NoteLine['type']) => {
    switch (type) {
      case 'url': return 'text-blue-500';
      case 'command': return 'text-green-600';
      case 'note': return 'text-purple-500';
      default: return 'text-gray-600';
    }
  };

  const getPlaceholder = (type: NoteLine['type']) => {
    switch (type) {
      case 'url':
        return '例如：https://github.com/user/repo 或 google.com';
      case 'command':
        return '例如：npm install react\ngit push origin main';
      case 'note':
        return '搜索并选择要引用的便签...';
      default:
        return '支持 Markdown：**粗体** *斜体* `代码` [链接](url) 等';
    }
  };

  const handleNoteSelect = (selectedNote: TaskNote) => {
    onUpdateLine(line.id, {
      content: selectedNote.title || '无标题便签',
      noteRef: {
        id: selectedNote.id,
        title: selectedNote.title || '无标题便签'
      }
    });
    setShowNoteSearch(false);
    setSearchQuery('');
  };

  const handleTypeChange = (newType: NoteLine['type']) => {
    if (newType === 'note') {
      setShowNoteSearch(true);
      onUpdateLine(line.id, { 
        type: newType,
        content: '',
        noteRef: undefined
      });
    } else {
      setShowNoteSearch(false);
      onUpdateLine(line.id, { 
        type: newType,
        noteRef: undefined
      });
    }
  };

  const renderMarkdownPreview = (content: string) => (
    <div className="markdown-content bg-gray-50 border border-gray-200 rounded-md p-3 min-h-[80px] max-h-[200px] overflow-y-auto">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-semibold text-gray-900 mb-2 border-b border-gray-300 pb-1">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-gray-700 leading-relaxed mb-2 last:mb-0">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-600">
              {children}
            </em>
          ),
          code: ({ children }) => (
            <code className="bg-gray-100 text-green-700 px-1 py-0.5 rounded text-sm font-mono">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="bg-gray-100 text-green-700 p-2 rounded text-sm font-mono overflow-x-auto mb-2 border border-gray-200">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-400 pl-3 text-gray-600 italic mb-2">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-gray-700 mb-2 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-gray-700 mb-2 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-700">
              {children}
            </li>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              {children}
            </a>
          ),
        }}
      >
        {content || '*预览内容为空*'}
      </ReactMarkdown>
    </div>
  );

  const ref = useRef<HTMLDivElement>(null);
  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200 transition-opacity ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        {/* Drag handle */}
        <div className="cursor-move p-1 hover:bg-gray-200 rounded">
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
        
        <span className="text-sm text-gray-600 flex-shrink-0">Line {index + 1}</span>
        
        <Select 
          value={line.type} 
          onValueChange={handleTypeChange}
        >
          <SelectTrigger className="w-36 h-8 bg-white border-gray-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200">
            <SelectItem value="text">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-600" />
                <span>文本</span>
              </div>
            </SelectItem>
            <SelectItem value="url">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-blue-500" />
                <span>网址</span>
              </div>
            </SelectItem>
            <SelectItem value="command">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-green-600" />
                <span>命令</span>
              </div>
            </SelectItem>
            <SelectItem value="note">
              <div className="flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-purple-500" />
                <span>便签</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        
        {line.type === 'text' && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setPreviewIndex(previewIndex === index ? null : index)}
            className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 flex-shrink-0"
            title={previewIndex === index ? "编辑模式" : "预览模式"}
          >
            {previewIndex === index ? <Edit3 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </Button>
        )}
        
        {canDelete && (
          <Button
            type="button"
            onClick={() => onDeleteLine(line.id)}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-red-500 hover:text-red-600 ml-auto flex-shrink-0"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Note search interface */}
      {line.type === 'note' && showNoteSearch && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="按标题或内容搜索便签..."
              className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            />
          </div>
          
          {searchQuery && (
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md bg-white">
              {filteredNotes.length === 0 ? (
                <div className="p-3 text-gray-500 text-sm text-center">
                  没有找到匹配 "{searchQuery}" 的便签
                </div>
              ) : (
                filteredNotes.map(note => (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => handleNoteSelect(note)}
                    className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <StickyNote className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-900 text-sm font-medium truncate">
                          {note.title || '无标题便签'}
                        </div>
                        <div className="text-gray-600 text-xs mt-1 line-clamp-2">
                          {note.lines.length > 0 
                            ? note.lines[0].content.substring(0, 100) + (note.lines[0].content.length > 100 ? '...' : '')
                            : '空便签'
                          }
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Display selected note reference */}
      {line.type === 'note' && line.noteRef && !showNoteSearch && (
        <div className="bg-white border border-purple-200 rounded-md p-3">
          <div className="flex items-center gap-2 mb-2">
            <StickyNote className="w-4 h-4 text-purple-500" />
            <span className="text-purple-600 text-sm font-medium">引用便签：</span>
          </div>
          <div className="text-gray-900 text-sm">
            {line.noteRef.title}
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setShowNoteSearch(true)}
            className="mt-2 h-6 text-xs text-gray-600 hover:text-gray-900"
          >
            更换引用
          </Button>
        </div>
      )}

      {/* Regular content input for non-note types */}
      {line.type !== 'note' && (
        <>
          {line.type === 'text' && previewIndex === index ? (
            <div className="space-y-2">
              <div className="text-xs text-gray-600">Markdown 预览：</div>
              {renderMarkdownPreview(line.content)}
            </div>
          ) : (
            <Textarea
                value={line.content}
                onChange={(e) => onUpdateLine(line.id, { content: e.target.value })}
                placeholder={getPlaceholder(line.type)}
                className={`min-h-[80px] bg-white border-gray-300 text-gray-900 placeholder-gray-500 ${
                  line.type === 'command' ? 'font-mono' : ''
                }`}
                rows={line.type === 'command' ? 4 : 3}
              />
          )}

          {line.type === 'text' && previewIndex !== index && (
            <div className="text-xs text-gray-500">
              💡 支持 Markdown：**粗体** *斜体* `代码` [链接](url) # 标题 {">"} 引用 - 列表
            </div>
          )}
        </>
      )}
    </div>
  );
};

export function EditTaskNoteModal({ 
  open, 
  onOpenChange, 
  onSubmit, 
  initialTitle, 
  initialLines,
  allNotes 
}: EditTaskNoteModalProps) {
  const [title, setTitle] = useState('');
  const [lines, setLines] = useState<NoteLine[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setLines(initialLines.length > 0 ? initialLines : [
        { id: generateId(), content: '', type: 'text' }
      ]);
    }
  }, [open, initialTitle, initialLines]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addLine = () => {
    const newLine: NoteLine = {
      id: generateId(),
      content: '',
      type: 'text'
    };
    setLines([...lines, newLine]);
  };

  const updateLine = (id: string, updates: Partial<NoteLine>) => {
    setLines(lines.map(line => 
      line.id === id ? { ...line, ...updates } : line
    ));
  };

  const deleteLine = (id: string) => {
    if (lines.length > 1) {
      setLines(lines.filter(line => line.id !== id));
    }
  };

  const moveLine = useCallback((dragIndex: number, hoverIndex: number) => {
    setLines(prevLines => {
      const newLines = [...prevLines];
      const draggedLine = newLines[dragIndex];
      newLines.splice(dragIndex, 1);
      newLines.splice(hoverIndex, 0, draggedLine);
      return newLines;
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validLines = lines.filter(line => 
      line.content.trim() !== '' || (line.type === 'note' && line.noteRef)
    );
    onSubmit(title, validLines);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden bg-white border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-gray-900">编辑便签</DialogTitle>
          <DialogDescription className="text-gray-600">
            创建或编辑便签，支持多种内容类型，包括文本、网址、命令和便签引用。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Note title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-700">便签标题（可选）</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入便签标题..."
              className="bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            />
          </div>

          {/* Note content lines */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-gray-700">便签内容</Label>
              <Button
                type="button"
                onClick={addLine}
                size="sm"
                className="gap-1 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-3 h-3" />
                添加行
              </Button>
            </div>

            <div className="space-y-3">
              {lines.map((line, index) => (
                <DraggableLine
                  key={line.id}
                  line={line}
                  index={index}
                  previewIndex={previewIndex}
                  onUpdateLine={updateLine}
                  onDeleteLine={deleteLine}
                  onMoveLine={moveLine}
                  setPreviewIndex={setPreviewIndex}
                  canDelete={lines.length > 1}
                  allNotes={allNotes}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              取消
            </Button>
            <Button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              保存便签
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
