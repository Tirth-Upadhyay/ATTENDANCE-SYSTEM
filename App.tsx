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

// V17: ULTRA-SYNC RELAYS
const gun = Gun({
  peers: [
    'https://gun-manhattan.herokuapp.com/gun',
    'https://relay.gun.one/gun',
    'https://gundb-relay.herokuapp.com/gun',
    'https://gun-us.herokuapp.com/gun',
    'https://gun-eu.herokuapp.com/gun'
  ],
  localStorage: false // FORCE NETWORK SYNC - PREVENTS STALE LOCAL DATA
});

const MESH_NS = 'bcs-v17-ultra-mesh';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const [peers, setPeers] = useState<string[]>([]);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [equipments, setEquipments] = useState<Equipment[]>(INITIAL_EQUIPMENT);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [workUpdates, setWorkUpdates] = useState<WorkUpdate[]>([]);
  const [lastPacketTime, setLastPacketTime] = useState(0);

  // Connection Monitor
  useEffect(() => {
    const timer = setInterval(() => {
      const p = (gun as any)._?.opt?.peers || {};
      const active = Object.keys(p).filter(key => p[key]?.wire?.readyState === 1);
      setPeers(active);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // MASTER SYNC ENGINE
  useEffect(() => {
    const db: any = gun.get(MESH_NS);

    // 1. BROADCAST PULSE (Wakes up the mesh)
    db.get('pulse').map().on((time: number, userId: string) => {
      setLastPacketTime(Date.now());
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, status: Date.now() - time < 15000 ? 'Online' : 'Offline' } : u
      ));
    });

    // 2. FLAT ATTENDANCE SYNC
    db.get('attendance_v17').map().on((val: number, flatKey: string) => {
      if (!val) return;
      setLastPacketTime(Date.now());
      const parts = flatKey.split('_');
      const userId = parts[1];
      const sessionKey = parts[2];
      
      setUsers(prev => prev.map(u => {
        if (u.id === userId && !u.attendance.includes(sessionKey)) {
          return { ...u, attendance: [...u.attendance, sessionKey] };
        }
        return u;
      }));
    });

    // 3. LOCATION TRACKER
    db.get('geo_v17').map().on((data: string, userId: string) => {
      if (!data) return;
      setLastPacketTime(Date.now());
      try {
        const loc = JSON.parse(data);
        setUsers(prev => prev.map(u => {
          if (u.id === userId) {
            return {
              ...u,
              currentLocation: loc,
              isInsideGeofence: Math.abs(loc.lat - GEOFENCE.center.lat) <= GEOFENCE.radiusLat &&
                               Math.abs(loc.lng - GEOFENCE.center.lng) <= GEOFENCE.radiusLng
            };
          }
          return u;
        }));
      } catch (e) {}
    });

    // 4. CHAT & WORK
    db.get('chat_v17').map().on((data: any) => {
      if (!data?.id) return;
      setMessages(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data].sort((a,b) => a.timestamp - b.timestamp));
    });

    db.get('work_v17').map().on((data: any) => {
      if (!data?.id) return;
      setWorkUpdates(prev => prev.some(w => w.id === data.id) ? prev : [data, ...prev].sort((a,b) => b.timestamp - a.timestamp));
    });

  }, []);

  // BROADCAST SELF PULSE
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      const pulse = setInterval(() => {
        gun.get(MESH_NS).get('pulse').get(currentUser.id).put(Date.now());
      }, 5000);
      return () => clearInterval(pulse);
    }
  }, [isLoggedIn, currentUser]);

  const handleUpdateLocation = useCallback((userId: string, lat: number, lng: number) => {
    const point = { lat, lng, timestamp: Date.now() };
    gun.get(MESH_NS).get('geo_v17').get(userId).put(JSON.stringify(point));
  }, []);

  const markAttendance = useCallback((userId: string, day: number, session: number) => {
    const sessionKey = `D${day}S${session}`;
    const flatKey = `att_${userId}_${sessionKey}`;
    gun.get(MESH_NS).get('attendance_v17').get(flatKey).put(Date.now());
  }, []);

  if (!isLoggedIn || !currentUser) {
    return <Login users={users} onLogin={(u) => { setCurrentUser(u); setIsLoggedIn(true); }} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 font-sans text-slate-200">
      {/* TACTICAL SIGNAL BAR */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-1.5 flex justify-between items-center text-[8px] font-black uppercase tracking-[0.2em] z-50">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${peers.length > 0 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`}></div>
            <span>{peers.length > 0 ? `LINK_STABLE [${peers.length} PEERS]` : 'LINK_OFFLINE'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${Date.now() - lastPacketTime < 5000 ? 'bg-indigo-400 animate-ping' : 'bg-slate-700'}`}></div>
            <span>TRAFFIC_SIGNAL</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <span className="text-slate-500">OPERATOR: <span className="text-white">{currentUser.name}</span></span>
           <button onClick={() => { setIsLoggedIn(false); setCurrentUser(null); }} className="text-slate-600 hover:text-red-500">TERMINATE</button>
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
               gun.get(MESH_NS).get('chat_v17').get(id).put({ id, senderId: s, receiverId: r, text: t, timestamp: Date.now(), isRead: false });
            }}
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
            onSendMessage={(t) => {
               const id = `m-${Date.now()}`;
               gun.get(MESH_NS).get('chat_v17').get(id).put({ id, senderId: currentUser.id, receiverId: 'admin-1', text: t, timestamp: Date.now(), isRead: false });
            }}
            onAddWorkUpdate={(t) => {
              const id = `w-${Date.now()}`;
              gun.get(MESH_NS).get('work_v17').get(id).put({ id, userId: currentUser.id, task: t, timestamp: Date.now() });
            }}
          />
        )}
      </main>
    </div>
  );
};

export default App;