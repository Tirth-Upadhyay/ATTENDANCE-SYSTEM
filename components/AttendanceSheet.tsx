
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

  const exportDepartmentCSV = (dept: 'Photographers' | 'Videographers' | 'Operations') => {
    const deptMembers = members.filter(m => m.department.startsWith(dept));
    const headers = ["Member Name", "Department", `Status (Day ${filterDay} Session ${filterSession})`, "Equipment Assigned", "Latest Telemetry"];
    
    const rows = deptMembers.map(user => {
      const userEquips = equipments.filter(e => e.assignedToId === user.id);
      const latestUpdate = workUpdates.find(wu => wu.userId === user.id);
      const isPresent = user.attendance.includes(sessionKey);
      
      return [
        user.name,
        user.department,
        isPresent ? "PRESENT" : "ABSENT",
        userEquips.map(e => `${e.name}(${e.serialNumber})`).join('; '),
        latestUpdate ? latestUpdate.task.replace(/,/g, ' ') : 'None'
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${dept}_Day${filterDay}_Session${filterSession}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTacticalIcon = (dept: string, isPresent: boolean) => {
    const baseDept = dept.split(' ')[0];
    const colorClass = isPresent ? 'text-emerald-400' : 'text-slate-500 opacity-40';
    
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
    <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden flex flex-col h-full font-mono">
      <div className="p-6 border-b border-slate-800 space-y-4 bg-slate-900/50">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-white uppercase tracking-wider text-sm">MIT-WPU Operational Registry</h3>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest">Registry Window: DAY {filterDay} SESSION {filterSession}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => exportDepartmentCSV('Photographers')}
              className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-[9px] font-black hover:bg-indigo-700 flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              PHOTO
            </button>
            <button 
              onClick={() => exportDepartmentCSV('Videographers')}
              className="bg-violet-600 text-white px-3 py-2 rounded-lg text-[9px] font-black hover:bg-violet-700 flex items-center gap-2 transition-all shadow-lg shadow-violet-600/20 active:scale-95"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              VIDEO
            </button>
            <button 
              onClick={() => exportDepartmentCSV('Operations')}
              className="bg-amber-600 text-white px-3 py-2 rounded-lg text-[9px] font-black hover:bg-amber-700 flex items-center gap-2 transition-all shadow-lg shadow-amber-600/20 active:scale-95"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              OPERATIONS
            </button>
          </div>
        </div>
        
        {!forcedDay && (
          <div className="flex items-center gap-4 bg-slate-950/50 p-3 rounded-xl border border-slate-800 overflow-x-auto">
            <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-[9px] font-black text-slate-500 uppercase">View Day:</span>
                <div className="flex gap-1">
                  {[1, 2, 3].map(d => (
                    <button 
                      key={d} 
                      onClick={() => setFilterDay(d)}
                      className={`px-3 py-1 rounded-md text-[9px] font-black transition-all ${filterDay === d ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
            </div>
            <div className="h-4 w-[1px] bg-slate-800 flex-shrink-0"></div>
            <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-[9px] font-black text-slate-500 uppercase">View Session:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(s => (
                    <button 
                      key={s} 
                      onClick={() => setFilterSession(s)}
                      className={`px-3 py-1 rounded-md text-[9px] font-black transition-all ${filterSession === s ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-500'}`}
                    >
                      S{s}
                    </button>
                  ))}
                </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="overflow-auto flex-1 custom-scrollbar bg-slate-950/20">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-900 z-10">
            <tr>
              <th className="px-6 py-4 border-b border-slate-800 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Personnel</th>
              <th className="px-6 py-4 border-b border-slate-800 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Dept</th>
              <th className="px-6 py-4 border-b border-slate-800 text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center">Verification Status</th>
              <th className="px-6 py-4 border-b border-slate-800 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Gear ID</th>
              <th className="px-6 py-4 border-b border-slate-800 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Live Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {members.map(user => {
              const userEquips = equipments.filter(e => e.assignedToId === user.id);
              // CORRECTED: Find latest update using workUpdates prop
              const latestUpdate = workUpdates.find(wu => wu.userId === user.id);
              const isPresent = user.attendance.includes(sessionKey);
              
              return (
                <tr key={user.id} className="hover:bg-indigo-500/5 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden border transition-all p-1.5 ${
                        isPresent ? 'border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'border-slate-700'
                      }`}>
                        {getTacticalIcon(user.department, isPresent)}
                      </div>
                      <div>
                        <div className={`text-[11px] font-black uppercase tracking-tight ${isPresent ? 'text-white' : 'text-slate-600'}`}>{user.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[9px] text-slate-400 font-bold uppercase">{user.department}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                      isPresent ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20 opacity-30'
                    }`}>
                      {isPresent ? 'PRESENT' : 'ABSENT'}
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
