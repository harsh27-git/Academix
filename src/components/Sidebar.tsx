import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  FolderOpen,
  Settings,
  LogOut
} from 'lucide-react';
import { cn } from '../lib/utils';
import { View } from '../types';
import { User as FirebaseUser } from 'firebase/auth';

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
  onLogout: () => void;
  user: FirebaseUser | null;
}

export default function Sidebar({ activeView, onViewChange, onLogout, user }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'notes', label: 'Study Groups', icon: FolderOpen },
  ];

  return (
    <div className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col p-6 sticky top-0">
      <div className="flex items-center gap-2 mb-10 px-2 text-indigo-600">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <div className="w-4 h-4 bg-white rounded-sm"></div>
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900">Academix</span>
      </div>

      <nav className="flex-1 space-y-8">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-4 px-3">Management</p>
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onViewChange(item.id as View)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors cursor-pointer text-sm",
                      isActive 
                        ? "bg-indigo-50 text-indigo-700" 
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <Icon size={18} strokeWidth={2} />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <div className="mt-auto border-t border-slate-100 pt-6 space-y-4">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all text-sm font-medium"
        >
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>

        <div className="flex items-center gap-3 px-1">
          <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-slate-400 font-bold">
             {user?.photoURL ? <img src={user.photoURL} alt="Avatar" /> : (user?.displayName?.[0] || user?.email?.[0] || '?').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{user?.displayName || 'Student'}</p>
            <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

