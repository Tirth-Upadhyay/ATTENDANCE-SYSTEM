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
    'https://peer.wall.org/gun',
    'https://gundb-relay.herokuapp.com/gun',
    'https://gun-us.herokuapp.com/gun'
  ]
});

// UNIQUE VERSIONED NAMESPACE
const MESH_NS = 'bcs-media-v16-flat';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const [peers, setPeers] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [equipments, setEquipments] = useState<Equipment[]>(INITIAL_EQUIPMENT);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [workUpdates, setWorkUpdates] = useState<WorkUpdate[]>([]);

  // Monitor Peers
  useEffect(() => {
    const timer = setInterval(() => {
      const p = (gun as any)._?.opt?.peers || {};
      const active = Object.keys(p).filter(key => p[key]?.wire?.readyState === 1);
      setPeers(active);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // MASTER SYNC - FLAT PATH ARCHITECTURE
  useEffect(() => {
    const db = gun.get(MESH_NS);

    // 1. FLAT ATTENDANCE LISTENER
    // Key format: "attendance_{userId}_{sessionKey}" -> timestamp
    db.get('attendance_flat').map().on((val: number, flatKey: string) => {
      if (!val) return;
      const [_, userId, sessionKey] = flatKey.split('_');
      if (!userId || !sessionKey) return;

      setUsers(prev => prev.map(u => {
        if (u.id === userId && !u.attendance.includes(sessionKey)) {
          return { ...u, attendance: [...u.attendance, sessionKey] };
        }
        return u;
      }));
    });

    // 2. FLAT LOCATION LISTENER
    db.get('locations_flat').map().on((data: string, userId: string) => {
      if (!data) return;
      try {
        const loc = JSON.parse(data);
        setUsers(prev => prev.map(u => {
          if (u.id === userId) {
            return {
              ...u,
              currentLocation: loc,
              status: 'Online',
              isInsideGeofence: Math.abs(loc.lat - GEOFENCE.center.lat) <= GEOFENCE.radiusLat &&
                               Math.abs(loc.lng - GEOFENCE.center.lng) <= GEOFENCE.radiusLng
            };
          }
          return u;
        }));
      } catch (e) {}
    });

    // 3. CHAT & WORK LISTENERS (Standard)
    db.get('chat_v2').map().on((data: any) => {
      if (!data || !data.id) return;
      setMessages(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data].sort((a,b) => a.timestamp - b.timestamp));
    });

    db.get('work_v2').map().on((data: any) => {
      if (!data || !data.id) return;
      setWorkUpdates(prev => prev.some(w => w.id === data.id) ? prev : [data, ...prev].sort((a,b) => b.timestamp - a.timestamp));
    });

  }, []);

  const handleUpdateLocation = useCallback((userId: string, lat: number, lng: number) => {
    const point = { lat, lng, timestamp: Date.now() };
    gun.get(MESH_NS).get('locations_flat').get(userId).put(JSON.stringify(point));
  }, []);

  const markAttendance = useCallback((userId: string, day: number, session: number) => {
    const sessionKey = `D${day}S${session}`;
    const flatKey = `attendance_${userId}_${sessionKey}`;
    // Put directly to flat node for instant mesh propagation
    gun.get(MESH_NS).get('attendance_flat').get(flatKey).put(Date.now());
  }, []);

  const sendChatMessage = (senderId: string, receiverId: string, text: string) => {
    const id = `m-${Date.now()}`;
    const msg: ChatMessage = { id, senderId, receiverId, text, timestamp: Date.now(), isRead: false };
    gun.get(MESH_NS).get('chat_v2').get(id).put(msg);
  };

  if (!isLoggedIn || !currentUser) {
    return <Login users={users} onLogin={(u) => { setCurrentUser(u); setIsLoggedIn(true); }} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 font-sans text-slate-200">
      {/* NETWORK HUD */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-1.5 flex justify-between items-center text-[8px] font-black uppercase tracking-[0.2em] z-50">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${peers.length > 0 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse' : 'bg-red-500'}`}></div>
            <span>{peers.length > 0 ? `MESH: STABLE [${peers.length} NODES]` : 'MESH: SEARCHING...'}</span>
          </div>
          <span className="text-slate-700">|</span>
          <span className="text-slate-500">OPERATOR: <span className="text-indigo-400">{currentUser.name}</span></span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-700 hidden md:block">VER: 16.0.4_STABLE</span>
          <button onClick={() => { setIsLoggedIn(false); setCurrentUser(null); }} className="text-slate-600 hover:text-red-500 transition-colors">TERMINATE_LINK</button>
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
            onSendMessage={sendChatMessage}
            adminId={currentUser.id}
          />
        ) : (
          <MemberPortal 
            user={users.find(u => u.id === currentUser.id) || currentUser}
            allUsers={users}
            equipments={equipments.filter(e => e.assignedToId === currentUser.id)}
            messages={messages}
            onMarkAttendance={(d, s) => markAttendance(currentUser.id, d, s)}
            onToggleTracking={() => setTrackingActive(!trackingActive)}
            onUpdateLocation={(lat, lng) => handleUpdateLocation(currentUser.id, lat, lng)}
            isTracking={trackingActive}
            onSendMessage={(t) => sendChatMessage(currentUser.id, 'admin-1', t)}
            onAddWorkUpdate={(t) => {
              const id = `w-${Date.now()}`;
              gun.get(MESH_NS).get('work_v2').get(id).put({ id, userId: currentUser.id, task: t, timestamp: Date.now() });
            }}
          />
        )}
      </main>
    </div>
  );
};

export default App;