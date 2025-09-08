"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DndProvider, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Plus, Edit2, Check, X, MoreVertical, Trash2, Search, StickyNote, Download } from 'lucide-react';
import { TaskNoteCard } from './TaskNoteCard';
import { EditTaskNoteModal } from './EditTaskNoteModal';
import { TaskNote, Tab, DashboardConfig, StoredData, SearchResult } from '@/types/tasknotes';

const GRID_SIZE = 20;
const STORAGE_KEY = 'task-notes-dashboard';
const DEFAULT_NOTE_WIDTH = 288; // 18rem in pixels

const snapToGrid = (x: number, y: number) => {
  return {
    x: Math.round(x / GRID_SIZE) * GRID_SIZE,
    y: Math.round(y / GRID_SIZE) * GRID_SIZE,
  };
};

const defaultConfig: DashboardConfig = {
  title: '任务便签看板',
  activeTabId: 'default'
};

const defaultTab: Tab = {
  id: 'default',
  name: '常规',
  order: 0,
  createdAt: new Date()
};

function TaskNotesDashboardInner() {
  const [config, setConfig] = useState<DashboardConfig>(defaultConfig);
  const [notes, setNotes] = useState<TaskNote[]>([]);
  const [tabs, setTabs] = useState<Tab[]>([defaultTab]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<TaskNote | null>(null);
  const [maxZIndex, setMaxZIndex] = useState(1);
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [tempTabName, setTempTabName] = useState('');
  const [isTabAreaHovered, setIsTabAreaHovered] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load data from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: StoredData = JSON.parse(stored);
        setConfig({
          title: data.config.title || defaultConfig.title,
          activeTabId: data.config.activeTabId || defaultConfig.activeTabId
        });
        setTabs(data.tabs || [defaultTab]);
        
        // Add default width, collapsed state, and tabId for legacy data
        const notesWithDefaults = (data.notes || []).map(note => ({
          ...note,
          width: note.width || DEFAULT_NOTE_WIDTH,
          isCollapsed: note.isCollapsed ?? false,
          tabId: note.tabId || 'default',
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt)
        }));
        setNotes(notesWithDefaults);
        setMaxZIndex(data.maxZIndex || 1);
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  }, []);

  // Global keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    notes.forEach(note => {
      const tab = tabs.find(t => t.id === note.tabId);
      if (!tab) return;

      // Search in title
      if (note.title && note.title.toLowerCase().includes(query)) {
        results.push({
          note,
          tab,
          matchType: 'title',
          preview: note.title
        });
      }

      // Search in content
      const contentMatches = note.lines.filter(line => 
        line.type === 'text' && line.content.toLowerCase().includes(query)
      );

      contentMatches.forEach(line => {
        const preview = line.content.length > 60 
          ? line.content.substring(0, 60) + '...' 
          : line.content;
        
        results.push({
          note,
          tab,
          matchType: 'content',
          preview
        });
      });
    });

    // Remove duplicates and limit results
    const uniqueResults = results.filter((result, index, self) => 
      index === self.findIndex(r => r.note.id === result.note.id)
    ).slice(0, 8);

    setSearchResults(uniqueResults);
  }, [searchQuery, notes, tabs]);

  // Export data functionality
  const exportData = useCallback(() => {
    try {
      const exportData: StoredData = {
        config,
        notes,
        tabs,
        maxZIndex
      };

      // Create formatted date-time string for filename
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      const dateTimeString = `${year}${month}${day}-${hours}${minutes}${seconds}`;
      const filename = `tasknotes-${dateTimeString}.json`;

      // Convert data to JSON string with pretty formatting
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // Create blob and download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create temporary download link
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = filename;
      downloadLink.style.display = 'none';
      
      // Trigger download
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Clean up object URL
      URL.revokeObjectURL(url);
      
      console.log(`Data exported successfully as ${filename}`);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  }, [config, notes, tabs, maxZIndex]);

  // Save to localStorage
  const saveToStorage = useCallback((newConfig: DashboardConfig, newNotes: TaskNote[], newTabs: Tab[], newMaxZIndex: number) => {
    try {
      const data: StoredData = {
        config: newConfig,
        notes: newNotes,
        tabs: newTabs,
        maxZIndex: newMaxZIndex
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, []);

  // Update config and save
  const updateConfig = useCallback((newConfig: DashboardConfig) => {
    setConfig(newConfig);
    saveToStorage(newConfig, notes, tabs, maxZIndex);
  }, [notes, tabs, maxZIndex, saveToStorage]);

  // Update notes and save
  const updateNotesAndSave = useCallback((newNotes: TaskNote[], newMaxZIndex?: number) => {
    const zIndex = newMaxZIndex !== undefined ? newMaxZIndex : maxZIndex;
    setNotes(newNotes);
    if (newMaxZIndex !== undefined) {
      setMaxZIndex(newMaxZIndex);
    }
    saveToStorage(config, newNotes, tabs, zIndex);
  }, [config, tabs, maxZIndex, saveToStorage]);

  // Update tabs and save
  const updateTabsAndSave = useCallback((newTabs: Tab[]) => {
    setTabs(newTabs);
    saveToStorage(config, notes, newTabs, maxZIndex);
  }, [config, notes, maxZIndex, saveToStorage]);

  // Get notes for the current active tab
  const activeNotes = notes.filter(note => note.tabId === config.activeTabId);

  // Calculate the maximum extent of notes to determine if scrolling is needed
  const getNotesExtent = useCallback(() => {
    if (activeNotes.length === 0) return { width: 0, height: 0 };
    
    let maxX = 0;
    let maxY = 0;
    
    activeNotes.forEach(note => {
      const noteRight = note.position.x + note.width;
      const noteBottom = note.position.y + (note.isCollapsed ? 44 : 200);
      
      if (noteRight > maxX) maxX = noteRight;
      if (noteBottom > maxY) maxY = noteBottom;
    });
    
    return { width: maxX + 100, height: maxY + 100 };
  }, [activeNotes]);

  const notesExtent = getNotesExtent();

  const [, drop] = useDrop({
    accept: ['note', 'tab-drop'],
    drop: (item: { id: string; type: string; tabId?: string }, monitor) => {
      if (!dashboardRef.current) return;

      if (item.type === 'note') {
        const delta = monitor.getDifferenceFromInitialOffset();
        if (!delta) return;

        const note = notes.find(n => n.id === item.id);
        if (!note) return;

        const scrollContainer = dashboardRef.current;

        const newPosition = snapToGrid(
          note.position.x + delta.x,
          note.position.y + delta.y
        );

        // Allow notes to be placed in the scrollable area
        const clampedPosition = {
          x: Math.max(0, newPosition.x),
          y: Math.max(0, newPosition.y),
        };

        moveNote(item.id, clampedPosition);
      }
    },
  });

  const moveNote = useCallback((id: string, position: { x: number; y: number }) => {
    const newNotes = notes.map(note =>
      note.id === id ? { ...note, position } : note
    );
    updateNotesAndSave(newNotes);
  }, [notes, updateNotesAndSave]);

  const moveNoteToTab = useCallback((noteId: string, tabId: string) => {
    const newNotes = notes.map(note =>
      note.id === noteId ? { ...note, tabId, updatedAt: new Date() } : note
    );
    updateNotesAndSave(newNotes);
  }, [notes, updateNotesAndSave]);

  const updateNoteWidth = useCallback((id: string, width: number) => {
    const newNotes = notes.map(note =>
      note.id === id ? { ...note, width, updatedAt: new Date() } : note
    );
    updateNotesAndSave(newNotes);
  }, [notes, updateNotesAndSave]);

  const toggleNoteCollapsed = useCallback((id: string) => {
    const newNotes = notes.map(note =>
      note.id === id ? { ...note, isCollapsed: !note.isCollapsed, updatedAt: new Date() } : note
    );
    updateNotesAndSave(newNotes);
  }, [notes, updateNotesAndSave]);

  const addEmptyNote = () => {
    if (!dashboardRef.current) return;
    
    const scrollContainer = dashboardRef.current;
    const scrollLeft = scrollContainer.scrollLeft;
    const scrollTop = scrollContainer.scrollTop;
    const containerRect = scrollContainer.getBoundingClientRect();
    
    // Create note in the visible area
    const newNote: TaskNote = {
      id: Math.random().toString(36).substr(2, 9),
      title: '',
      lines: [],
      position: { 
        x: scrollLeft + Math.random() * (containerRect.width - DEFAULT_NOTE_WIDTH), 
        y: scrollTop + Math.random() * (containerRect.height - 200) 
      },
      width: DEFAULT_NOTE_WIDTH,
      zIndex: Math.min(maxZIndex + 1, 50),
      isCollapsed: false,
      tabId: config.activeTabId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const newNotes = [...notes, newNote];
    const newMaxZIndex = Math.min(maxZIndex + 1, 50);
    updateNotesAndSave(newNotes, newMaxZIndex);
    
    setEditingNote(newNote);
    setIsModalOpen(true);
  };

  const addNewTab = () => {
    const newTab: Tab = {
      id: Math.random().toString(36).substr(2, 9),
      name: `标签 ${tabs.length + 1}`,
      order: tabs.length,
      createdAt: new Date()
    };
    
    const newTabs = [...tabs, newTab];
    updateTabsAndSave(newTabs);
    
    // Switch to new tab and start editing its name
    updateConfig({ ...config, activeTabId: newTab.id });
    setEditingTabId(newTab.id);
    setTempTabName(newTab.name);
  };

  const deleteTab = (tabId: string) => {
    if (tabs.length <= 1) return;
    
    // Move all notes from deleted tab to the first remaining tab
    const remainingTabs = tabs.filter(t => t.id !== tabId);
    const targetTabId = remainingTabs[0].id;
    
    const updatedNotes = notes.map(note =>
      note.tabId === tabId ? { ...note, tabId: targetTabId, updatedAt: new Date() } : note
    );
    
    setNotes(updatedNotes);
    setTabs(remainingTabs);
    
    // Switch to target tab if we're deleting the active tab
    if (config.activeTabId === tabId) {
      setConfig({ ...config, activeTabId: targetTabId });
    }
    
    saveToStorage(
      config.activeTabId === tabId ? { ...config, activeTabId: targetTabId } : config,
      updatedNotes,
      remainingTabs,
      maxZIndex
    );
  };

  const startEditTab = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      setEditingTabId(tabId);
      setTempTabName(tab.name);
    }
  };

  const saveTabName = () => {
    if (editingTabId && tempTabName.trim()) {
      const newTabs = tabs.map(tab =>
        tab.id === editingTabId ? { ...tab, name: tempTabName.trim() } : tab
      );
      updateTabsAndSave(newTabs);
    }
    setEditingTabId(null);
    setTempTabName('');
  };

  const cancelEditTab = () => {
    setEditingTabId(null);
    setTempTabName('');
  };

  const updateNote = (id: string, updates: Partial<TaskNote>) => {
    const newNotes = notes.map(note =>
      note.id === id
        ? {
            ...note,
            ...updates,
            updatedAt: new Date(),
          }
        : note
    );
    updateNotesAndSave(newNotes);
    setEditingNote(null);
    setIsModalOpen(false);
  };

  const deleteNote = (id: string) => {
    const newNotes = notes.filter(note => note.id !== id);
    updateNotesAndSave(newNotes);
  };

  const bringToFront = (id: string) => {
    const newZIndex = Math.min(maxZIndex + 1, 50); // 限制便签zIndex最大为50，确保不会覆盖导航
    const newNotes = notes.map(note =>
      note.id === id ? { ...note, zIndex: newZIndex } : note
    );
    updateNotesAndSave(newNotes, newZIndex);
  };

  const handleEdit = (note: TaskNote) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const startEditTitle = () => {
    setTempTitle(config.title);
    setEditingTitle(true);
  };

  const saveTitle = () => {
    if (tempTitle.trim()) {
      updateConfig({ ...config, title: tempTitle.trim() });
    }
    setEditingTitle(false);
  };

  const cancelEditTitle = () => {
    setEditingTitle(false);
    setTempTitle('');
  };

  const handleSearchResultClick = (result: SearchResult) => {
    // Switch to the tab containing the note
    if (config.activeTabId !== result.tab.id) {
      updateConfig({ ...config, activeTabId: result.tab.id });
    }
    
    // Bring the note to front and scroll to it
    const newZIndex = Math.min(maxZIndex + 1, 50);
    const newNotes = notes.map(note =>
      note.id === result.note.id ? { ...note, zIndex: newZIndex } : note
    );
    updateNotesAndSave(newNotes, newZIndex);

    // Scroll to the note position
    setTimeout(() => {
      if (dashboardRef.current) {
        const noteElement = document.querySelector(`[data-note-id="${result.note.id}"]`);
        if (noteElement) {
          noteElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center', 
            inline: 'center' 
          });
        } else {
          // Fallback: scroll to note position
          dashboardRef.current.scrollTo({
            left: Math.max(0, result.note.position.x - 200),
            top: Math.max(0, result.note.position.y - 200),
            behavior: 'smooth'
          });
        }
      }
    }, 100);

    // Close search
    setIsSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="h-screen w-full relative overflow-hidden bg-gray-50">
      {/* Header toolbar */}
      <div className="relative z-50 px-4 py-3 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            {editingTitle ? (
              <>
                <Input
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="text-gray-900 bg-white border-gray-300 h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveTitle();
                    if (e.key === 'Escape') cancelEditTitle();
                  }}
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={saveTitle}
                  className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                >
                  <Check className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={cancelEditTitle}
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                >
                  <X className="w-3 h-3" />
                </Button>
              </>
            ) : (
              <>
                <h1 
                  className="text-gray-900 cursor-pointer hover:text-blue-600 transition-colors text-xl font-semibold"
                  onClick={startEditTitle}
                >
                  {config.title}
                </h1>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={startEditTitle}
                  className="h-5 w-5 p-0 opacity-0 hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Export data button */}
            <Button
              onClick={exportData}
              size="sm"
              variant="ghost"
              className="gap-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 h-8 px-3 text-sm"
              title="导出备份数据"
            >
              <Download className="w-4 h-4" />
              导出
            </Button>

            {/* Search bar */}
            <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 h-8 px-3 text-sm"
                  onClick={() => {
                    setIsSearchOpen(true);
                    setTimeout(() => searchInputRef.current?.focus(), 100);
                  }}
                >
                  <Search className="w-4 h-4" />
                  搜索
                  <span className="text-xs text-gray-400 ml-1">⌘K</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-80 p-0 bg-white border-gray-200" 
                align="end"
                side="bottom"
              >
                <div className="border-b border-gray-200 p-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      ref={searchInputRef}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜索便签..."
                      className="pl-8 bg-white border-gray-300 text-gray-900 text-sm h-8"
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }
                      }}
                    />
                  </div>
                </div>
                
                {searchResults.length > 0 && (
                  <div className="max-h-64 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <button
                        key={`${result.note.id}-${index}`}
                        onClick={() => handleSearchResultClick(result)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-start gap-2">
                          <StickyNote className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-gray-900 text-sm font-medium truncate">
                                {result.note.title || '无标题便签'}
                              </span>
                              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">
                                {result.tab.name}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 truncate">
                              {result.matchType === 'title' ? '标题匹配' : result.preview}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {searchQuery.trim() && searchResults.length === 0 && (
                  <div className="px-3 py-4 text-center text-gray-500 text-sm">
                    未找到匹配 "{searchQuery}" 的便签
                  </div>
                )}
                
                {!searchQuery.trim() && (
                  <div className="px-3 py-4 text-center text-gray-500 text-sm">
                    开始输入来搜索便签...
                  </div>
                )}
              </PopoverContent>
            </Popover>
            
            <Button
              onClick={addEmptyNote}
              size="sm"
              className="gap-1 bg-blue-600 hover:bg-blue-700 text-white h-8 px-3 text-sm"
            >
              <Plus className="w-4 h-4" />
              添加便签
            </Button>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div 
        className="relative z-40 bg-white/90 backdrop-blur-sm border-b border-gray-200"
        onMouseEnter={() => setIsTabAreaHovered(true)}
        onMouseLeave={() => setIsTabAreaHovered(false)}
      >
        <div className="flex items-center px-4 py-2">
          <div className="flex items-center gap-1 flex-1 overflow-x-auto">
            {tabs.map(tab => (
              <TabButton
                key={tab.id}
                tab={tab}
                isActive={config.activeTabId === tab.id}
                isEditing={editingTabId === tab.id}
                tempName={tempTabName}
                onSetTempName={setTempTabName}
                onActivate={() => updateConfig({ ...config, activeTabId: tab.id })}
                onStartEdit={() => startEditTab(tab.id)}
                onSaveEdit={saveTabName}
                onCancelEdit={cancelEditTab}
                onDelete={() => deleteTab(tab.id)}
                onMoveNote={moveNoteToTab}
                canDelete={tabs.length > 1}
              />
            ))}
          </div>
          
          {isTabAreaHovered && (
            <Button
              onClick={addNewTab}
              size="sm"
              variant="ghost"
              className="ml-2 gap-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex-shrink-0 h-7 px-2 text-xs transition-opacity"
            >
              <Plus className="w-3 h-3" />
              新建标签
            </Button>
          )}
        </div>
      </div>

      {/* Notes area with grid background */}
      <div
        ref={(node) => {
          if (dashboardRef && typeof dashboardRef === 'object' && 'current' in dashboardRef) {
            (dashboardRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }
          if (node) drop(node);
        }}
        className="relative flex-1 overflow-auto"
        style={{ 
          height: 'calc(100vh - 120px)',
          backgroundImage: `
            linear-gradient(to right, rgb(229 231 235 / 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(229 231 235 / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
        }}
      >
        {/* Notes container */}
        <div 
          className="relative"
          style={{
            width: Math.max(notesExtent.width, typeof window !== 'undefined' ? window.innerWidth : 1200),
            height: Math.max(notesExtent.height, typeof window !== 'undefined' ? window.innerHeight - 120 : 800),
          }}
        >
          {activeNotes.map(note => (
            <div key={note.id} data-note-id={note.id}>
              <TaskNoteCard
                note={note}
                allNotes={notes}
                onEdit={() => handleEdit(note)}
                onDelete={() => deleteNote(note.id)}
                onBringToFront={() => bringToFront(note.id)}
                onWidthChange={(width) => updateNoteWidth(note.id, width)}
                onToggleCollapsed={() => toggleNoteCollapsed(note.id)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Edit note modal */}
      {editingNote && (
        <EditTaskNoteModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onSubmit={(title, lines) => updateNote(editingNote.id, { title, lines })}
          initialTitle={editingNote.title || ''}
          initialLines={editingNote.lines}
          allNotes={notes.filter(n => n.id !== editingNote.id)}
        />
      )}
    </div>
  );
}

// Tab button component with drag-and-drop support
interface TabButtonProps {
  tab: Tab;
  isActive: boolean;
  isEditing: boolean;
  tempName: string;
  onSetTempName: (name: string) => void;
  onActivate: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onMoveNote: (noteId: string, tabId: string) => void;
  canDelete: boolean;
}

function TabButton({ 
  tab, 
  isActive, 
  isEditing, 
  tempName, 
  onSetTempName, 
  onActivate, 
  onStartEdit, 
  onSaveEdit, 
  onCancelEdit, 
  onDelete,
  onMoveNote,
  canDelete 
}: TabButtonProps) {
  const dropRef = useRef<HTMLDivElement>(null);
  const [{ isOver }, drop] = useDrop({
    accept: 'note',
    drop: (item: { id: string; type: string }) => {
      if (item.type === 'note') {
        onMoveNote(item.id, tab.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  drop(dropRef);

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-t border-b-2 border-blue-500">
        <Input
          value={tempName}
          onChange={(e) => onSetTempName(e.target.value)}
          className="h-6 text-xs bg-white border-gray-300 text-gray-900 px-2"
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSaveEdit();
            if (e.key === 'Escape') onCancelEdit();
          }}
          autoFocus
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={onSaveEdit}
          className="h-5 w-5 p-0 text-green-600 hover:text-green-700"
        >
          <Check className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancelEdit}
          className="h-5 w-5 p-0 text-red-600 hover:text-red-700"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <div
      ref={dropRef}
      className={`group flex items-center gap-1 px-3 py-1 rounded-t cursor-pointer transition-all ${
        isActive 
          ? 'bg-gray-100 text-gray-900 border-b-2 border-blue-500' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      } ${isOver ? 'bg-blue-100 border-b-2 border-blue-400' : ''}`}
      onClick={onActivate}
    >
      <span className="text-sm select-none">{tab.name}</span>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-white border-gray-200">
          <DropdownMenuItem 
            onClick={onStartEdit}
            className="text-gray-700 hover:text-gray-900 hover:bg-gray-50"
          >
            <Edit2 className="w-3 h-3 mr-2" />
            重命名
          </DropdownMenuItem>
          {canDelete && (
            <>
              <DropdownMenuSeparator className="bg-gray-200" />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem 
                    onSelect={(e) => e.preventDefault()}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3 mr-2" />
                    删除
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white border-gray-200">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-gray-900">删除标签</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-600">
                      确定要删除标签 "{tab.name}" 吗？此标签中的所有便签将被移动到第一个可用标签中。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-gray-100 text-gray-700 hover:bg-gray-200">取消</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700 text-white">
                      删除标签
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function TaskNotesDashboard() {
  return (
    <DndProvider backend={HTML5Backend}>
      <TaskNotesDashboardInner />
    </DndProvider>
  );
}
