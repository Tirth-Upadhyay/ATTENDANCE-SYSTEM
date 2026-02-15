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

const CAMPUS_BOUNDS = {
  latMin: 18.5150,
  latMax: 18.5230,
  lngMin: 73.8120,
  lngMax: 73.8190
};

const DEPT_CONFIG: Record<string, { color: string, label: string, icon: React.ReactNode }> = {
  'Photographers': { 
    color: 'indigo', 
    label: 'Lens Feed', 
    icon: <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg> 
  },
  'Videographers': { 
    color: 'violet', 
    label: 'Motion Capture', 
    icon: <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg> 
  },
  'Anchors': { 
    color: 'emerald', 
    label: 'Broadcast Cue', 
    icon: <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg> 
  },
  'Operations': { 
    color: 'amber', 
    label: 'Grid Command', 
    icon: <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg> 
  },
  'Default': { 
    color: 'slate', 
    label: 'Status Uplink', 
    icon: <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> 
  }
};

const MemberPortal: React.FC<MemberPortalProps> = ({
  user,
  allUsers,
  equipments,
  messages,
  onMarkAttendance,
  onToggleTracking,
  onUpdateLocation,
  isTracking,
  onSendMessage,
  onAddWorkUpdate
}) => {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedSession, setSelectedSession] = useState<number>(1);
  const [workInput, setWorkInput] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [attendanceImage, setAttendanceImage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const watchId = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionKey = `D${selectedDay}S${selectedSession}`;
  const isSessionMarked = user.attendance.includes(sessionKey);

  const baseDept = user.department.split(' ')[0];
  const config = DEPT_CONFIG[baseDept] || DEPT_CONFIG['Default'];
  const adminUser = allUsers.find(u => u.role === Role.ADMIN) || allUsers[0];

  const isWithinCampus = (lat: number, lng: number) => {
    return (
      lat >= CAMPUS_BOUNDS.latMin &&
      lat <= CAMPUS_BOUNDS.latMax &&
      lng >= CAMPUS_BOUNDS.lngMin &&
      lng <= CAMPUS_BOUNDS.lngMax
    );
  };

  useEffect(() => {
    if (isTracking) {
      if ("geolocation" in navigator) {
        watchId.current = navigator.geolocation.watchPosition(
          (pos) => onUpdateLocation(pos.coords.latitude, pos.coords.longitude),
          () => onToggleTracking(),
          { enableHighAccuracy: true }
        );
      }
    }
    return () => { if (watchId.current) navigator.geolocation.clearWatch(watchId.current); };
  }, [isTracking]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsVerifying(true);
    setAttendanceError(null);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setAttendanceImage(base64);

      try {
        const result = await verifyAttendanceImage(base64);
        
        if (result.error) {
          setAttendanceError(result.error);
        } else if (!result.isAuthentic) {
          setAttendanceError("AUTH_ERROR: Digital manipulation or non-live photo detected.");
        } else if (result.latitude === null || result.longitude === null) {
          setAttendanceError("GPS_ERROR: No valid coordinates found in image data.");
        } else {
          const inCampus = isWithinCampus(result.latitude, result.longitude);
          if (inCampus) {
            onMarkAttendance(selectedDay, selectedSession);
          } else {
            setAttendanceError(`LOCATION_DENIED: Coordinates (${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}) are outside MIT-WPU.`);
          }
        }
      } catch (err: any) {
        setAttendanceError(`SYSTEM_FAULT: ${err.message || 'AI Analysis Failure.'}`);
      } finally {
        setIsVerifying(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitWork = (e: React.FormEvent) => {
    e.preventDefault();
    if (workInput.trim()) {
      onAddWorkUpdate(workInput);
      setWorkInput('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8 space-y-6 pb-24 font-sans bg-slate-950">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
           <div className={`w-20 h-20 rounded-3xl bg-${config.color}-500/10 border border-${config.color}-500/20 flex items-center justify-center p-4 shadow-2xl overflow-hidden text-${config.color}-500`}>
             {config.icon}
           </div>
           <div>
             <h1 className="text-3xl font-black text-white tracking-tighter uppercase">{user.name}</h1>
             <div className="flex items-center gap-3 mt-1.5">
               <span className={`px-3 py-1 bg-${config.color}-500/10 text-${config.color}-400 rounded-lg border border-${config.color}-500/20 text-[10px] font-black uppercase tracking-widest`}>
                 {user.department}
               </span>
               <span className="text-slate-600 text-[9px] font-mono font-bold">NODE://{user.id.toUpperCase()}</span>
             </div>
           </div>
        </div>
        <div className="px-6 py-4 bg-slate-900/40 border border-slate-800 rounded-2xl flex items-center gap-6 backdrop-blur-xl">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Global Uplink</span>
            <span className={`text-xs font-black ${isTracking ? 'text-emerald-500' : 'text-slate-600'}`}>
              {isTracking ? 'ACTIVE_SYNC' : 'IDLE_OFFLINE'}
            </span>
          </div>
          <button onClick={onToggleTracking} className={`w-14 h-7 rounded-full relative transition-all duration-500 shadow-inner ${isTracking ? `bg-${config.color}-600` : 'bg-slate-800'}`}>
            <div className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-xl transition-all transform duration-500 ${isTracking ? 'translate-x-7 rotate-180' : ''}`} />
          </button>
        </div>
      </header>

      <section className="bg-slate-900/60 rounded-[2.5rem] border border-slate-800 overflow-hidden shadow-2xl relative backdrop-blur-md">
        <div className={`absolute top-0 left-0 w-2 h-full bg-${config.color}-500/50`}></div>
        <div className="p-10">
          <div className="flex flex-col md:flex-row gap-12">
            <div className="flex-1 space-y-8">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Deployment Parameters</h2>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Operational Day</label>
                    <div className="flex gap-2">
                      {[1, 2, 3].map(d => (
                        <button 
                          key={d} 
                          onClick={() => { setSelectedDay(d); setAttendanceError(null); }}
                          className={`flex-1 py-3 rounded-xl font-black text-[10px] border transition-all ${selectedDay === d ? `bg-${config.color}-600 border-${config.color}-500 text-white shadow-lg` : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                        >
                          DAY {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Duty Session</label>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map(s => (
                        <button 
                          key={s} 
                          onClick={() => { setSelectedSession(s); setAttendanceError(null); }}
                          className={`flex-1 py-3 rounded-xl font-black text-[10px] border transition-all ${selectedSession === s ? `bg-white border-white text-slate-900` : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                        >
                          S{s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {!isSessionMarked ? (
                <div className="space-y-5">
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileChange} 
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isVerifying}
                    className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 ${
                      isVerifying ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : `bg-white text-slate-950 hover:bg-slate-200 shadow-2xl active:scale-95`
                    }`}
                  >
                    {isVerifying ? 'ANALYZING GEOTAG...' : `VERIFY DAY ${selectedDay} SESSION ${selectedSession}`}
                  </button>
                  {attendanceError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-shake">
                       <p className="text-[10px] text-red-500 font-black uppercase text-center tracking-widest leading-relaxed">
                         {attendanceError}
                       </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl flex items-center gap-6 animate-in zoom-in duration-500">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 shadow-xl shadow-emerald-500/20">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-emerald-500 uppercase tracking-[0.2em] leading-none">DEPLOYED // SESSION_LOCKED</h4>
                    <p className="text-[10px] text-emerald-500/60 font-mono mt-2 uppercase font-bold">D{selectedDay}-S{selectedSession} Attendance Secured</p>
                  </div>
                </div>
              )}
            </div>

            <div className="w-full md:w-72 aspect-square bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden flex items-center justify-center relative group">
              {attendanceImage ? (
                <>
                  <img src={attendanceImage} className="w-full h-full object-cover" alt="Verification Source" />
                  <div className="absolute inset-0 bg-indigo-500/10 pointer-events-none mix-blend-overlay"></div>
                </>
              ) : (
                <div className="text-center space-y-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  <p className="text-[10px] font-black uppercase tracking-[0.5em]">Awaiting Data</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-800 shadow-xl relative overflow-hidden">
          <h3 className="text-sm font-black text-white mb-6 flex items-center gap-3 uppercase tracking-widest relative z-10">
             <div className={`w-2 h-2 rounded-full bg-${config.color}-500`}></div>
             Live Incident Update
          </h3>
          <form onSubmit={handleSubmitWork} className="space-y-4 relative z-10">
            <textarea
              value={workInput}
              onChange={(e) => setWorkInput(e.target.value)}
              placeholder="Report any problems or current status..."
              className={`w-full p-5 bg-slate-950/80 border border-slate-800 rounded-2xl text-white placeholder-slate-600 focus:ring-1 focus:ring-${config.color}-500/50 focus:outline-none min-h-[120px] text-xs font-mono leading-relaxed`}
            />
            <button type="submit" className={`w-full bg-slate-800 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-700 transition-all active:scale-95`}>
              Transmit Intel
            </button>
          </form>
          {showSuccess && <div className="absolute top-8 right-12 text-emerald-500 text-[8px] font-black tracking-[0.2em] animate-bounce">✓ UPLINK_SECURE</div>}
        </div>

        <div className="bg-slate-900/50 rounded-[2.5rem] border border-slate-800 shadow-xl flex flex-col overflow-hidden">
           <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/20">
             <h3 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Tactical Inventory</h3>
           </div>
           <div className="p-8 flex-1 overflow-auto custom-scrollbar space-y-4">
             {equipments.map(eq => (
               <div key={eq.id} className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/50 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-indigo-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                   </div>
                   <div>
                     <p className="text-[12px] font-black text-white leading-none uppercase tracking-tight">{eq.name}</p>
                     <p className="text-[9px] text-slate-600 font-mono mt-1.5 font-bold">{eq.serialNumber}</p>
                   </div>
                 </div>
                 <div className={`text-[8px] font-black px-3 py-1 rounded-full border ${eq.status === 'Good' ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' : 'border-red-500/20 text-red-500 bg-red-500/5'}`}>
                   {eq.status.toUpperCase()}
                 </div>
               </div>
             ))}
           </div>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-[2.5rem] border border-slate-800 h-[450px] overflow-hidden flex flex-col shadow-2xl backdrop-blur-md">
        <div className="px-8 py-6 border-b border-slate-800 bg-slate-900/20 flex justify-between items-center">
          <h3 className="text-xs font-black text-white uppercase tracking-[0.4em]">Direct Comms [HQ]</h3>
        </div>
        <div className="flex-1 overflow-hidden">
           <ChatSystem messages={messages} onSendMessage={(s, r, t) => onSendMessage(t)} currentUserId={user.id} targets={[adminUser]} isMemberMode />
        </div>
      </div>
    </div>
  );
};

export default MemberPortal;