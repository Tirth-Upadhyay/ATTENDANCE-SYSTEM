import React, { useMemo } from 'react';
import { User, Geofence } from '../types';

interface MapTrackerProps {
  members: User[];
  geofence?: Geofence;
  activeSessionKey?: string;
}

const MapTracker: React.FC<MapTrackerProps> = ({ 
  members, 
  geofence = { center: { lat: 18.5194, lng: 73.8150, timestamp: 0 }, radiusLat: 0.005, radiusLng: 0.005, name: "Event Zone A" },
  activeSessionKey
}) => {
  const zoom = 60000;
  const onlineMembers = useMemo(() => members.filter(m => m.currentLocation), [members]);

  return (
    <div className="relative w-full h-full bg-slate-950 font-mono overflow-hidden flex items-center justify-center select-none">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      
      {/* Grid Lines */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[800px] border border-indigo-500/5 rounded-full" />
        <div className="w-[600px] h-[600px] border border-indigo-500/10 rounded-full" />
        <div className="w-[400px] h-[400px] border border-indigo-500/15 rounded-full" />
        <div className="w-[200px] h-[200px] border border-indigo-500/20 rounded-full" />
      </div>

      {/* Radar Effect */}
      <div className="absolute inset-0 flex items-center justify-center animate-[radar-spin_8s_linear_infinite] pointer-events-none">
         <div className="w-1/2 h-[2px] bg-gradient-to-r from-indigo-500/40 to-transparent absolute left-1/2 origin-left" />
      </div>

      {/* Geofence Boundary */}
      <div 
        className="absolute border-2 border-dashed border-indigo-500/30 bg-indigo-500/5 rounded-3xl z-10 transition-all duration-700 ease-out"
        style={{
          width: `${geofence.radiusLng * 2 * zoom}px`,
          height: `${geofence.radiusLat * 2 * zoom}px`,
        }}
      >
        <div className="absolute -top-6 left-2 text-[9px] text-indigo-400 font-black uppercase tracking-[0.2em] whitespace-nowrap">
          {geofence.name} (OPERATIONAL_SECTOR)
        </div>
      </div>

      {/* Member Markers */}
      <div className="relative w-full h-full flex items-center justify-center z-20">
        {onlineMembers.map(member => {
          if (!member.currentLocation) return null;
          const dx = (member.currentLocation.lng - geofence.center.lng) * zoom;
          const dy = (member.currentLocation.lat - geofence.center.lat) * zoom;

          const isVerifiedForSession = activeSessionKey ? member.attendance.includes(activeSessionKey) : false;
          const isRecentlyActive = (Date.now() - (member.currentLocation.timestamp || 0)) < 15000;
          const baseDept = member.department.split(' ')[0];

          return (
            <div 
              key={member.id}
              className="absolute transition-all duration-1000 ease-in-out group"
              style={{ transform: `translate(${dx}px, ${-dy}px)` }}
            >
              {/* Signal Pulse for Live Movement */}
              {isRecentlyActive && (
                <div className="absolute inset-0 -left-6 -top-6 w-20 h-20 bg-indigo-500/10 rounded-full animate-signal pointer-events-none" />
              )}
              
              {!member.isInsideGeofence && (
                <div className="absolute inset-0 -left-6 -top-6 w-20 h-20 bg-red-500/20 rounded-full animate-ping pointer-events-none" />
              )}
              
              <div className="relative flex flex-col items-center">
                <div className={`w-10 h-10 rounded-xl bg-slate-900 border-2 flex items-center justify-center transition-all duration-500 p-2 ${
                  !member.isInsideGeofence 
                    ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-pulse text-red-500' 
                    : isVerifiedForSession
                    ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] text-emerald-400'
                    : 'border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.3)] text-indigo-400 opacity-60'
                }`}>
                  <img src={member.avatar} className="w-full h-full rounded-lg object-cover" alt="" />
                </div>
                
                {/* Tactical Label */}
                <div className="absolute top-12 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-lg backdrop-blur-md min-w-[120px] z-50">
                  <span className="text-[10px] font-black text-white uppercase truncate">{member.name}</span>
                  <div className="flex gap-2 items-center mt-1">
                    <span className={`text-[8px] font-bold ${isVerifiedForSession ? 'text-emerald-500' : 'text-slate-500'}`}>
                      {isVerifiedForSession ? 'VERIFIED' : 'UNVERIFIED'}
                    </span>
                    <span className="text-[7px] text-slate-500 font-mono">
                      {member.currentLocation?.lat.toFixed(4)}N / {member.currentLocation?.lng.toFixed(4)}E
                    </span>
                  </div>
                </div>

                <div className={`mt-1 text-[8px] font-black uppercase tracking-widest ${isVerifiedForSession ? 'text-emerald-500' : 'text-slate-500'}`}>
                  {member.name.split(' ')[0]}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Surveillance HUD */}
      <div className="absolute top-8 left-8 z-30 pointer-events-none">
        <div className="bg-slate-900/80 border border-indigo-500/20 p-5 rounded-2xl backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_#6366f1]" />
            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em]">Live Stream: Mesh</h3>
          </div>
          <div className="space-y-3">
             {onlineMembers.length > 0 ? onlineMembers.slice(0, 5).map(m => (
               <div key={m.id} className="flex justify-between items-center gap-8">
                  <span className="text-[10px] font-bold text-slate-400 truncate max-w-[80px]">{m.name.toUpperCase()}</span>
                  <span className={`text-[9px] font-mono ${m.isInsideGeofence ? 'text-emerald-500' : 'text-red-500 font-black'}`}>
                    {m.isInsideGeofence ? 'SECURE' : 'BREACH'}
                  </span>
               </div>
             )) : (
               <p className="text-[9px] text-slate-600 italic uppercase">Searching for signals...</p>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapTracker;