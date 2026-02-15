import React, { useState, useEffect } from 'react';
import { User, WorkUpdate, Equipment, Role } from '../types';

interface AttendanceSheetProps {
  users: User[];
  workUpdates: WorkUpdate[];
  equipments: Equipment[];
  forcedDay?: number;
  forcedSession?: number;
}

const AttendanceSheet: React.FC<AttendanceSheetProps> = ({ users, workUpdates, equipments, forcedDay, forcedSession }) => {
  const [filterDay, setFilterDay] = useState(forcedDay || 1);
  const [filterSession, setFilterSession] = useState(forcedSession || 1);
  
  useEffect(() => {
    if (forcedDay) setFilterDay(forcedDay);
    if (forcedSession) setFilterSession(forcedSession);
  }, [forcedDay, forcedSession]);

  const members = users.filter(u => u.role === Role.MEMBER);
  const sessionKey = `D${filterDay}S${filterSession}`;

  const getTacticalIcon = (dept: string, isPresent: boolean) => {
    const baseDept = dept.split(' ')[0];
    const colorClass = isPresent ? 'text-emerald-400' : 'text-slate-500 opacity-40';
    
    if (baseDept === 'Photographers') {
      return <svg className={`w-full h-full ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;
    }
    if (baseDept === 'Videographers') {
      return <svg className={`w-full h-full ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>;
    }
    return <svg className={`w-full h-full ${colorClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>;
  };

  return (
    <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden flex flex-col h-full font-mono">
      <div className="p-6 border-b border-slate-800 space-y-4 bg-slate-900/50">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-white uppercase tracking-wider text-sm">MIT-WPU Operational Registry</h3>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest">Registry Window: DAY {filterDay} SESSION {filterSession}</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
             <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Live Sync Active</span>
          </div>
        </div>
      </div>
      
      <div className="overflow-auto flex-1 custom-scrollbar bg-slate-950/20">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-900 z-10">
            <tr>
              <th className="px-6 py-4 border-b border-slate-800 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Personnel</th>
              <th className="px-6 py-4 border-b border-slate-800 text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center">Mesh Status</th>
              <th className="px-6 py-4 border-b border-slate-800 text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center">Verification</th>
              <th className="px-6 py-4 border-b border-slate-800 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Gear ID</th>
              <th className="px-6 py-4 border-b border-slate-800 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Live Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {members.map(user => {
              const userEquips = equipments.filter(e => e.assignedToId === user.id);
              const latestUpdate = workUpdates.find(wu => wu.userId === user.id);
              const isPresent = user.attendance.includes(sessionKey);
              const isOnline = user.status === 'Online';
              
              return (
                <tr key={user.id} className="hover:bg-indigo-500/5 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center p-1.5 border ${
                        isOnline ? 'border-emerald-500/30' : 'border-slate-700'
                      }`}>
                        {getTacticalIcon(user.department, isPresent)}
                      </div>
                      <div>
                        <div className={`text-[11px] font-black uppercase tracking-tight ${isPresent ? 'text-white' : 'text-slate-600'}`}>{user.name}</div>
                        <div className="text-[8px] text-slate-500 font-bold uppercase">{user.department}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                       <div className={`w-2 h-2 rounded-full mb-1 ${isOnline ? 'bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]' : 'bg-slate-800'}`}></div>
                       <span className={`text-[8px] font-black uppercase ${isOnline ? 'text-emerald-500' : 'text-slate-700'}`}>
                         {isOnline ? 'LINK_ACTIVE' : 'LINK_OFF'}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                      isPresent ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-red-500/5 text-red-500/30 border-red-500/10'
                    }`}>
                      {isPresent ? 'VERIFIED' : 'ABSENT'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-1">
                      {userEquips.map(e => (
                        <div key={e.id} className="text-[8px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-indigo-400 font-mono">
                          {e.serialNumber}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="min-h-[20px] flex items-center">
                      {latestUpdate ? (
                        <p className="text-[10px] text-indigo-400 font-bold italic truncate max-w-[200px] bg-indigo-500/5 border border-indigo-500/10 px-2 py-1 rounded-md">
                          {latestUpdate.task}
                        </p>
                      ) : (
                        <span className="text-[10px] text-slate-700 font-mono">--</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceSheet;