
import React, { useState } from 'react';
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
  users, 
  equipments, 
  messages, 
  workUpdates,
  onUpdateEquipment,
  onRegisterEquipment,
  onSendMessage,
  adminId
}) => {
  const [activeTab, setActiveTab] = useState<'map' | 'sheet' | 'inventory' | 'chat'>('map');
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedSession, setSelectedSession] = useState(1);

  const members = users.filter(u => u.role === Role.MEMBER);
  const sessionKey = `D${selectedDay}S${selectedSession}`;

  // REQUIREMENT: Show all verified (Present + Online) members across all departments
  const activeMembersOnMap = members.filter(m => 
    m.attendance.includes(sessionKey) &&
    m.status === 'Online' && 
    m.currentLocation
  );

  const geofenceViolations = activeMembersOnMap.filter(m => m.currentLocation && !m.isInsideGeofence);

  return (
    <div className="flex flex-col h-screen lg:flex-row bg-slate-950 text-slate-200 overflow-hidden">
      <aside className="w-full lg:w-64 bg-slate-900 border-r border-slate-800 p-6 flex-shrink-0 flex flex-col">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
             <div className="w-3 h-3 bg-indigo-500 rounded-sm animate-pulse"></div>
             <h1 className="text-xl font-black text-white tracking-tighter uppercase">
               BCS MEDIA
             </h1>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Command Center</p>
        </div>

        {/* Global View Controls */}
        <div className="mb-8 p-4 bg-slate-950/50 rounded-2xl border border-slate-800 space-y-4">
           <div className="space-y-1">
             <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Active View Day</span>
             <div className="flex gap-1">
               {[1, 2, 3].map(d => (
                 <button 
                  key={d} 
                  onClick={() => setSelectedDay(d)}
                  className={`flex-1 py-1.5 rounded-md text-[9px] font-black transition-all ${selectedDay === d ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}
                 >D{d}</button>
               ))}
             </div>
           </div>
           <div className="space-y-1">
             <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Active View Session</span>
             <div className="flex gap-1">
               {[1, 2, 3, 4].map(s => (
                 <button 
                  key={s} 
                  onClick={() => setSelectedSession(s)}
                  className={`flex-1 py-1.5 rounded-md text-[9px] font-black transition-all ${selectedSession === s ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-500'}`}
                 >S{s}</button>
               ))}
             </div>
           </div>
        </div>

        <nav className="space-y-2 flex-1">
          {[
            { id: 'map', label: 'Tactical Map', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
            { id: 'sheet', label: 'Data Registry', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
            { id: 'inventory', label: 'Gear Inventory', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2h-5l-1-1H7L6 5H5a2 2 0 00-2 2z' },
            { id: 'chat', label: 'Comms Channel', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
                activeTab === tab.id 
                  ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon}/></svg>
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50">
           <h4 className="text-[9px] font-black text-slate-500 uppercase mb-3 tracking-widest">Sector Health</h4>
           <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-500">Active Map Units</span>
                <span className="text-emerald-500 font-mono">{activeMembersOnMap.length}</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-500">Breaches</span>
                <span className={`font-mono ${geofenceViolations.length > 0 ? 'text-red-500 animate-pulse' : 'text-slate-600'}`}>
                  {geofenceViolations.length}
                </span>
              </div>
           </div>
        </div>
      </aside>

      <section className="flex-1 flex flex-col h-full">
        <header className="h-20 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-8 flex-shrink-0 z-20">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">
              {activeTab === 'map' ? 'Tactical Overlay' : activeTab.replace('-', ' ')}
            </h2>
            <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">Node: D{selectedDay}S{selectedSession} // VIEW_ACTIVE</p>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Verified Units Online</span>
                <span className="text-xl font-black text-indigo-500">{activeMembersOnMap.length} <span className="text-slate-700 font-normal">/ {members.length}</span></span>
             </div>
             <div className="w-10 h-10 rounded-full border-2 border-slate-700 p-0.5 bg-slate-800">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${adminId}`} className="w-full h-full rounded-full" alt="Admin" />
             </div>
          </div>
        </header>

        <div className="flex-1 relative overflow-hidden">
          {activeTab === 'map' && (
            <div className="absolute inset-0 w-full h-full">
              <MapTracker members={activeMembersOnMap} />
            </div>
          )}
          
          <div className={`absolute inset-0 p-8 overflow-auto custom-scrollbar ${activeTab === 'map' ? 'pointer-events-none' : 'pointer-events-auto bg-slate-950'}`}>
            {activeTab === 'sheet' && (
              <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden h-full shadow-2xl">
                <AttendanceSheet 
                  users={users} 
                  workUpdates={workUpdates} 
                  equipments={equipments} 
                  forcedDay={selectedDay}
                  forcedSession={selectedSession}
                />
              </div>
            )}
            {activeTab === 'inventory' && (
              <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 h-full overflow-auto shadow-2xl">
                <EquipmentManager 
                  equipments={equipments} 
                  users={users} 
                  onUpdate={onUpdateEquipment}
                  onRegister={onRegisterEquipment}
                  isAdmin={true} 
                />
              </div>
            )}
            {activeTab === 'chat' && (
               <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden h-full shadow-2xl">
                 <ChatSystem 
                   messages={messages} 
                   onSendMessage={onSendMessage} 
                   currentUserId={adminId} 
                   targets={members} 
                 />
               </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
