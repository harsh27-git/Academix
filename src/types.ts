export type Priority = 'low' | 'medium' | 'high';

export interface Group {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string;
  priority: Priority;
  groupId?: string;
  reminderTime?: string; // ISO format: yyyy-MM-ddTHH:mm
  notified?: boolean;
}

export interface Note {
  id: string;
  content: string;
  groupId: string;
  title: string;
  createdAt: string;
}

export type View = 'dashboard' | 'tasks' | 'calendar' | 'notes';
