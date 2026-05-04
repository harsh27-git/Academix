import React from 'react';
import { Task, Note, Group } from '../types';
import { format, isToday, parseISO } from 'date-fns';
import { CheckCircle2, ChevronRight, FileText, Calendar as CalIcon, ArrowRight, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

import { User as FirebaseUser } from 'firebase/auth';

interface DashboardProps {
  tasks: Task[];
  notes: Note[];
  groups: Group[];
  user: FirebaseUser | null;
  onNavigate: (view: any) => void;
  onToggleTask: (id: string) => void;
  onAddTask: (task: any) => void;
}

export default function Dashboard({ tasks, notes, groups, user, onNavigate, onToggleTask, onAddTask }: DashboardProps) {
  const todayTasks = tasks.filter(t => isToday(parseISO(t.dueDate)));
  const completedTodayCount = todayTasks.filter(t => t.completed).length;
  const totalTodayCount = todayTasks.length;
  const dailyProgress = totalTodayCount > 0 ? (completedTodayCount / totalTodayCount) * 100 : 0;
  
  const incompleteTodayCount = todayTasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;

  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Student';

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Good morning, {firstName}.</h1>
          <p className="text-slate-500">You have {incompleteTodayCount} tasks due today and {groups.length} group modules.</p>
        </div>

        <div className="flex items-center gap-8 w-full md:w-auto">
          {totalTodayCount > 0 && (
            <div className="flex flex-col items-end flex-1 md:flex-initial">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 px-1">Daily Completion</span>
              <div className="flex items-center gap-3 w-full md:w-48">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${dailyProgress}%` }}
                    transition={{ type: "spring", stiffness: 50, damping: 20 }}
                    className="h-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.3)]"
                  />
                </div>
                <span className="text-sm font-bold text-slate-700 min-w-[2.5rem] text-right">{Math.round(dailyProgress)}%</span>
              </div>
            </div>
          )}

          <button 
            onClick={() => onNavigate('tasks')}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
          >
            <Plus size={16} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 min-h-0">
        {/* Left: To-Do List */}
        <div className="col-span-7 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[400px]">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-800">Today's Priorities</h2>
            <button 
              onClick={() => onNavigate('tasks')}
              className="text-xs text-indigo-600 font-semibold cursor-pointer hover:underline"
            >
              View All
            </button>
          </div>
          <div className="flex-1 p-4 space-y-3">
            {/* Quick Add Task */}
            <div className="px-2 mb-2">
              <div className="relative group">
                <input 
                  type="text" 
                  placeholder="Quick add a task for today..."
                  className="w-full pl-10 pr-12 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:bg-white focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      const title = e.currentTarget.value.trim();
                      e.currentTarget.value = '';
                      onAddTask({
                        title,
                        dueDate: format(new Date(), 'yyyy-MM-dd'),
                        priority: 'medium'
                      });
                    }
                  }}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <Plus size={18} />
                </div>
                <button 
                  onClick={(e) => {
                    const input = (e.currentTarget.previousSibling?.previousSibling as HTMLInputElement);
                    if (input.value.trim()) {
                      onAddTask({
                        title: input.value.trim(),
                        dueDate: format(new Date(), 'yyyy-MM-dd'),
                        priority: 'medium'
                      });
                      input.value = '';
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {todayTasks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 italic text-sm py-12 border-2 border-dashed border-slate-50 rounded-2xl mx-2">
                <Plus size={24} className="mb-2 opacity-20" />
                <p>No priorities set for today.</p>
                <button 
                  onClick={() => onNavigate('tasks')}
                  className="mt-4 text-indigo-600 font-bold text-xs hover:underline flex items-center gap-1"
                >
                  <Plus size={12} /> Add your first task
                </button>
              </div>
            ) : (
              [...todayTasks].sort((a, b) => a.completed === b.completed ? 0 : a.completed ? 1 : -1).slice(0, 6).map(task => (
                <motion.div 
                  layout
                  key={task.id}
                  onClick={() => onToggleTask(task.id)}
                  className={cn(
                    "flex items-center gap-4 p-3 border border-transparent rounded-xl transition-all cursor-pointer group",
                    task.completed ? "bg-slate-50 opacity-60" : "hover:bg-slate-50 hover:border-slate-100"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                    task.completed 
                      ? "bg-indigo-600 border-indigo-600 text-white" 
                      : "border-slate-300 group-hover:border-indigo-400"
                  )}>
                    {task.completed && <CheckCircle2 size={12} strokeWidth={3} />}
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      "text-sm font-semibold transition-all",
                      task.completed ? "text-slate-400 line-through" : "text-slate-700"
                    )}>
                      {task.title}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                      {groups.find(g => g.id === task.groupId)?.name || 'General'}
                    </p>
                  </div>
                  <span className={cn(
                    "px-2 py-1 text-[10px] font-bold rounded uppercase tracking-tighter",
                    task.completed ? "bg-slate-100 text-slate-400" : (
                      task.priority === 'high' ? "bg-rose-50 text-rose-600" : 
                      task.priority === 'medium' ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-600"
                    )
                  )}>
                    {task.priority}
                  </span>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Right Area */}
        <div className="col-span-5 flex flex-col gap-6">
          {/* Calendar Widget Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-slate-800">{format(new Date(), 'MMMM yyyy')}</h3>
              <div className="flex gap-1 text-slate-400">
                <CalIcon size={16} />
              </div>
            </div>
            <div className="grid grid-cols-7 gap-y-2 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">
              <div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div><div>Su</div>
            </div>
            <div className="grid grid-cols-7 gap-y-2 text-center text-sm font-medium">
               {[...Array(31)].map((_, i) => (
                 <div key={i} className={cn(
                   "py-1.5 rounded-lg transition-all",
                   i + 1 === new Date().getDate() ? "bg-indigo-600 text-white font-bold" : "hover:bg-slate-50 text-slate-600"
                 )}>
                   {i + 1}
                 </div>
               ))}
            </div>
          </div>

          {/* Group Activities Wrap */}
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
            <h3 className="text-sm font-bold mb-4 text-slate-800">Group Modules</h3>
            <div className="space-y-3">
              {groups.map(group => {
                const groupTasks = tasks.filter(t => t.groupId === group.id);
                const groupCompleted = groupTasks.filter(t => t.completed).length;
                const groupProgress = groupTasks.length > 0 ? (groupCompleted / groupTasks.length) * 100 : 0;

                return (
                  <div key={group.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }}></span>
                        <p className="text-xs font-bold text-slate-800">{group.name}</p>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{Math.round(groupProgress)}%</span>
                    </div>
                    
                    <div className="h-1 bg-slate-200 rounded-full overflow-hidden mb-3">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${groupProgress}%` }}
                        className="h-full bg-indigo-500/50"
                        style={{ backgroundColor: group.color }}
                      />
                    </div>

                    <p className="text-[10px] text-slate-500 flex items-center gap-2">
                      <FileText size={10} />
                      {notes.filter(n => n.groupId === group.id).length} notes shared
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
