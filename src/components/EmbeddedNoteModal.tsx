"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { StickyNote, ExternalLink, Terminal } from 'lucide-react';
import { TaskNote } from '@/types/tasknotes';
import ReactMarkdown from 'react-markdown';
import { CommandLine } from './CommandLine';

interface EmbeddedNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: TaskNote | null;
}

export function EmbeddedNoteModal({ open, onOpenChange, note }: EmbeddedNoteModalProps) {
  if (!note) return null;

  const openUrl = (url: string) => {
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      finalUrl = 'https://' + url;
    }
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  const renderLine = (line: any, index: number) => {
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
        return (
          <div key={line.id} className="bg-gray-50 border border-purple-200 rounded-md p-3">
            <div className="flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-purple-500" />
              <span className="text-purple-600 text-sm font-medium">
                Referenced Note: {line.noteRef?.title || 'Untitled Note'}
              </span>
            </div>
          </div>
        );
      
      default:
        return (
          <div key={line.id} className="markdown-content">
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
              {line.content}
            </ReactMarkdown>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden bg-white border-gray-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <StickyNote className="w-5 h-5 text-purple-500" />
            {note.title || 'Untitled Note'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Created: {note.createdAt.toLocaleDateString()}
            {note.updatedAt.getTime() !== note.createdAt.getTime() && (
              <span className="ml-2">
                • Updated: {note.updatedAt.toLocaleDateString()}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh] pr-2">
          <div className="space-y-4">
            {note.lines.length === 0 ? (
              <div className="text-gray-500 italic text-center py-8">
                This note is empty
              </div>
            ) : (
              note.lines.map((line, index) => renderLine(line, index))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
