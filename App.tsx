import React, { useState, useEffect, useCallback, useRef } from 'react';
import Gun from 'gun';
import { Role, User, Equipment, ChatMessage, LocationPoint, WorkUpdate, Geofence } from './types';
import { INITIAL_USERS, INITIAL_EQUIPMENT } from './data';
import AdminDashboard from './components/AdminDashboard';
import MemberPortal from './components/MemberPortal';
import Login from './components/Login';

const GEOFENCE: Geofence = {
  center: { lat: 18.5194, lng: 73.8150, timestamp: 0 },
  radiusLat: 0.005,
  radiusLng: 0.005,
  name: "Event Zone A"
};

const gun = Gun({
  peers: [
    'https://gun-manhattan.herokuapp.com/gun',
    'https://relay.gun.one/gun',
    'https://gundb-relay.herokuapp.com/gun',
    'https://gun-us.herokuapp.com/gun'
  ],
  localStorage: false 
});

const MESH_NS = 'bcs-v19-ultra-mesh';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const [peers, setPeers] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [equipments, setEquipments] = useState<Equipment[]>(INITIAL_EQUIPMENT);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [workUpdates, setWorkUpdates] = useState<WorkUpdate[]>([]);
  const [lastPacket, setLastPacket] = useState(0);

  // HIGH-PERFORMANCE BUFFERING REFS
  const userStateRef = useRef<User[]>(INITIAL_USERS);
  const syncTimerRef = useRef<number | null>(null);

  // MONITOR NETWORK
  useEffect(() => {
    const timer = setInterval(() => {
      const p = (gun as any)._?.opt?.peers || {};
      const active = Object.keys(p).filter(key => p[key]?.wire?.readyState === 1);
      setPeers(active);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // START SYNC ENGINE
  useEffect(() => {
    const db: any = gun.get(MESH_NS);

    // BUFFERED FLUSH FUNCTION
    // Instead of re-rendering for every packet, we batch updates every 800ms
    const scheduleFlush = () => {
      if (syncTimerRef.current) return;
      syncTimerRef.current = window.setTimeout(() => {
        setUsers([...userStateRef.current]);
        syncTimerRef.current = null;
      }, 800);
    };

    // 1. ATTENDANCE LISTENER
    db.get('att_v19').map().on((val: number, flatKey: string) => {
      if (!val) return;
      setLastPacket(Date.now());
      const [_, userId, sessionKey] = flatKey.split('_');
      
      const idx = userStateRef.current.findIndex(u => u.id === userId);
      if (idx !== -1) {
        if (!userStateRef.current[idx].attendance.includes(sessionKey)) {
          userStateRef.current[idx] = { 
            ...userStateRef.current[idx], 
            attendance: [...userStateRef.current[idx].attendance, sessionKey] 
          };
          scheduleFlush();
        }
      }
    });

    // 2. SIGNAL/LOCATION LISTENER
    db.get('sig_v19').map().on((data: string, userId: string) => {
      if (!data) return;
      setLastPacket(Date.now());
      try {
        const sig = JSON.parse(data);
        const idx = userStateRef.current.findIndex(u => u.id === userId);
        if (idx !== -1) {
          const isOnline = Date.now() - sig.time < 35000;
          const inside = Math.abs(sig.lat - GEOFENCE.center.lat) <= GEOFENCE.radiusLat &&
                         Math.abs(sig.lng - GEOFENCE.center.lng) <= GEOFENCE.radiusLng;
          
          userStateRef.current[idx] = {
            ...userStateRef.current[idx],
            currentLocation: { lat: sig.lat, lng: sig.lng, timestamp: sig.time },
            status: isOnline ? 'Online' : 'Offline',
            isInsideGeofence: inside
          };
          scheduleFlush();
        }
      } catch (e) {}
    });

    // 3. COMMS (Instant delivery)
    db.get('msg_v19').map().on((msg: any) => {
      if (!msg?.id) return;
      setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg].sort((a,b) => a.timestamp - b.timestamp));
    });

  }, []);

  // SELF SIGNAL
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      const hb = setInterval(() => {
        const loc = currentUser.currentLocation;
        const data = { 
          lat: loc?.lat || 0, 
          lng: loc?.lng || 0, 
          time: Date.now() 
        };
        gun.get(MESH_NS).get('sig_v19').get(currentUser.id).put(JSON.stringify(data));
      }, 12000);
      return () => clearInterval(hb);
    }
  }, [isLoggedIn, currentUser]);

  const handleUpdateLocation = useCallback((lat: number, lng: number) => {
    if (!currentUser) return;
    const data = { lat, lng, time: Date.now() };
    gun.get(MESH_NS).get('sig_v19').get(currentUser.id).put(JSON.stringify(data));
  }, [currentUser]);

  const markAttendance = useCallback((day: number, session: number) => {
    if (!currentUser) return;
    const sessionKey = `D${day}S${session}`;
    const flatKey = `att_${currentUser.id}_${sessionKey}`;
    gun.get(MESH_NS).get('att_v19').get(flatKey).put(Date.now());
  }, [currentUser]);

  if (!isLoggedIn || !currentUser) {
    return <Login users={users} onLogin={(u) => { setCurrentUser(u); setIsLoggedIn(true); }} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 font-sans text-slate-200">
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 flex justify-between items-center text-[8px] font-black uppercase tracking-[0.2em] z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${peers.length > 0 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`}></div>
            <span>{peers.length > 0 ? `MESH_ALIVE [${peers.length}]` : 'OFFLINE'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${Date.now() - lastPacket < 3000 ? 'bg-indigo-400 animate-ping' : 'bg-slate-700'}`}></div>
            <span>TRAFFIC_SIGNAL</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <span className="text-slate-500">OP_ID: <span className="text-indigo-400">{currentUser.name}</span></span>
           <button onClick={() => window.location.reload()} className="text-slate-600 hover:text-white transition-colors">SOFT_RESET</button>
        </div>
      </div>

      <main className="flex-1 overflow-hidden relative">
        {currentUser.role === Role.ADMIN ? (
          <AdminDashboard 
            users={users} 
            equipments={equipments}
            messages={messages}
            workUpdates={workUpdates}
            onUpdateEquipment={(eq) => gun.get(MESH_NS).get('gear').get(eq.id).put(eq)}
            onRegisterEquipment={(n, s, m) => {
              const id = `eq-${Date.now()}`;
              gun.get(MESH_NS).get('gear').get(id).put({ id, name: n, serialNumber: s, assignedToId: m, status: 'Good', lastUpdated: new Date().toISOString() });
            }}
            onSendMessage={(s,r,t) => {
               const id = `m-${Date.now()}`;
               gun.get(MESH_NS).get('msg_v19').get(id).put({ id, senderId: s, receiverId: r, text: t, timestamp: Date.now(), isRead: false });
            }}
            adminId={currentUser.id}
          />
        ) : (
          <MemberPortal 
            user={users.find(u => u.id === currentUser.id) || currentUser}
            allUsers={users}
            equipments={equipments.filter(e => e.assignedToId === currentUser.id)}
            messages={messages}
            onMarkAttendance={markAttendance}
            onToggleTracking={() => setTrackingActive(!trackingActive)}
            onUpdateLocation={handleUpdateLocation}
            isTracking={trackingActive}
            onSendMessage={(t) => {
               const id = `m-${Date.now()}`;
               gun.get(MESH_NS).get('msg_v19').get(id).put({ id, senderId: currentUser.id, receiverId: 'admin-1', text: t, timestamp: Date.now(), isRead: false });
            }}
            onAddWorkUpdate={(t) => {
              const id = `w-${Date.now()}`;
              gun.get(MESH_NS).get('work_v19').get(id).put({ id, userId: currentUser.id, task: t, timestamp: Date.now() });
            }}
          />
        )}
      </main>
    </div>
  );
};

export default App;
