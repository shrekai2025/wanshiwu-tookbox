"use client";

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Copy, Check, Terminal } from 'lucide-react';

interface CommandLineProps {
  content: string;
}

export function CommandLine({ content }: CommandLineProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const commands = content.split('\n').filter(cmd => cmd.trim());

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-md">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 rounded-t-md border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-green-400" />
          <span className="text-green-400 text-sm font-medium">Terminal</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={copyToClipboard}
          className="h-6 w-6 p-0 text-gray-400 hover:text-green-400 hover:bg-gray-700"
          title="Copy to clipboard"
        >
          {copied ? (
            <Check className="w-3 h-3" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </Button>
      </div>
      
      {/* Content */}
      <div className="p-3">
        <div className="space-y-1">
          {commands.map((command, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-green-400 text-sm font-mono select-none">$</span>
              <span className="text-gray-200 text-sm font-mono leading-relaxed break-all">
                {command.trim()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
