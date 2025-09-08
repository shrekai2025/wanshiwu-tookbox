export interface NoteLine {
  id: string;
  content: string;
  type: 'text' | 'url' | 'command' | 'note';
  // For note references
  noteRef?: {
    id: string;
    title: string;
  };
}

export interface Tab {
  id: string;
  name: string;
  order: number;
  createdAt: Date;
}

export interface TaskNote {
  id: string;
  title?: string; // Optional note title
  lines: NoteLine[];
  position: { x: number; y: number };
  width: number; // Note width
  zIndex: number;
  isCollapsed: boolean; // Whether the note is collapsed to show only title
  tabId: string; // Which tab this note belongs to
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardConfig {
  title: string;
  activeTabId: string; // Currently active tab
}

export interface StoredData {
  config: DashboardConfig;
  notes: TaskNote[];
  tabs: Tab[];
  maxZIndex: number;
}

export interface SearchResult {
  note: TaskNote;
  tab: Tab;
  matchType: 'title' | 'content';
  preview: string;
}
