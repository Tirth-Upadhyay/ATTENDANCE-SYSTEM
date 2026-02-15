
import React, { useMemo } from 'react';
import { User, Geofence } from '../types';

interface MapTrackerProps {
  members: User[];
  geofence?: Geofence;
}

const MapTracker: React.FC<MapTrackerProps> = ({ 
  members, 
  geofence = { center: { lat: 18.5194, lng: 73.8150, timestamp: 0 }, radiusLat: 0.005, radiusLng: 0.005, name: "Event Zone A" }
}) => {
  const zoom = 60000;
  const onlineMembers = useMemo(() => members.filter(m => m.currentLocation), [members]);

  return (
    <div className="relative w-full h-full bg-slate-950 font-mono overflow-hidden flex items-center justify-center select-none">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[800px] border border-indigo-500/5 rounded-full" />
        <div className="w-[600px] h-[600px] border border-indigo-500/10 rounded-full" />
        <div className="w-[400px] h-[400px] border border-indigo-500/15 rounded-full" />
        <div className="w-[200px] h-[200px] border border-indigo-500/20 rounded-full" />
        <div className="absolute w-[80%] h-[1px] bg-indigo-500/10" />
        <div className="absolute h-[80%] w-[1px] bg-indigo-500/10" />
      </div>

      <div className="absolute inset-0 flex items-center justify-center animate-[radar-spin_8s_linear_infinite] pointer-events-none">
         <div className="w-1/2 h-[2px] bg-gradient-to-r from-indigo-500/40 to-transparent absolute left-1/2 origin-left" />
      </div>

      <div 
        className="absolute border-2 border-dashed border-indigo-500/30 bg-indigo-500/5 rounded-3xl z-10 transition-all duration-700 ease-out"
        style={{
          width: `${geofence.radiusLng * 2 * zoom}px`,
          height: `${geofence.radiusLat * 2 * zoom}px`,
        }}
      >
        <div className="absolute -top-6 left-2 text-[9px] text-indigo-400 font-black uppercase tracking-[0.2em] whitespace-nowrap">
          {geofence.name} (ACTIVE_SECTOR)
        </div>
      </div>

      <div className="relative w-full h-full flex items-center justify-center z-20">
        {onlineMembers.map(member => {
          if (!member.currentLocation) return null;
          const dx = (member.currentLocation.lng - geofence.center.lng) * zoom;
          const dy = (member.currentLocation.lat - geofence.center.lat) * zoom;

          const baseDept = member.department.split(' ')[0];
          const isPhotographer = baseDept === 'Photographers';
          const isVideographer = baseDept === 'Videographers';
          const isOperations = baseDept === 'Operations';
          const isAnchor = baseDept === 'Anchors';

          return (
            <div 
              key={member.id}
              className="absolute transition-all duration-1000 ease-in-out group"
              style={{ transform: `translate(${dx}px, ${-dy}px)` }}
            >
              {!member.isInsideGeofence && (
                <div className="absolute inset-0 -left-6 -top-6 w-20 h-20 bg-red-500/20 rounded-full animate-ping pointer-events-none" />
              )}
              
              <div className="relative flex flex-col items-center">
                <div className={`w-10 h-10 rounded-xl bg-slate-900 border-2 flex items-center justify-center transition-all duration-500 p-2 ${
                  member.isInsideGeofence 
                    ? 'border-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.5)] text-indigo-400' 
                    : 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)] animate-pulse text-red-500'
                }`}>
                  {isPhotographer ? (
                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  ) : isVideographer ? (
                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                  ) : isOperations ? (
                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  ) : isAnchor ? (
                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                  ) : (
                    <img src={member.avatar} className="w-full h-full rounded-lg object-cover" alt="" />
                  )}
                </div>
                
                <div className="absolute top-12 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-lg backdrop-blur-md min-w-[120px] z-50">
                  <span className="text-[10px] font-black text-white uppercase truncate">{member.name}</span>
                  <div className="flex gap-2 items-center mt-1">
                    <span className={`text-[8px] font-bold ${member.isInsideGeofence ? 'text-emerald-500' : 'text-red-500'}`}>
                      {member.isInsideGeofence ? 'IN_BOUNDS' : 'BREACH'}
                    </span>
                    <span className="text-[7px] text-slate-500 font-mono">
                      {member.currentLocation?.lat.toFixed(4)}N / {member.currentLocation?.lng.toFixed(4)}E
                    </span>
                  </div>
                </div>

                <div className={`mt-1 text-[8px] font-black uppercase tracking-widest ${member.isInsideGeofence ? 'text-slate-500' : 'text-red-500'}`}>
                  {member.name.split(' ')[0]}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute top-8 left-8 z-30 pointer-events-none">
        <div className="bg-slate-900/80 border border-indigo-500/20 p-5 rounded-2xl backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_#6366f1]" />
            <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em]">Sector Surveillance</h3>
          </div>
          <div className="space-y-3">
             {onlineMembers.length > 0 ? onlineMembers.map(m => (
               <div key={m.id} className="flex justify-between items-center gap-8">
                  <span className="text-[10px] font-bold text-slate-400">{m.name.toUpperCase()}</span>
                  <span className={`text-[9px] font-mono ${m.isInsideGeofence ? 'text-slate-600' : 'text-red-500 font-black'}`}>
                    {m.isInsideGeofence ? 'OK' : 'ERR:BREACH'}
                  </span>
               </div>
             )) : (
               <p className="text-[9px] text-slate-600 italic uppercase">No Verified Signals...</p>
             )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes radar-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MapTracker;
