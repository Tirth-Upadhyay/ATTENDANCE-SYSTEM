
import React, { useState } from 'react';
import { Equipment, User, Role } from '../types';

interface EquipmentManagerProps {
  equipments: Equipment[];
  users: User[];
  onUpdate: (eq: Equipment) => void;
  onRegister?: (name: string, sn: string, memberId: string) => void;
  isAdmin: boolean;
}

const EquipmentManager: React.FC<EquipmentManagerProps> = ({ equipments, users, onUpdate, onRegister, isAdmin }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSn, setNewSn] = useState('');
  const [targetMember, setTargetMember] = useState('');

  const members = users.filter(u => u.role === Role.MEMBER);

  const handleStatusChange = (eq: Equipment, status: Equipment['status']) => {
    onUpdate({ ...eq, status, lastUpdated: new Date().toISOString() });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (onRegister && newName && newSn && targetMember) {
      onRegister(newName, newSn, targetMember);
      setNewName('');
      setNewSn('');
      setTargetMember('');
      setShowAddForm(false);
    }
  };

  const getTacticalIcon = (dept: string) => {
    const baseDept = dept.split(' ')[0];
    if (baseDept === 'Photographers') {
      return <svg className="w-full h-full text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;
    }
    if (baseDept === 'Videographers') {
      return <svg className="w-full h-full text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>;
    }
    if (baseDept === 'Operations') {
      return <svg className="w-full h-full text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>;
    }
    return <svg className="w-full h-full text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-white uppercase tracking-tight">Tactical Gear Registry</h3>
          <p className="text-[10px] text-slate-500 font-mono">Monitoring hardware integrity across all sectors.</p>
        </div>
        {isAdmin && !showAddForm && (
          <button 
            onClick={() => setShowAddForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
            Register New Gear
          </button>
        )}
      </div>

      {showAddForm && isAdmin && (
        <div className="bg-slate-800 border border-indigo-500/30 p-6 rounded-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-black text-indigo-400 uppercase tracking-widest">Manual Gear Entry</h4>
            <button onClick={() => setShowAddForm(false)} className="text-slate-500 hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input 
              type="text" 
              placeholder="Hardware Name (e.g. Sony A7 III)"
              className="bg-slate-900 border border-slate-700 text-white p-3 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
            <input 
              type="text" 
              placeholder="Serial Number / ID"
              className="bg-slate-900 border border-slate-700 text-white p-3 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              value={newSn}
              onChange={(e) => setNewSn(e.target.value)}
              required
            />
            <select 
              className="bg-slate-900 border border-slate-700 text-white p-3 rounded-xl text-xs outline-none focus:ring-1 focus:ring-indigo-500"
              value={targetMember}
              onChange={(e) => setTargetMember(e.target.value)}
              required
            >
              <option value="">Assign to Unit...</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.department})</option>
              ))}
            </select>
            <button 
              type="submit"
              className="bg-indigo-600 text-white p-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-colors shadow-xl shadow-indigo-600/10"
            >
              Confirm Assignment
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {equipments.map(eq => {
          const owner = users.find(u => u.id === eq.assignedToId);
          
          return (
            <div key={eq.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-sm hover:border-indigo-500/30 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                 <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/></svg>
              </div>

              <div className="flex justify-between items-start mb-6">
                <div className="bg-slate-800 p-2.5 rounded-xl text-indigo-400 border border-slate-700">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <div className="text-right">
                  <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                    eq.status === 'Good' 
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                      : 'bg-red-500/10 text-red-500 border border-red-500/20'
                  }`}>
                    {eq.status}
                  </span>
                </div>
              </div>

              <h4 className="font-black text-white text-sm uppercase mb-1 tracking-tight">{eq.name}</h4>
              <p className="text-[10px] text-slate-500 font-mono mb-6 uppercase">Asset ID: {eq.serialNumber}</p>

              <div className="border-t border-slate-800 pt-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg border border-slate-700 bg-slate-800 p-1">
                    {owner ? getTacticalIcon(owner.department) : <svg className="w-full h-full text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>}
                  </div>
                  <div>
                    <span className="block text-[10px] text-white font-black uppercase tracking-tight leading-none">{owner?.name || 'Unassigned'}</span>
                    <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">{owner?.department}</span>
                  </div>
                </div>
                {isAdmin && (
                  <select 
                    value={eq.status}
                    onChange={(e) => handleStatusChange(eq, e.target.value as any)}
                    className="text-[9px] font-bold border border-slate-700 rounded-lg p-2 bg-slate-800 text-slate-300 outline-none focus:ring-1 focus:ring-indigo-500 uppercase"
                  >
                    <option value="Good">STATUS: GOOD</option>
                    <option value="Needs Service">STATUS: SERVICE</option>
                    <option value="Damaged">STATUS: DAMAGED</option>
                  </select>
                )}
              </div>
              
              <div className="mt-4 flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[8px] text-slate-600 font-mono uppercase tracking-widest">
                  Last Telemetry Sync: {new Date(eq.lastUpdated).toLocaleTimeString()}
                </span>
              </div>
            </div>
          );
        })}
        {equipments.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-800">
            <svg className="w-12 h-12 mx-auto text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No hardware units detected in this sector.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipmentManager;
