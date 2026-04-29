import React, { useState } from 'react';
import { Plus, Search, Folder, MoreHorizontal, FileText, Trash2, Tag } from 'lucide-react';
import { Group, Note } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface NotesViewProps {
  groups: Group[];
  notes: Note[];
  onAddGroup: (name: string, color: string) => void;
  onAddNote: (groupId: string, title: string, content: string) => void;
  onDeleteNote: (id: string) => void;
  onDeleteGroup: (id: string) => void;
}

export default function NotesView({ groups, notes, onAddGroup, onAddNote, onDeleteNote, onDeleteGroup }: NotesViewProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(groups[0]?.id || null);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');

  const filteredNotes = selectedGroupId 
    ? notes.filter(n => n.groupId === selectedGroupId)
    : notes;

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    onAddGroup(newGroupName, '#10b981');
    setNewGroupName('');
    setShowAddGroup(false);
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !selectedGroupId) return;
    onAddNote(selectedGroupId, newNoteTitle, newNoteContent);
    setNewNoteTitle('');
    setNewNoteContent('');
    setShowAddNote(false);
  };

  return (
    <div className="grid grid-cols-12 gap-8 h-[calc(100vh-160px)]">
      {/* Groups Sidebar */}
      <div className="col-span-3 flex flex-col space-y-6">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Study Groups</h3>
          <button 
            onClick={() => setShowAddGroup(true)}
            className="p-1 hover:bg-slate-200 rounded-md transition-colors text-slate-500"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="space-y-1 overflow-y-auto pr-2">
          {groups.map(group => (
            <button
              key={group.id}
              onClick={() => setSelectedGroupId(group.id)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm transition-all group",
                selectedGroupId === group.id 
                  ? "bg-white text-slate-900 border border-slate-200 card-shadow" 
                  : "text-slate-500 hover:bg-slate-100"
              )}
            >
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }}></div>
                <span className="font-medium">{group.name}</span>
              </div>
              <span className="text-[10px] py-0.5 px-2 bg-slate-100 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                {notes.filter(n => n.groupId === group.id).length}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence>
          {showAddGroup && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xl"
            >
              <form onSubmit={handleAddGroup} className="space-y-3">
                <input
                  type="text"
                  placeholder="Group Name"
                  className="w-full text-sm border-slate-200 rounded-xl focus:ring-slate-900 focus:border-slate-900"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  autoFocus
                />
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddGroup(false)}
                    className="flex-1 text-xs text-slate-400 font-medium py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-slate-900 text-white text-xs font-semibold py-2 rounded-lg"
                  >
                    Add
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Notes Area */}
      <div className="col-span-9 bg-white rounded-[32px] border border-slate-100 p-8 flex flex-col shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="font-display text-4xl font-bold text-slate-900 italic">
              {groups.find(g => g.id === selectedGroupId)?.name || 'Select a Group'}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Capture your thoughts for this subject.
            </p>
          </div>
          <button
            onClick={() => setShowAddNote(true)}
            className="flex items-center space-x-2 bg-slate-900 text-white px-5 py-2.5 rounded-full font-medium hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95"
          >
            <Plus size={18} />
            <span>New Note</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-4">
          <AnimatePresence>
            {showAddNote && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-50 p-6 rounded-3xl border border-slate-200"
              >
                <form onSubmit={handleAddNote} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Note Title"
                    className="w-full text-xl font-display font-bold bg-transparent border-none focus:ring-0 p-0 text-slate-900 placeholder:text-slate-300"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    autoFocus
                  />
                  <textarea
                    placeholder="Write your note content here..."
                    className="w-full h-32 bg-transparent border-none focus:ring-0 p-0 text-slate-600 placeholder:text-slate-300 resize-none text-sm"
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                  />
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowAddNote(false)}
                      className="text-slate-400 text-sm font-medium px-4 py-2"
                    >
                      Discard
                    </button>
                    <button
                      type="submit"
                      className="bg-brand-accent text-white px-6 py-2 rounded-full text-sm font-semibold hover:opacity-90 shadow-lg shadow-brand-accent/20"
                    >
                      Save Note
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-2 gap-4">
            {filteredNotes.map(note => (
              <motion.div
                layout
                key={note.id}
                className="group p-6 bg-white border border-slate-100 rounded-3xl hover:border-slate-300 transition-all card-shadow flex flex-col h-fit"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
                    <FileText size={20} />
                  </div>
                  <button 
                    onClick={() => onDeleteNote(note.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all rounded-full hover:bg-rose-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <h4 className="font-display text-xl font-bold text-slate-900 mb-2 truncate">
                  {note.title}
                </h4>
                <p className="text-sm text-slate-500 line-clamp-3 mb-6 whitespace-pre-wrap">
                  {note.content}
                </p>
                <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                    {format(new Date(note.createdAt), 'MMM d, h:mm a')}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {filteredNotes.length === 0 && !showAddNote && (
            <div className="h-64 flex flex-col items-center justify-center text-slate-300">
              <Folder size={48} strokeWidth={1} className="mb-4 opacity-50" />
              <p className="text-sm font-medium">No notes in this group yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
