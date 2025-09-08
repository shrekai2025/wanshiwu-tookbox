"use client";

import React, { useState, useRef, useCallback } from 'react';
import { useDrag } from 'react-dnd';
import { Button } from './ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Edit, Trash2, ChevronUp, ExternalLink, GripVertical, GripHorizontal, ChevronDown, Minimize2, Maximize2, StickyNote, Eye } from 'lucide-react';
import { TaskNote, NoteLine } from '@/types/tasknotes';
import { CommandLine } from './CommandLine';
import ReactMarkdown from 'react-markdown';
import { EmbeddedNoteModal } from './EmbeddedNoteModal';

interface TaskNoteCardProps {
  note: TaskNote;
  allNotes: TaskNote[];
  onEdit: () => void;
  onDelete: () => void;
  onBringToFront: () => void;
  onWidthChange: (width: number) => void;
  onToggleCollapsed: () => void;
}

export function TaskNoteCard({ note, allNotes, onEdit, onDelete, onBringToFront, onWidthChange, onToggleCollapsed }: TaskNoteCardProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const [embeddedNoteModalOpen, setEmbeddedNoteModalOpen] = useState(false);
  const [selectedEmbeddedNote, setSelectedEmbeddedNote] = useState<TaskNote | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: 'note',
    item: { 
      id: note.id, 
      type: 'note',
      tabId: note.tabId
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => !isResizing,
  });

  const openUrl = (url: string) => {
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      finalUrl = 'https://' + url;
    }
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShowEmbeddedNote = (noteId: string) => {
    const embeddedNote = allNotes.find(n => n.id === noteId);
    if (embeddedNote) {
      setSelectedEmbeddedNote(embeddedNote);
      setEmbeddedNoteModalOpen(true);
    }
  };

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(note.width);

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const newWidth = Math.max(200, Math.min(600, startWidth + deltaX));
      
      if (cardRef.current) {
        cardRef.current.style.width = `${newWidth}px`;
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      
      if (cardRef.current) {
        const newWidth = parseInt(cardRef.current.style.width) || note.width;
        onWidthChange(newWidth);
      }

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [note.width, onWidthChange, startX, startWidth]);

  const renderLine = (line: NoteLine, index: number) => {
    switch (line.type) {
      case 'url':
        return (
          <div key={line.id} className="flex items-start gap-2 group">
            <button
              onClick={() => openUrl(line.content)}
              className="flex-1 text-left text-blue-600 hover:text-blue-700 underline decoration-blue-500/30 hover:decoration-blue-600 transition-colors break-all"
            >
              {line.content}
            </button>
            <ExternalLink className="w-4 h-4 text-blue-500 opacity-60 mt-0.5 flex-shrink-0" />
          </div>
        );
      
      case 'command':
        return (
          <div key={line.id}>
            <CommandLine content={line.content} />
          </div>
        );

      case 'note':
        const referencedNote = line.noteRef ? allNotes.find(n => n.id === line.noteRef!.id) : null;
        return (
          <div key={line.id} className="bg-gray-50 border border-purple-200 rounded-md relative">
            {/* Header with note title and show all button */}
            <div className="flex items-center justify-between p-3 pb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <StickyNote className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <span className="text-gray-900 font-medium text-sm truncate">
                  {line.noteRef?.title || 'Untitled Note'}
                </span>
              </div>
              {referencedNote && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleShowEmbeddedNote(referencedNote.id)}
                  className="h-6 w-6 p-0 text-purple-500 hover:text-purple-600 hover:bg-purple-50 flex-shrink-0"
                  title="Show full note"
                >
                  <Eye className="w-3 h-3" />
                </Button>
              )}
            </div>
            
            {/* Content area with fixed height and scroll */}
            <div className="px-3 pb-3">
              {referencedNote ? (
                <div className="max-h-[50px] overflow-y-auto">
                  {referencedNote.lines.length > 0 ? (
                    <div className="text-gray-600 text-xs leading-relaxed">
                      {referencedNote.lines.map((refLine, refIndex) => {
                        if (refLine.type === 'text') {
                          return (
                            <div key={refLine.id} className="mb-1 last:mb-0">
                              {refLine.content}
                            </div>
                          );
                        } else if (refLine.type === 'url') {
                          return (
                            <div key={refLine.id} className="mb-1 last:mb-0 text-blue-600">
                              {refLine.content}
                            </div>
                          );
                        } else if (refLine.type === 'command') {
                          return (
                            <div key={refLine.id} className="mb-1 last:mb-0 text-green-600 font-mono">
                              {refLine.content}
                            </div>
                          );
                        } else if (refLine.type === 'note') {
                          return (
                            <div key={refLine.id} className="mb-1 last:mb-0 text-purple-500">
                              → {refLine.noteRef?.title || 'Untitled Note'}
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-xs italic">
                      Empty note
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-red-500 text-xs">
                  ⚠️ Referenced note not found
                </div>
              )}
            </div>
          </div>
        );
      
      default:
        return (
          <div key={line.id} className="markdown-content select-text">
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
                h4: ({ children }) => (
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    {children}
                  </h4>
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
                    className="text-blue-600 hover:text-blue-700 underline decoration-blue-500/30 hover:decoration-blue-600 transition-colors"
                  >
                    {children}
                  </a>
                ),
                hr: () => (
                  <hr className="border-gray-300 my-3" />
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto mb-2">
                    <table className="min-w-full border-collapse border border-gray-300">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-gray-100">
                    {children}
                  </thead>
                ),
                tbody: ({ children }) => (
                  <tbody>
                    {children}
                  </tbody>
                ),
                tr: ({ children }) => (
                  <tr className="border-b border-gray-300">
                    {children}
                  </tr>
                ),
                th: ({ children }) => (
                  <th className="border border-gray-300 px-2 py-1 text-left text-gray-900 font-semibold">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-gray-300 px-2 py-1 text-gray-700">
                    {children}
                  </td>
                ),
              }}
            >
              {line.content}
            </ReactMarkdown>
          </div>
        );
    }
  };

  const dragPreviewRef = useRef<HTMLDivElement>(null);
  dragPreview(dragPreviewRef);

  return (
    <>
      <div
        ref={dragPreviewRef}
        className={`absolute rounded-lg border border-gray-300 bg-white shadow-lg transition-all duration-200 ${
          isDragging ? 'opacity-50 scale-105' : 'hover:shadow-xl hover:border-gray-400'
        } ${isResizing ? 'cursor-ew-resize' : ''} ${
          note.isCollapsed ? 'min-h-[44px]' : 'min-h-[80px]'
        }`}
        style={{
          left: note.position.x,
          top: note.position.y,
          width: note.width,
          zIndex: note.zIndex,
        }}
      >
        {/* Drag handle area - top title bar */}
        <div
          ref={(node) => {
            if (node) drag(node);
          }}
          className={`flex items-center justify-between gap-2 p-3 ${
            note.isCollapsed ? 'pb-3' : 'pb-2'
          } rounded-t-lg ${
            !isResizing ? 'cursor-move' : ''
          } select-none ${
            note.isCollapsed ? 'rounded-b-lg' : ''
          }`}
          style={{ 
            minHeight: '44px',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
        >
          {/* Drag indicator and title */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <GripHorizontal className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              {note.title && note.title.trim() ? (
                <h3 className="text-gray-900 text-lg leading-tight break-words font-medium">
                  {note.title}
                </h3>
              ) : (
                <div className="text-gray-500 text-sm italic">Untitled Note</div>
              )}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex gap-1 flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={onToggleCollapsed}
              className="h-6 w-6 p-0 hover:bg-gray-100 text-gray-500 hover:text-gray-700"
              title={note.isCollapsed ? "Expand Note" : "Collapse Note"}
            >
              {note.isCollapsed ? (
                <Maximize2 className="w-3 h-3" />
              ) : (
                <Minimize2 className="w-3 h-3" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onBringToFront}
              className="h-6 w-6 p-0 hover:bg-gray-100 text-gray-500 hover:text-gray-700"
              title="Bring to Front"
            >
              <ChevronUp className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onEdit}
              className="h-6 w-6 p-0 hover:bg-gray-100 text-gray-500 hover:text-gray-700"
              title="Edit"
            >
              <Edit className="w-3 h-3" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600 text-gray-500"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white border-gray-200">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-gray-900">Confirm Delete</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-600">
                    Are you sure you want to delete this note? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-gray-100 text-gray-700 hover:bg-gray-200">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700 text-white">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Note content area - only show when not collapsed */}
        {!note.isCollapsed && (
          <div 
            ref={cardRef}
            className="px-4 pb-4 pr-8 max-h-80 overflow-y-auto"
            style={{
              userSelect: 'text',
              WebkitUserSelect: 'text',
              MozUserSelect: 'text',
              msUserSelect: 'text'
            }}
          >
            <div className="space-y-3">
              {note.lines.length === 0 ? (
                <div className="text-gray-500 italic text-sm text-center py-2 select-none">
                  Click edit to add content
                </div>
              ) : (
                note.lines.map((line, index) => renderLine(line, index))
              )}
            </div>
          </div>
        )}

        {/* Right resize handle - only show when not collapsed */}
        {!note.isCollapsed && (
          <div
            className="absolute right-0 top-0 h-full w-4 flex items-center justify-center cursor-ew-resize group hover:bg-gray-100 transition-colors select-none"
            onMouseDown={handleResizeStart}
            title="Drag to resize width"
            style={{
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
          >
            <GripVertical className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </div>
        )}

        {/* Visual feedback when resizing */}
        {isResizing && (
          <div className="absolute -right-12 top-2 bg-gray-900 text-white text-xs px-2 py-1 rounded pointer-events-none select-none">
            {Math.round(note.width)}px
          </div>
        )}
      </div>

      {/* Embedded Note Modal */}
      <EmbeddedNoteModal
        open={embeddedNoteModalOpen}
        onOpenChange={setEmbeddedNoteModalOpen}
        note={selectedEmbeddedNote}
      />
    </>
  );
}
