import React, { useState, useEffect, useRef } from 'react';
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

// PRODUCTION PEERS: More reliable and distributed nodes
const gun = Gun({
  peers: [
    'https://relay.gun.one/gun',
    'https://gun-manhattan.herokuapp.com/gun',
    'https://peer.wall.org/gun'
  ]
});

const APP_KEY = 'bcs-media-v12-production';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const [networkHealth, setNetworkHealth] = useState({ peers: 0, latency: 0 });

  // Use a map for O(1) lookups during high-frequency sync
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [equipments, setEquipments] = useState<Equipment[]>(INITIAL_EQUIPMENT);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [workUpdates, setWorkUpdates] = useState<WorkUpdate[]>([]);

  // Monitor network health
  useEffect(() => {
    const check = setInterval(() => {
      const peers = (gun as any)._?.opt?.peers || {};
      const active = Object.values(peers).filter((p: any) => p?.wire?.readyState === 1).length;
      setNetworkHealth(h => ({ ...h, peers: active }));
    }, 5000);
    return () => clearInterval(check);
  }, []);

  // MASTER SYNC ENGINE
  useEffect(() => {
    // 1. Listen for Attendance (Granular)
    gun.get(`${APP_KEY}-attendance`).map().on((data: string, userId: string) => {
      if (!data) return;
      setUsers(prev => prev.map(u => {
        if (u.id === userId) {
          try {
            const list = JSON.parse(data);
            return { ...u, attendance: Array.isArray(list) ? list : u.attendance };
          } catch (e) { return u; }
        }
        return u;
      }));
    });

    // 2. Listen for Locations (Granular & Atomic)
    gun.get(`${APP_KEY}-locations`).map().on((data: string, userId: string) => {
      if (!data) return;
      setUsers(prev => prev.map(u => {
        if (u.id === userId) {
          try {
            const loc = JSON.parse(data);
            return { 
              ...u, 
              currentLocation: loc, 
              status: 'Online',
              isInsideGeofence: Math.abs(loc.lat - GEOFENCE.center.lat) <= GEOFENCE.radiusLat &&
                               Math.abs(loc.lng - GEOFENCE.center.lng) <= GEOFENCE.radiusLng
            };
          } catch (e) { return u; }
        }
        return u;
      }));
    });

    // 3. Listen for Messages
    gun.get(`${APP_KEY}-chat`).map().on((data: any) => {
      if (!data || !data.id) return;
      setMessages(prev => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, data].sort((a, b) => a.timestamp - b.timestamp);
      });
    });

    // 4. Listen for Work Updates
    gun.get(`${APP_KEY}-work`).map().on((data: any) => {
      if (!data || !data.id) return;
      setWorkUpdates(prev => {
        if (prev.some(w => w.id === data.id)) return prev;
        return [data, ...prev].sort((a, b) => b.timestamp - a.timestamp);
      });
    });
  }, []);

  const handleUpdateLocation = (userId: string, lat: number, lng: number) => {
    const point = { lat, lng, timestamp: Date.now() };
    // Atomic put to specialized location node
    gun.get(`${APP_KEY}-locations`).get(userId).put(JSON.stringify(point));
  };

  const markAttendance = (userId: string, day: number, session: number) => {
    const key = `D${day}S${session}`;
    const user = users.find(u => u.id === userId);
    if (user && !user.attendance.includes(key)) {
      const newList = [...user.attendance, key];
      gun.get(`${APP_KEY}-attendance`).get(userId).put(JSON.stringify(newList));
    }
  };

  const sendChatMessage = (senderId: string, receiverId: string, text: string) => {
    const id = `m-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const msg: ChatMessage = { id, senderId, receiverId, text, timestamp: Date.now(), isRead: false };
    gun.get(`${APP_KEY}-chat`).get(id).put(msg);
  };

  const addWorkUpdate = (userId: string, task: string) => {
    const id = `w-${Date.now()}`;
    const update = { id, userId, task, timestamp: Date.now() };
    gun.get(`${APP_KEY}-work`).get(id).put(update);
  };

  if (!isLoggedIn || !currentUser) {
    return <Login users={users} onLogin={(u) => { setCurrentUser(u); setIsLoggedIn(true); }} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-200">
      {/* Network HUD */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-1.5 flex justify-between items-center text-[9px] font-black tracking-widest uppercase">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${networkHealth.peers > 0 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse' : 'bg-red-600'}`}></div>
            <span>Network: {networkHealth.peers > 0 ? `LINKED [${networkHealth.peers} NODES]` : 'SEARCHING...'}</span>
          </div>
          <span className="text-slate-700">|</span>
          <span className="text-indigo-400">Personnel: {currentUser.name}</span>
        </div>
        <button onClick={() => { setIsLoggedIn(false); setCurrentUser(null); }} className="hover:text-red-500 transition-colors">Terminate Link</button>
      </div>

      <main className="flex-1 overflow-hidden">
        {currentUser.role === Role.ADMIN ? (
          <AdminDashboard 
            users={users} 
            equipments={equipments}
            messages={messages}
            workUpdates={workUpdates}
            onUpdateEquipment={(eq) => gun.get(`${APP_KEY}-gear`).get(eq.id).put(eq)}
            onRegisterEquipment={(n, s, m) => {
              const id = `eq-${Date.now()}`;
              gun.get(`${APP_KEY}-gear`).get(id).put({ id, name: n, serialNumber: s, assignedToId: m, status: 'Good', lastUpdated: new Date().toISOString() });
            }}
            onSendMessage={sendChatMessage}
            adminId={currentUser.id}
          />
        ) : (
          <MemberPortal 
            user={users.find(u => u.id === currentUser.id)!}
            allUsers={users}
            equipments={equipments.filter(e => e.assignedToId === currentUser.id)}
            messages={messages}
            onMarkAttendance={(d, s) => markAttendance(currentUser.id, d, s)}
            onToggleTracking={() => setTrackingActive(!trackingActive)}
            onUpdateLocation={(lat, lng) => handleUpdateLocation(currentUser.id, lat, lng)}
            isTracking={trackingActive}
            onSendMessage={(t) => sendChatMessage(currentUser.id, 'admin-1', t)}
            onAddWorkUpdate={(t) => addWorkUpdate(currentUser.id, t)}
          />
        )}
      </main>
    </div>
  );
};

export default App;