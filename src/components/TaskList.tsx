import React, { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, Calendar as CalIcon } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { Task, Group, Priority } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface TaskListProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'completed'>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  groups: Group[];
}

export default function TaskList({ tasks, onAddTask, onToggleTask, onDeleteTask, groups }: TaskListProps) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [groupId, setGroupId] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [showForm, setShowForm] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('12:00');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    let fullReminderTime = undefined;
    if (reminderEnabled) {
      const reminderDate = new Date(dueDate);
      const [hours, minutes] = reminderTime.split(':');
      reminderDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      fullReminderTime = reminderDate.toISOString();
    }

    onAddTask({ 
      title, 
      dueDate, 
      priority, 
      groupId: groupId || undefined,
      reminderTime: fullReminderTime,
      notified: false,
    });
    setTitle('');
    setShowForm(false);
    setReminderEnabled(false);
  };

  const priorityColors = {
    low: 'bg-slate-50 text-slate-600',
    medium: 'bg-indigo-50 text-indigo-600',
    high: 'bg-red-50 text-red-600',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Task Management</h2>
          <p className="text-slate-500 mt-1 italic">Organize your academic workflow.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          <span>New Task</span>
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="What needs to be done?"
                className="w-full text-lg font-bold border-none focus:ring-0 placeholder:text-slate-300 p-0 text-slate-800"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
              <div className="flex flex-wrap gap-4 items-center border-t border-slate-50 pt-4">
                <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  <CalIcon size={14} className="text-slate-400" />
                  <input
                    type="date"
                    className="bg-transparent border-none focus:ring-0 text-xs text-slate-600 p-0"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <select
                  className="bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 px-3 py-1.5 focus:ring-0"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                >
                  <option value="">No Group</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>

                <div className="flex space-x-2">
                  {(['low', 'medium', 'high'] as Priority[]).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={cn(
                        "px-2.5 py-1 rounded text-[10px] uppercase font-bold transition-all",
                        priority === p ? priorityColors[p] : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <div className="h-6 w-px bg-slate-100 mx-2"></div>

                <button
                  type="button"
                  onClick={() => setReminderEnabled(!reminderEnabled)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-medium",
                    reminderEnabled ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100"
                  )}
                >
                  <Plus size={14} />
                  <span>{reminderEnabled ? format(parseISO(`1970-01-01T${reminderTime}:00`), 'h:mm a') : 'Add Reminder'}</span>
                </button>

                {reminderEnabled && (
                  <input
                    type="time"
                    className="bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-600 px-3 py-1.5 focus:ring-0 font-mono"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                  />
                )}

                <div className="flex-1"></div>
                
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-100"
                >
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Active Tasks</p>
        </div>
        <div className="divide-y divide-slate-50">
          {tasks.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-400 text-sm font-medium">No tasks found.</p>
            </div>
          ) : (
            [...tasks].sort((a, b) => a.completed === b.completed ? 0 : a.completed ? 1 : -1).map((task) => (
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                key={task.id}
                className={cn(
                  "group flex items-center p-4 transition-colors hover:bg-slate-50/50",
                  task.completed && "opacity-60 bg-slate-50/20"
                )}
              >
                <button
                  onClick={() => onToggleTask(task.id)}
                  className={cn(
                    "mr-4 w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                    task.completed 
                      ? "bg-indigo-600 border-indigo-600 text-white" 
                      : "border-slate-300 hover:border-indigo-400"
                  )}
                >
                  {task.completed && <CheckCircle2 size={12} strokeWidth={3} />}
                </button>
                
                <div className="flex-1">
                  <h3 className={cn(
                    "text-sm font-semibold text-slate-700 transition-all",
                    task.completed && "line-through text-slate-400"
                  )}>
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                      {groups.find(g => g.id === task.groupId)?.name || 'General'} • {format(parseISO(task.dueDate), 'MMM d')}
                    </p>
                    {task.reminderTime && (
                      <div className="flex items-center gap-1 text-[9px] font-bold text-indigo-400 bg-indigo-50/50 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                        <Plus size={8} />
                        Reminder: {format(new Date(task.reminderTime), 'h:mm a')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-tighter", priorityColors[task.priority])}>
                    {task.priority}
                  </span>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
