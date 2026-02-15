import React, { useState, useMemo } from 'react';
import { User, Equipment, ChatMessage, WorkUpdate, Role } from '../types';
import MapTracker from './MapTracker';
import AttendanceSheet from './AttendanceSheet';
import EquipmentManager from './EquipmentManager';
import ChatSystem from './ChatSystem';

interface AdminDashboardProps {
  users: User[];
  equipments: Equipment[];
  messages: ChatMessage[];
  workUpdates: WorkUpdate[];
  onUpdateEquipment: (eq: Equipment) => void;
  onRegisterEquipment: (name: string, sn: string, memberId: string) => void;
  onSendMessage: (senderId: string, receiverId: string, text: string) => void;
  adminId: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  users, equipments, messages, workUpdates,
  onUpdateEquipment, onRegisterEquipment, onSendMessage, adminId
}) => {
  const [activeTab, setActiveTab] = useState<'map' | 'sheet' | 'inventory' | 'chat'>('map');
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedSession, setSelectedSession] = useState(1);

  const sessionKey = `D${selectedDay}S${selectedSession}`;
  const members = useMemo(() => users.filter(u => u.role === Role.MEMBER), [users]);
  
  const onlineCount = useMemo(() => members.filter(m => m.status === 'Online').length, [members]);
  const verifiedCount = useMemo(() => members.filter(m => m.attendance.includes(sessionKey)).length, [members, sessionKey]);

  return (
    <div className="flex flex-col h-full lg:flex-row overflow-hidden bg-slate-950">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full lg:w-72 bg-slate-900 border-r border-slate-800 p-6 flex-shrink-0 flex flex-col shadow-2xl z-20">
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-1">
             <div className="w-3 h-3 bg-indigo-500 rounded-sm rotate-45"></div>
             <h1 className="text-xl font-black text-white tracking-tighter uppercase">BCS MEDIA</h1>
          </div>
          <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em]">COMMAND CENTER V15</p>
        </div>

        <nav className="space-y-3 flex-1">
          {[
            { id: 'map', label: 'Tactical Map', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
            { id: 'sheet', label: 'Data Registry', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
            { id: 'inventory', label: 'Gear Inventory', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
            { id: 'chat', label: 'Comms Channel', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all group ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]' 
                  : 'text-slate-500 hover:text-white hover:bg-slate-800'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto p-5 bg-slate-950 rounded-[2rem] border border-slate-800 space-y-4">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Sector Health</span>
            <div className="flex justify-between items-end">
              <span className="text-[10px] text-slate-400 font-bold">Active Units</span>
              <span className="text-emerald-500 font-black text-sm">{onlineCount}</span>
            </div>
            <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
               <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${(onlineCount / members.length) * 100}%` }}></div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <section className="flex-1 relative flex flex-col overflow-hidden">
        {/* TACTICAL HEADER */}
        <div className="h-20 bg-slate-900/40 border-b border-slate-800 flex items-center justify-between px-10 backdrop-blur-3xl z-10">
           <div>
             <h2 className="text-xl font-black text-white uppercase tracking-tighter">Tactical Overlay</h2>
             <p className="text-[9px] text-slate-500 font-mono font-bold uppercase">Node: D{selectedDay}S{selectedSession} // View_Active</p>
           </div>
           
           <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active View Day</span>
                 <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                   {[1,2,3].map(d => (
                     <button key={d} onClick={() => setSelectedDay(d)} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${selectedDay === d ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600 hover:text-white'}`}>D{d}</button>
                   ))}
                 </div>
              </div>
              <div className="flex items-center gap-3">
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active View Session</span>
                 <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                   {[1,2,3,4].map(s => (
                     <button key={s} onClick={() => setSelectedSession(s)} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${selectedSession === s ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-600 hover:text-white'}`}>S{s}</button>
                   ))}
                 </div>
              </div>
              <div className="flex flex-col items-end border-l border-slate-800 pl-8">
                <span className="text-[9px] font-black text-slate-500 uppercase">Verified Units Online</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-indigo-500 leading-none">{verifiedCount}</span>
                  <span className="text-[10px] font-black text-slate-600">/ {members.length}</span>
                </div>
              </div>
           </div>
        </div>

        {/* TAB VIEWPORT */}
        <div className="flex-1 relative overflow-hidden">
           {activeTab === 'map' && <MapTracker members={members} activeSessionKey={sessionKey} />}
           {activeTab === 'sheet' && <AttendanceSheet users={users} workUpdates={workUpdates} equipments={equipments} forcedDay={selectedDay} forcedSession={selectedSession} />}
           {activeTab === 'inventory' && <div className="p-10 h-full overflow-auto custom-scrollbar"><EquipmentManager equipments={equipments} users={users} onUpdate={onUpdateEquipment} onRegister={onRegisterEquipment} isAdmin={true} /></div>}
           {activeTab === 'chat' && <ChatSystem messages={messages} onSendMessage={onSendMessage} currentUserId={adminId} targets={members} />}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;