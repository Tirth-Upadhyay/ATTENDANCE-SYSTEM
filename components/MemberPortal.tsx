import React, { useState, useEffect, useRef } from 'react';
import { User, Equipment, ChatMessage, Role } from '../types';
import EquipmentManager from './EquipmentManager';
import ChatSystem from './ChatSystem';
import { verifyAttendanceImage } from '../aiService';

interface MemberPortalProps {
  user: User;
  allUsers: User[];
  equipments: Equipment[];
  messages: ChatMessage[];
  onMarkAttendance: (day: number, session: number) => void;
  onToggleTracking: () => void;
  onUpdateLocation: (lat: number, lng: number) => void;
  isTracking: boolean;
  onSendMessage: (text: string) => void;
  onAddWorkUpdate: (task: string) => void;
}

const MemberPortal: React.FC<MemberPortalProps> = ({
  user, allUsers, equipments, messages,
  onMarkAttendance, onToggleTracking, onUpdateLocation,
  isTracking, onSendMessage, onAddWorkUpdate
}) => {
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedSession, setSelectedSession] = useState(1);
  const [isVerifying, setIsVerifying] = useState(false);
  const lastUpdateRef = useRef(0);
  
  const sessionKey = `D${selectedDay}S${selectedSession}`;
  const isPresent = user.attendance.includes(sessionKey);

  // Throttled Geolocation (Faster initial pulse, then 10s intervals)
  useEffect(() => {
    let watchId: number;
    if (isTracking) {
      // Immediate pulse
      navigator.geolocation.getCurrentPosition(pos => {
        onUpdateLocation(pos.coords.latitude, pos.coords.longitude);
      });

      watchId = navigator.geolocation.watchPosition((pos) => {
        const now = Date.now();
        if (now - lastUpdateRef.current > 10000) {
          onUpdateLocation(pos.coords.latitude, pos.coords.longitude);
          lastUpdateRef.current = now;
        }
      }, console.error, { enableHighAccuracy: true });
    }
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isTracking]);

  const handleVerification = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsVerifying(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const res = await verifyAttendanceImage(ev.target?.result as string);
        if (res.isAuthentic && res.latitude) {
          onMarkAttendance(selectedDay, selectedSession);
        } else {
          alert("Verification Failed: GPS Data missing or photo invalid.");
        }
      } catch (err) { alert("Mesh busy. Retrying in 5s..."); }
      finally { setIsVerifying(false); }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6 h-full overflow-auto custom-scrollbar pb-20">
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
           <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
        </div>

        <div className="flex justify-between items-start mb-10 relative z-10">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-2">{user.name}</h1>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.department}</p>
            </div>
          </div>
          <button onClick={onToggleTracking} className={`group flex flex-col items-center gap-2 transition-all ${isTracking ? 'scale-110' : 'opacity-50'}`}>
            <span className={`text-[8px] font-black uppercase tracking-widest ${isTracking ? 'text-emerald-500' : 'text-slate-500'}`}>
               {isTracking ? 'SIGNAL_ON' : 'SIGNAL_OFF'}
            </span>
            <div className={`w-14 h-7 rounded-full p-1 transition-colors ${isTracking ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-slate-800 border border-slate-700'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-transform ${isTracking ? 'translate-x-7' : ''}`} />
            </div>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-10 relative z-10">
          <div className="space-y-3">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Operational Day</span>
            <div className="flex gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              {[1,2,3].map(d => (
                <button key={d} onClick={() => setSelectedDay(d)} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${selectedDay === d ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-900'}`}>{d}</button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Duty Session</span>
            <div className="flex gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              {[1,2,3,4].map(s => (
                <button key={s} onClick={() => setSelectedSession(s)} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${selectedSession === s ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-600 hover:bg-slate-900'}`}>S{s}</button>
              ))}
            </div>
          </div>
        </div>

        {!isPresent ? (
          <div className="relative z-10">
            <label className={`block w-full py-6 bg-white text-slate-950 text-center rounded-[2rem] font-black text-xs cursor-pointer uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-100 transition-all transform active:scale-95 ${isVerifying ? 'opacity-50 cursor-wait' : ''}`}>
              {isVerifying ? 'Verifying Signal...' : 'Transmit Location Photo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleVerification} disabled={isVerifying} />
            </label>
            <p className="text-[8px] text-center text-slate-600 font-bold uppercase mt-4 tracking-widest">Photo required for D{selectedDay}S{selectedSession} verification</p>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-[2rem] flex flex-col items-center justify-center gap-4 animate-in zoom-in-95 duration-500 relative z-10">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
               <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"/></svg>
            </div>
            <div className="text-center">
              <span className="text-emerald-500 font-black text-xs uppercase tracking-[0.3em]">Session Locked</span>
              <p className="text-[8px] text-emerald-500/60 font-black uppercase mt-1">D{selectedDay}-S{selectedSession} ATTENDANCE SECURED</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl">
        <h3 className="text-[10px] font-black text-white uppercase mb-6 tracking-[0.3em]">Sector Comms</h3>
        <ChatSystem messages={messages} onSendMessage={(s,r,t) => onSendMessage(t)} currentUserId={user.id} targets={allUsers.filter(u => u.role === Role.ADMIN)} isMemberMode />
      </div>
    </div>
  );
};

export default MemberPortal;