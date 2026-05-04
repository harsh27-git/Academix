import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, X, Coffee, Brain, Bell } from 'lucide-react';
import { cn } from '../lib/utils';

interface PomodoroTimerProps {
  onClose: () => void;
}

type Mode = 'work' | 'shortBreak' | 'longBreak';

const MODES: Record<Mode, { label: string; duration: number; color: string; icon: React.ReactNode }> = {
  work: { 
    label: 'Focus Time', 
    duration: 25 * 60, 
    color: 'bg-indigo-600', 
    icon: <Brain size={18} /> 
  },
  shortBreak: { 
    label: 'Short Break', 
    duration: 5 * 60, 
    color: 'bg-emerald-500', 
    icon: <Coffee size={18} /> 
  },
  longBreak: { 
    label: 'Long Break', 
    duration: 15 * 60, 
    color: 'bg-amber-500', 
    icon: <Coffee size={18} /> 
  }
};

export default function PomodoroTimer({ onClose }: PomodoroTimerProps) {
  const [mode, setMode] = useState<Mode>('work');
  const [timeLeft, setTimeLeft] = useState(MODES.work.duration);
  const [isActive, setIsActive] = useState(false);

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setTimeLeft(MODES[newMode].duration);
    setIsActive(false);
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(MODES[mode].duration);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Optional: Play sound or show alert
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Timer Finished!', {
          body: `${MODES[mode].label} is over.`,
        });
      }
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((MODES[mode].duration - timeLeft) / MODES[mode].duration) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100"
      >
        {/* Header */}
        <div className="p-6 pb-0 flex justify-between items-center">
          <div className="flex items-center gap-2 text-slate-800">
            {MODES[mode].icon}
            <span className="font-bold tracking-tight">{MODES[mode].label}</span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 flex flex-col items-center">
          {/* Circular Progress (Simplified with background/border) */}
          <div className="relative w-48 h-48 flex items-center justify-center mb-10">
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                className="stroke-slate-100"
                strokeWidth="8"
                fill="none"
              />
              <motion.circle
                cx="96"
                cy="96"
                r="88"
                strokeLinecap="round"
                className={cn("transition-colors duration-500", 
                  mode === 'work' ? "stroke-indigo-600" : 
                  mode === 'shortBreak' ? "stroke-emerald-500" : "stroke-amber-500"
                )}
                strokeWidth="8"
                fill="none"
                initial={{ strokeDasharray: "552.92", strokeDashoffset: "552.92" }}
                animate={{ strokeDashoffset: 552.92 * (1 - progress / 100) }}
                transition={{ type: 'spring', damping: 20, stiffness: 50 }}
              />
            </svg>
            <div className="text-5xl font-black text-slate-900 font-mono tracking-tighter">
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex p-1 bg-slate-100 rounded-2xl gap-1 mb-8">
            {(Object.keys(MODES) as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                  mode === m 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                )}
              >
                {m === 'work' ? 'Work' : m === 'shortBreak' ? 'Short' : 'Long'}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6">
            <button 
              onClick={resetTimer}
              className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-95 border border-slate-100"
            >
              <RotateCcw size={20} />
            </button>
            
            <button 
              onClick={toggleTimer}
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl transition-all active:scale-90",
                MODES[mode].color,
                "shadow-lg ring-8 ring-indigo-50"
              )}
            >
              {isActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} className="translate-x-0.5" fill="currentColor" />}
            </button>

            <div className="w-12 h-12 flex items-center justify-center text-slate-300">
               <Bell size={20} />
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-center">
           <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Pomodoro focus system</p>
        </div>
      </motion.div>
    </div>
  );
}
