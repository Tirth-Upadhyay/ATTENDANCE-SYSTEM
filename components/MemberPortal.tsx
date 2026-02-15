
import React, { useState, useEffect, useRef } from 'react';
import { User, Equipment, ChatMessage, Role } from '../types';
import EquipmentManager from './EquipmentManager';
import ChatSystem from './ChatSystem';
import { verifyAttendanceImage, getQueuePosition } from '../aiService';

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
  const [queuePos, setQueuePos] = useState(0);
  const lastUpdateRef = useRef(0);
  
  const sessionKey = `D${selectedDay}S${selectedSession}`;
  const isPresent = user.attendance.includes(sessionKey);

  useEffect(() => {
    let watchId: number;
    if (isTracking) {
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

  // Update queue position UI
  useEffect(() => {
    if (isVerifying) {
      const interval = setInterval(() => {
        setQueuePos(getQueuePosition());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isVerifying]);

  const handleVerification = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsVerifying(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const res = await verifyAttendanceImage(ev.target?.result as string);
        if (res.isAuthentic) {
          onMarkAttendance(selectedDay, selectedSession);
        } else {
          alert("Verification Failed: Could not confirm location or authenticity.");
        }
      } catch (err: any) { 
        alert("Verification Error: " + (err.message === "API_KEY_MISSING" ? "Admin setup incomplete." : "Network busy. Please try again.")); 
      }
      finally { setIsVerifying(false); }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6 h-full overflow-auto custom-scrollbar pb-20">
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
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
               {isTracking ? 'LIVE_TRACK' : 'TRACK_OFF'}
            </span>
            <div className={`w-14 h-7 rounded-full p-1 transition-colors ${isTracking ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-slate-800 border border-slate-700'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-transform ${isTracking ? 'translate-x-7' : ''}`} />
            </div>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-10 relative z-10">
          <div className="space-y-3">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Day</span>
            <div className="flex gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
              {[1,2,3].map(d => (
                <button key={d} onClick={() => setSelectedDay(d)} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${selectedDay === d ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600'}`}>{d}</button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Session</span>
            <div className="flex gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
              {[1,2,3,4].map(s => (
                <button key={s} onClick={() => setSelectedSession(s)} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${selectedSession === s ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-600'}`}>S{s}</button>
              ))}
            </div>
          </div>
        </div>

        {!isPresent ? (
          <div className="relative z-10">
            <label className={`block w-full py-6 bg-white text-slate-950 text-center rounded-[2rem] font-black text-xs cursor-pointer uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-100 transition-all transform active:scale-95 ${isVerifying ? 'opacity-50 cursor-wait' : ''}`}>
              {isVerifying ? (
                <div className="flex flex-col items-center">
                   <span>Verification in Queue</span>
                   <span className="text-[8px] mt-1 opacity-70">Pos: {queuePos + 1} // Est Wait: {(queuePos + 1) * 5}s</span>
                </div>
              ) : 'Transmit Session Photo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleVerification} disabled={isVerifying} />
            </label>
            <p className="text-[8px] text-center text-slate-600 font-bold uppercase mt-4 tracking-widest underline decoration-indigo-500/30">GPS-Stamped Photo Required</p>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-[2rem] flex flex-col items-center justify-center gap-4 animate-in zoom-in-95 duration-500 relative z-10">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
               <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"/></svg>
            </div>
            <div className="text-center">
              <span className="text-emerald-500 font-black text-xs uppercase tracking-[0.3em]">Verified</span>
              <p className="text-[8px] text-emerald-500/60 font-black uppercase mt-1">D{selectedDay}S{selectedSession} LOCKED</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl">
        <h3 className="text-[10px] font-black text-white uppercase mb-6 tracking-[0.3em]">Operational Comms</h3>
        <ChatSystem messages={messages} onSendMessage={(s,r,t) => onSendMessage(t)} currentUserId={user.id} targets={allUsers.filter(u => u.role === Role.ADMIN)} isMemberMode />
      </div>
    </div>
  );
};

export default MemberPortal;
