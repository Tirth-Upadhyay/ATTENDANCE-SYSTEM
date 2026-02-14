
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, User } from '../types';

interface ChatSystemProps {
  messages: ChatMessage[];
  onSendMessage: (senderId: string, receiverId: string, text: string) => void;
  currentUserId: string;
  targets: User[];
  isMemberMode?: boolean;
}

const ChatSystem: React.FC<ChatSystemProps> = ({ messages, onSendMessage, currentUserId, targets, isMemberMode }) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string | undefined>(targets[0]?.id);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedTargetId]);

  useEffect(() => {
    if (!selectedTargetId && targets.length > 0) {
      setSelectedTargetId(targets[0].id);
    }
  }, [targets, selectedTargetId]);

  const conversation = messages.filter(m => 
    (m.senderId === currentUserId && m.receiverId === selectedTargetId) ||
    (m.senderId === selectedTargetId && m.receiverId === currentUserId)
  );

  const handleSend = () => {
    if (inputText.trim() && selectedTargetId) {
      onSendMessage(currentUserId, selectedTargetId, inputText);
      setInputText('');
    }
  };

  const getTacticalIcon = (dept: string, isOnline: boolean) => {
    const baseDept = dept.split(' ')[0];
    const colorClass = isOnline ? 'text-emerald-400' : 'text-slate-500 opacity-40';
    
    if (baseDept === 'Photographers') {
      return <svg className={`w-full h-full ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;
    }
    if (baseDept === 'Videographers') {
      return <svg className={`w-full h-full ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>;
    }
    if (baseDept === 'Operations') {
      return <svg className={`w-full h-full ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>;
    }
    return <svg className={`w-full h-full ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>;
  };

  return (
    <div className="flex h-full min-h-[400px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {!isMemberMode && (
        <div className="w-1/3 border-r border-slate-800 bg-slate-900 overflow-auto custom-scrollbar">
          <div className="p-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 bg-slate-900/50 sticky top-0 z-10">Sector Personal</div>
          {targets.map(target => {
            const lastMsg = messages.filter(m => 
              (m.senderId === currentUserId && m.receiverId === target.id) ||
              (m.senderId === target.id && m.receiverId === currentUserId)
            ).pop();

            return (
              <button
                key={target.id}
                onClick={() => setSelectedTargetId(target.id)}
                className={`w-full p-4 flex items-center gap-4 text-left border-b border-slate-800/50 transition-all ${
                  selectedTargetId === target.id ? 'bg-indigo-600/10 border-l-4 border-l-indigo-600' : 'hover:bg-slate-800/50'
                }`}
              >
                <div className="relative">
                  <div className={`w-10 h-10 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center p-2 ${target.status === 'Online' ? 'border-emerald-500/30' : ''}`}>
                    {getTacticalIcon(target.department, target.status === 'Online')}
                  </div>
                  {target.status === 'Online' && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <div className="text-[11px] font-black text-slate-200 truncate uppercase tracking-tight">{target.name}</div>
                    {lastMsg && <span className="text-[8px] font-mono text-slate-500">{new Date(lastMsg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>}
                  </div>
                  <div className="text-[9px] text-slate-500 truncate italic font-medium">
                    {lastMsg ? lastMsg.text : 'Sector idle...'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex-1 flex flex-col bg-slate-950">
        {selectedTargetId ? (
          <>
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/30 backdrop-blur-md">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-700 flex items-center justify-center p-1.5">
                    {getTacticalIcon(targets.find(t => t.id === selectedTargetId)?.department || 'Default', targets.find(t => t.id === selectedTargetId)?.status === 'Online')}
                 </div>
                 <div>
                   <span className="text-[11px] font-black text-white uppercase tracking-wider block leading-none">{targets.find(t => t.id === selectedTargetId)?.name}</span>
                   <span className="text-[8px] font-bold text-slate-500 uppercase mt-1 block">{targets.find(t => t.id === selectedTargetId)?.department}</span>
                 </div>
               </div>
               <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">LIVE_LINK</span>
               </div>
            </div>

            <div ref={scrollRef} className="flex-1 p-6 overflow-auto space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_center,_rgba(30,41,59,0.2)_0%,_transparent_100%)]">
              {conversation.map(msg => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] px-5 py-3 rounded-2xl text-[12px] shadow-2xl relative ${
                    msg.senderId === currentUserId 
                      ? 'bg-indigo-600 text-white rounded-br-none border border-indigo-400/20' 
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                  }`}>
                    <p className="leading-relaxed font-medium">{msg.text}</p>
                    <div className={`text-[7px] mt-2 font-mono ${msg.senderId === currentUserId ? 'text-indigo-200/60 text-right' : 'text-slate-600'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {conversation.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4 opacity-40">
                  <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em]">Establish Comms Link</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-900/50 border-t border-slate-800">
              <div className="flex gap-3">
                <input 
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Transmit message..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-6 py-4 text-xs text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                />
                <button 
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="w-14 h-14 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex-shrink-0"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-700 bg-slate-950 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(79,70,229,0.05)_0%,_transparent_100%)]"></div>
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center mb-6 animate-[spin_20s_linear_infinite]">
              <svg className="w-10 h-10 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] relative z-10">Select Personnel for Uplink</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSystem;
