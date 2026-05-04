import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  getDocs,
  setDoc,
  deleteDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { StudyRoom, StudyMessage, StudyMember } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Send, 
  LogOut, 
  Copy, 
  Check, 
  MessageSquare, 
  Code,
  Shield,
  ArrowLeft,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface StudyBoardProps {
  user: FirebaseUser;
}

export default function StudyBoard({ user }: StudyBoardProps) {
  const [room, setRoom] = useState<StudyRoom | null>(null);
  const [messages, setMessages] = useState<StudyMessage[]>([]);
  const [members, setMembers] = useState<StudyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lobby state
  const [lobbyMode, setLobbyMode] = useState<'options' | 'create' | 'join'>('options');
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [userName, setUserName] = useState(user.displayName || 'Anonymous');

  // Room state
  const [newMessage, setNewMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // 1. Presence & Cleanup
  useEffect(() => {
    if (!room || !user) return;

    const memberDocRef = doc(db, 'studyRooms', room.id, 'members', user.uid);
    
    const updatePresence = async () => {
      try {
        await setDoc(memberDocRef, {
          uid: user.uid,
          name: userName,
          lastSeen: serverTimestamp()
        });
      } catch (err) {
        console.error('Presence error:', err);
      }
    };

    updatePresence();
    const presenceInterval = setInterval(updatePresence, 30000);

    return () => {
      clearInterval(presenceInterval);
      deleteDoc(memberDocRef).catch(console.error);
    };
  }, [room, user, userName]);

  // 2. Real-time Subscriptions
  useEffect(() => {
    if (!room) return;

    // Room Details (for activeContent)
    const roomUnsub = onSnapshot(doc(db, 'studyRooms', room.id), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as StudyRoom;
        setRoom(prev => ({ ...prev!, activeContent: data.activeContent }));
      }
    });

    // Messages
    const messagesUnsub = onSnapshot(
      query(
        collection(db, 'studyRooms', room.id, 'messages'),
        orderBy('createdAt', 'desc'),
        limit(50)
      ),
      (snapshot) => {
        setMessages(snapshot.docs.map(d => ({ 
          id: d.id, 
          ...d.data(),
          createdAt: d.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
        } as StudyMessage)).reverse());
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'messages')
    );

    // Members
    const membersUnsub = onSnapshot(
      collection(db, 'studyRooms', room.id, 'members'),
      (snapshot) => {
        setMembers(snapshot.docs.map(d => ({ 
          id: d.id, 
          ...d.data(),
          lastSeen: d.data().lastSeen?.toDate?.()?.toISOString() || new Date().toISOString()
        } as StudyMember)));
      }
    );

    return () => {
      roomUnsub();
      messagesUnsub();
      membersUnsub();
    };
  }, [room?.id]);

  // Actions
  const handleCreateRoom = async () => {
    if (!roomName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const roomPayload = {
        name: roomName.trim(),
        code,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        activeContent: ''
      };
      const docRef = await addDoc(collection(db, 'studyRooms'), roomPayload);
      setRoom({ id: docRef.id, ...roomPayload, createdAt: new Date().toISOString() });
    } catch (err) {
      setError('Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'studyRooms'), where('code', '==', roomCode.trim().toUpperCase()));
      const snap = await getDocs(q);
      if (snap.empty) {
        setError('Room not found. Check the code.');
        return;
      }
      const roomDoc = snap.docs[0];
      setRoom({ id: roomDoc.id, ...roomDoc.data() } as StudyRoom);
    } catch (err) {
      setError('Error joining room.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !room) return;
    const text = newMessage.trim();
    setNewMessage('');
    try {
      await addDoc(collection(db, 'studyRooms', room.id, 'messages'), {
        roomId: room.id,
        userId: user.uid,
        userName,
        text,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'messages');
    }
  };

  const handleContentChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!room) return;
    const activeContent = e.target.value;
    // Update local state immediately for responsiveness
    setRoom(prev => ({ ...prev!, activeContent }));
    
    try {
      await updateDoc(doc(db, 'studyRooms', room.id), { activeContent });
    } catch (err) {
      console.error('Sync error:', err);
    }
  };

  const copyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!room) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden"
        >
          <div className="p-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 mx-auto">
              <Users size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 text-center mb-2">Group Study Board</h2>
            <p className="text-slate-500 text-center text-sm mb-8">Collaborate in real-time with your study group.</p>

            <AnimatePresence mode="wait">
              {lobbyMode === 'options' && (
                <motion.div 
                  key="options"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-3"
                >
                  <button 
                    onClick={() => setLobbyMode('create')}
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    Create New Room
                  </button>
                  <button 
                    onClick={() => setLobbyMode('join')}
                    className="w-full py-4 bg-white border-2 border-slate-100 text-slate-600 font-bold rounded-2xl hover:border-indigo-200 hover:text-indigo-600 transition-all"
                  >
                    Join with Code
                  </button>
                </motion.div>
              )}

              {lobbyMode === 'create' && (
                <motion.div 
                  key="create"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <button onClick={() => setLobbyMode('options')} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-xs font-bold mb-2">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 block mb-2">My Nickname</label>
                    <input 
                      type="text" 
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 block mb-2">Room Name</label>
                    <input 
                      type="text" 
                      placeholder="Math Study Group..."
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <button 
                    onClick={handleCreateRoom}
                    disabled={loading || !roomName.trim()}
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : 'Create Room'}
                  </button>
                </motion.div>
              )}

              {lobbyMode === 'join' && (
                <motion.div 
                  key="join"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <button onClick={() => setLobbyMode('options')} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-xs font-bold mb-2">
                    <ArrowLeft size={14} /> Back
                  </button>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 block mb-2">My Nickname</label>
                    <input 
                      type="text" 
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 block mb-2">6-Digit Room Code</label>
                    <input 
                      type="text" 
                      placeholder="EX: 4F2G9H"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-mono text-center tracking-[0.5em] text-lg font-bold"
                    />
                  </div>
                  {error && <div className="p-3 bg-rose-50 text-rose-500 text-xs rounded-xl flex items-center gap-2 font-medium">
                    <AlertCircle size={14} /> {error}
                  </div>}
                  <button 
                    onClick={handleJoinRoom}
                    disabled={loading || roomCode.length < 6}
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : 'Join Room'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 -mt-2">
      {/* Room Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
            <Shield size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">{room.name}</h2>
            <div className="flex items-center gap-4 mt-0.5">
              <button 
                onClick={copyCode}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600 transition-all font-bold"
              >
                Room Code: <span className="font-mono text-slate-600">{room.code}</span>
                {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              </button>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <Users size={12} /> {members.length} Online
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => setShowChat(!showChat)}
            className={cn(
              "flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all",
              showChat ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-slate-50 text-slate-500 border border-slate-200"
            )}
          >
            <MessageSquare size={18} />
            <span>Chat</span>
          </button>
          <button 
            onClick={() => setRoom(null)}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-sm font-bold hover:bg-rose-100 transition-all"
          >
            <LogOut size={18} />
            <span>Leave</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
        {/* Collaborative Board */}
        <div className="flex-1 bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative group">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Code size={16} className="text-slate-400" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Shared Study Board</span>
            </div>
            <div className="flex -space-x-2">
              {members.slice(0, 5).map(m => (
                <div 
                  key={m.id} 
                  title={m.name}
                  className="w-7 h-7 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-600 uppercase"
                >
                  {m.name[0]}
                </div>
              ))}
              {members.length > 5 && (
                <div className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">
                  +{members.length - 5}
                </div>
              )}
            </div>
          </div>
          <textarea 
            ref={contentRef}
            value={room.activeContent || ''}
            onChange={handleContentChange}
            placeholder="Type code or notes here for everyone to see..."
            className="flex-1 p-6 font-mono text-sm resize-none focus:outline-none text-slate-700 leading-relaxed bg-slate-20/30"
          />
          <div className="absolute bottom-4 right-4 p-2 bg-indigo-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
             <Code size={16} />
          </div>
        </div>

        {/* Chat Sidebar */}
        <AnimatePresence>
          {showChat && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full max-w-sm bg-white rounded-[24px] border border-slate-200 shadow-sm flex flex-col overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                <MessageSquare size={16} className="text-indigo-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-widest">Group Chat</span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={cn(
                      "flex flex-col max-w-[85%]",
                      msg.userId === user.uid ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">{msg.userName}</span>
                    <div className={cn(
                      "p-3 rounded-2xl text-sm",
                      msg.userId === user.uid 
                        ? "bg-indigo-600 text-white rounded-tr-none" 
                        : "bg-slate-100 text-slate-700 rounded-tl-none"
                    )}>
                      {msg.text}
                    </div>
                    <span className="text-[8px] text-slate-400 mt-1 uppercase font-bold px-1">
                      {format(new Date(msg.createdAt), 'h:mm a')}
                    </span>
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 italic text-xs py-10">
                    <MessageSquare size={24} className="mb-2 opacity-20" />
                    <p>No messages yet.</p>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-slate-50/50">
                <div className="relative">
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 outline-none text-sm transition-all shadow-sm"
                  />
                  <button 
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
