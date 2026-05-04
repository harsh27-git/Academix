import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { Task } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface CalendarProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'completed'>) => void;
}

export default function CalendarView({ tasks, onAddTask }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('12:00');

  const onDateClick = (day: Date) => {
    setSelectedDate(day);
    setNewTaskTitle('');
    setReminderEnabled(false);
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !selectedDate) return;
    
    let fullReminderTime = undefined;
    if (reminderEnabled) {
      const [hours, minutes] = reminderTime.split(':');
      const reminderDate = new Date(selectedDate);
      reminderDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      fullReminderTime = reminderDate.toISOString();
    }

    onAddTask({
      title: newTaskTitle.trim(),
      dueDate: format(selectedDate, 'yyyy-MM-dd'),
      priority: 'medium',
      reminderTime: fullReminderTime,
      notified: false,
    });
    
    setSelectedDate(null);
    setNewTaskTitle('');
    setReminderEnabled(false);
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between px-2 mb-10">
        <div>
          <h2 className="font-display text-4xl font-bold text-slate-900">
            {format(currentMonth, 'MMMM')}
          </h2>
          <p className="text-slate-400 font-medium tracking-widest uppercase text-[10px] mt-1">
            {format(currentMonth, 'yyyy')}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={prevMonth}
            className="p-3 bg-white rounded-full hover:bg-slate-50 transition-colors border border-slate-100 shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={nextMonth}
            className="p-3 bg-white rounded-full hover:bg-slate-50 transition-colors border border-slate-100 shadow-sm"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 mb-2">
        {days.map((day) => (
          <div key={day} className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    const allDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        {allDays.map((date) => {
          const dayTasks = tasks.filter(t => !t.completed && isSameDay(parseISO(t.dueDate), date));
          const isSelected = isSameDay(date, new Date());
          const isCurrentMonth = isSameMonth(date, monthStart);

          return (
            <div
              key={date.toString()}
              className={cn(
                "min-h-[140px] p-3 bg-white transition-all cursor-pointer hover:bg-slate-50/50 group relative",
                !isCurrentMonth && "bg-slate-50/30"
              )}
              onClick={() => onDateClick(date)}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={cn(
                  "text-sm font-medium flex items-center justify-center w-7 h-7 rounded-full",
                  isSelected ? "bg-slate-900 text-white" : isCurrentMonth ? "text-slate-900" : "text-slate-300"
                )}>
                  {format(date, 'd')}
                </span>
                {dayTasks.length > 0 ? (
                  <span className="w-1.5 h-1.5 bg-brand-accent rounded-full"></span>
                ) : (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus size={14} className="text-indigo-500" />
                  </div>
                )}
              </div>
              <div className="space-y-1 overflow-hidden">
                {dayTasks.slice(0, 3).map(task => (
                  <div 
                    key={task.id} 
                    className="text-[10px] py-1 px-2 rounded-md bg-slate-100 text-slate-600 truncate border-l-2 border-slate-400"
                  >
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-[9px] text-slate-400 px-2">
                    + {dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto relative">
      {renderHeader()}
      {renderDays()}
      {renderCells()}

      <AnimatePresence>
        {selectedDate && (
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Add Task</h3>
                    <p className="text-sm text-slate-500">{format(selectedDate, 'MMMM do, yyyy')}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedDate(null)}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 block mb-2">Task Title</label>
                    <input 
                      autoFocus
                      type="text" 
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                      placeholder="What needs to be done?"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all mb-4"
                    />
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                          reminderEnabled ? "bg-indigo-100 text-indigo-600" : "bg-slate-200 text-slate-400"
                        )}>
                          <Plus size={16} />
                        </div>
                        <span className="text-sm font-bold text-slate-700">Set Reminder</span>
                      </div>
                      <button 
                        onClick={() => setReminderEnabled(!reminderEnabled)}
                        className={cn(
                          "w-10 h-5 rounded-full transition-colors relative",
                          reminderEnabled ? "bg-indigo-600" : "bg-slate-300"
                        )}
                      >
                        <motion.div 
                          animate={{ x: reminderEnabled ? 20 : 2 }}
                          className="absolute top-1 left-0 w-3 h-3 bg-white rounded-full shadow-sm"
                        />
                      </button>
                    </div>

                    {reminderEnabled && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="overflow-hidden mt-4 pt-4 border-t border-slate-200"
                      >
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 block mb-2">Reminder Time</label>
                        <input 
                          type="time" 
                          value={reminderTime}
                          onChange={(e) => setReminderTime(e.target.value)}
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all font-mono"
                        />
                        <p className="text-[10px] text-slate-400 mt-2 italic">* Browser notification will trigger at this time.</p>
                      </motion.div>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button 
                    onClick={() => setSelectedDate(null)}
                    className="flex-1 px-6 py-3.5 border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddTask}
                    disabled={!newTaskTitle.trim()}
                    className="flex-1 px-6 py-3.5 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:shadow-none"
                  >
                    Add Task
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
