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
  const [workInput, setWorkInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const lastUpdateRef = useRef(0);
  const sessionKey = `D${selectedDay}S${selectedSession}`;
  const isPresent = user.attendance.includes(sessionKey);

  // Throttled Geolocation (Every 5 seconds)
  useEffect(() => {
    let watchId: number;
    if (isTracking) {
      watchId = navigator.geolocation.watchPosition((pos) => {
        const now = Date.now();
        if (now - lastUpdateRef.current > 5000) {
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
          alert("Verification Failed: Coordinates missing or image invalid.");
        }
      } catch (err) { alert("AI Service Busy. Try again."); }
      finally { setIsVerifying(false); }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8 h-full overflow-auto custom-scrollbar">
      <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">{user.name}</h1>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{user.department}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-[9px] font-black text-slate-500 uppercase">Live Tracking</span>
            <button onClick={onToggleTracking} className={`w-12 h-6 rounded-full p-1 transition-colors ${isTracking ? 'bg-indigo-600' : 'bg-slate-800'}`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isTracking ? 'translate-x-6' : ''}`} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="space-y-1">
            <span className="text-[8px] font-black text-slate-600 uppercase">Day</span>
            <div className="flex gap-1">
              {[1,2,3].map(d => (
                <button key={d} onClick={() => setSelectedDay(d)} className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${selectedDay === d ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}>D{d}</button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[8px] font-black text-slate-600 uppercase">Session</span>
            <div className="flex gap-1">
              {[1,2,3,4].map(s => (
                <button key={s} onClick={() => setSelectedSession(s)} className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${selectedSession === s ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-500'}`}>S{s}</button>
              ))}
            </div>
          </div>
        </div>

        {!isPresent ? (
          <div className="space-y-4">
            <label className="block w-full py-4 bg-white text-slate-950 text-center rounded-2xl font-black text-xs cursor-pointer uppercase tracking-widest hover:bg-slate-100 transition-colors">
              {isVerifying ? 'Processing...' : 'Upload Verification Photo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleVerification} disabled={isVerifying} />
            </label>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl flex items-center justify-center gap-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-emerald-500 font-black text-[10px] uppercase tracking-widest">Verified Present</span>
          </div>
        )}
      </div>

      <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl">
        <h3 className="text-xs font-black text-white uppercase mb-4 tracking-widest">Mesh Chat</h3>
        <ChatSystem messages={messages} onSendMessage={(s,r,t) => onSendMessage(t)} currentUserId={user.id} targets={allUsers.filter(u => u.role === Role.ADMIN)} isMemberMode />
      </div>
    </div>
  );
};

export default MemberPortal;