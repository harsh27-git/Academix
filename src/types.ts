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

export interface StudyRoom {
  id: string;
  name: string;
  code: string;
  createdBy: string;
  createdAt: string;
  activeContent?: string;
}

export interface StudyMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface StudyMember {
  id: string; // userId
  name: string;
  lastSeen: string;
}

export type View = 'dashboard' | 'tasks' | 'calendar' | 'notes' | 'study';
