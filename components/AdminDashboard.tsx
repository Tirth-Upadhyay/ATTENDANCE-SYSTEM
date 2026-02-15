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
  
  const onlineCount = useMemo(() => members.filter(m => m.currentLocation).length, [members]);
  const verifiedCount = useMemo(() => members.filter(m => m.attendance.includes(sessionKey)).length, [members, sessionKey]);

  return (
    <div className="flex flex-col h-full lg:flex-row overflow-hidden bg-slate-950">
      <aside className="w-full lg:w-72 bg-slate-900 border-r border-slate-800 p-6 flex-shrink-0 flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase mb-1">HQ Command</h1>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Fleet monitoring v12</p>
        </div>

        <nav className="space-y-2 flex-1">
          {[
            { id: 'map', label: 'Tactical Map' },
            { id: 'sheet', label: 'Personnel List' },
            { id: 'inventory', label: 'Gear Tracker' },
            { id: 'chat', label: 'Mesh Comms' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full text-left px-5 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-500">Live Signals</span>
            <span className="text-emerald-500 font-black">{onlineCount}</span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-slate-500">Verified (S{selectedSession})</span>
            <span className="text-indigo-500 font-black">{verifiedCount} / {members.length}</span>
          </div>
        </div>
      </aside>

      <section className="flex-1 relative flex flex-col overflow-hidden">
        {/* Header Controls */}
        <div className="h-16 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between px-8 backdrop-blur-md">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                 <span className="text-[8px] font-black text-slate-500 uppercase">Day</span>
                 <div className="flex bg-slate-800 p-1 rounded-lg">
                   {[1,2,3].map(d => (
                     <button key={d} onClick={() => setSelectedDay(d)} className={`px-3 py-1 rounded-md text-[9px] font-black transition-all ${selectedDay === d ? 'bg-indigo-600' : ''}`}>{d}</button>
                   ))}
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-[8px] font-black text-slate-500 uppercase">Session</span>
                 <div className="flex bg-slate-800 p-1 rounded-lg">
                   {[1,2,3,4].map(s => (
                     <button key={s} onClick={() => setSelectedSession(s)} className={`px-3 py-1 rounded-md text-[9px] font-black transition-all ${selectedSession === s ? 'bg-white text-slate-900' : ''}`}>{s}</button>
                   ))}
                 </div>
              </div>
           </div>
        </div>

        <div className="flex-1 relative">
           {activeTab === 'map' && <MapTracker members={members} activeSessionKey={sessionKey} />}
           {activeTab === 'sheet' && <AttendanceSheet users={users} workUpdates={workUpdates} equipments={equipments} forcedDay={selectedDay} forcedSession={selectedSession} />}
           {activeTab === 'inventory' && <div className="p-8 h-full overflow-auto"><EquipmentManager equipments={equipments} users={users} onUpdate={onUpdateEquipment} onRegister={onRegisterEquipment} isAdmin={true} /></div>}
           {activeTab === 'chat' && <ChatSystem messages={messages} onSendMessage={onSendMessage} currentUserId={adminId} targets={members} />}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;