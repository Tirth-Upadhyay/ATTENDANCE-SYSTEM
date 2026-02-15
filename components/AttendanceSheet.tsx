
import React, { useState, useEffect, useMemo } from 'react';
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

  const members = useMemo(() => users.filter(u => u.role === Role.MEMBER), [users]);
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
      <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <div>
          <h3 className="font-black text-white uppercase tracking-wider text-sm">Personnel Registry</h3>
          <p className="text-[9px] text-slate-500 uppercase tracking-widest">Active Session: {sessionKey}</p>
        </div>
        <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
           <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Mesh Live</span>
           </div>
        </div>
      </div>
      
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-900 z-10 shadow-sm">
            <tr>
              <th className="px-6 py-4 border-b border-slate-800 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Member</th>
              <th className="px-6 py-4 border-b border-slate-800 text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center">Signal</th>
              <th className="px-6 py-4 border-b border-slate-800 text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center">Status</th>
              <th className="px-6 py-4 border-b border-slate-800 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Sector Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {members.map(user => {
              const isPresent = user.attendance.includes(sessionKey);
              const isOnline = user.status === 'Online';
              const latestUpdate = workUpdates.find(wu => wu.userId === user.id);
              
              return (
                <tr key={user.id} className="hover:bg-indigo-500/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg bg-slate-800 border flex items-center justify-center p-1.5 ${isOnline ? 'border-emerald-500/30' : 'border-slate-700'}`}>
                        {getTacticalIcon(user.department, isPresent)}
                      </div>
                      <div>
                        <div className="text-[11px] font-black uppercase text-white tracking-tight leading-none">{user.name}</div>
                        <div className="text-[8px] text-slate-600 font-bold uppercase mt-1">{user.department}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center">
                       <div className={`w-2 h-2 rounded-full mb-1 ${isOnline ? 'bg-emerald-500 shadow-[0_0_5px_#10b981] animate-pulse' : 'bg-slate-800'}`}></div>
                       <span className={`text-[7px] font-black uppercase ${isOnline ? 'text-emerald-500' : 'text-slate-700'}`}>{isOnline ? 'ACTIVE' : 'IDLE'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      isPresent ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-slate-800 text-slate-600 border-slate-700'
                    }`}>
                      {isPresent ? 'VERIFIED' : 'ABSENT'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-[150px] truncate text-[9px] text-slate-500 font-medium italic">
                      {latestUpdate?.task || '--'}
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
