/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import CalendarView from './components/CalendarView';
import NotesView from './components/NotesView';
import Auth from './components/Auth';
import { View, Task, Group, Note } from './types';
import { format } from 'date-fns';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  // Notification Permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Reminder Checker
  useEffect(() => {
    if (!user || tasks.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      
      tasks.forEach(task => {
        if (!task.completed && task.reminderTime && !task.notified) {
          const reminderTime = new Date(task.reminderTime).getTime();
          
          if (now >= reminderTime) {
            // Trigger notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Task Reminder', {
                body: task.title,
                icon: '/favicon.ico'
              });
            } else {
              // Fallback for when notifications are not allowed or supported
              console.log('Reminder:', task.title);
            }

            // Mark as notified in database to prevent repeated notifications
            updateDoc(doc(db, 'tasks', task.id), {
              notified: true,
              updatedAt: serverTimestamp()
            }).catch(err => console.error('Error marking task as notified:', err));
          }
        }
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [user, tasks]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Firestore Listeners
  useEffect(() => {
    if (!user) return;

    const tasksUnsub = onSnapshot(
      query(collection(db, 'tasks'), where('userId', '==', user.uid), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setTasks(snapshot.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          } as unknown as Task;
        }));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'tasks')
    );

    const groupsUnsub = onSnapshot(
      query(collection(db, 'groups'), where('userId', '==', user.uid), orderBy('createdAt', 'asc')),
      (snapshot) => {
        setGroups(snapshot.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          } as unknown as Group;
        }));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'groups')
    );

    const notesUnsub = onSnapshot(
      query(collection(db, 'notes'), where('userId', '==', user.uid), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setNotes(snapshot.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          } as unknown as Note;
        }));
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'notes')
    );

    return () => {
      tasksUnsub();
      groupsUnsub();
      notesUnsub();
    };
  }, [user]);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  // Handlers
  const handleLogout = () => signOut(auth);

  const handleAddTask = async (task: Omit<Task, 'id' | 'completed'>) => {
    if (!user) return;
    try {
      const payload: any = {
        title: task.title,
        dueDate: task.dueDate,
        priority: task.priority,
        completed: false,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      if (task.groupId) payload.groupId = task.groupId;
      if (task.reminderTime) payload.reminderTime = task.reminderTime;
      if (task.notified !== undefined) payload.notified = task.notified;

      await addDoc(collection(db, 'tasks'), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'tasks');
    }
  };

  const handleToggleTask = async (id: string) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;
      await updateDoc(doc(db, 'tasks', id), {
        completed: !task.completed,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `tasks/${id}`);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'tasks', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `tasks/${id}`);
    }
  };

  const handleAddGroup = async (name: string, color: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'groups'), {
        name,
        color,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'groups');
    }
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      // Note: Ideally we should delete associated notes and tasks or update them
      // For now, just deleting the group
      await deleteDoc(doc(db, 'groups', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `groups/${id}`);
    }
  };

  const handleAddNote = async (groupId: string, title: string, content: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'notes'), {
        groupId,
        title,
        content,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'notes');
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notes', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `notes/${id}`);
    }
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard tasks={tasks} notes={notes} groups={groups} user={user} onNavigate={setActiveView} onToggleTask={handleToggleTask} onAddTask={handleAddTask} />;
      case 'tasks':
        return (
          <TaskList 
            tasks={tasks} 
            onAddTask={handleAddTask} 
            onToggleTask={handleToggleTask} 
            onDeleteTask={handleDeleteTask} 
            groups={groups} 
          />
        );
      case 'calendar':
        return <CalendarView tasks={tasks} onAddTask={handleAddTask} />;
      case 'notes':
        return (
          <NotesView 
            groups={groups} 
            notes={notes} 
            onAddGroup={handleAddGroup} 
            onAddNote={handleAddNote} 
            onDeleteNote={handleDeleteNote}
            onDeleteGroup={handleDeleteGroup}
          />
        );
      default:
        return <Dashboard tasks={tasks} notes={notes} groups={groups} user={user} onNavigate={setActiveView} onToggleTask={handleToggleTask} onAddTask={handleAddTask} />;
    }
  };

  return (
    <div className="flex bg-[#F9FAFB] min-h-screen">
      <Sidebar activeView={activeView} onViewChange={setActiveView} onLogout={handleLogout} user={user} />
      <main className="flex-1 p-8 overflow-y-auto h-screen">
        {renderView()}
      </main>
    </div>
  );
}


