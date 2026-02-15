import React, { useState, useEffect, useMemo } from 'react';
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

// Initialize Gun with public relay peers for cross-device sync
const gun = Gun({
  peers: [
    'https://gun-manhattan.herokuapp.com/gun',
    'https://gun-us.herokuapp.com/gun'
  ]
});

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'CONNECTED'>('IDLE');

  // State Mirror
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [equipments, setEquipments] = useState<Equipment[]>(INITIAL_EQUIPMENT);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [workUpdates, setWorkUpdates] = useState<WorkUpdate[]>([]);

  // 1. Initialize Gun Listeners
  useEffect(() => {
    setSyncStatus('SYNCING');
    
    // Sync Users (Attendance & Location)
    const userMap = gun.get('bcs-media-v4-users');
    userMap.map().on((data: any, id: string) => {
      if (!data) return;
      setUsers(prev => prev.map(u => {
        if (u.id === id) {
          const attendance = data.attendance ? JSON.parse(data.attendance) : u.attendance;
          const currentLocation = data.location ? JSON.parse(data.location) : u.currentLocation;
          return {
            ...u,
            attendance,
            currentLocation,
            status: data.status || u.status,
            isInsideGeofence: currentLocation ? checkGeofence(currentLocation) : u.isInsideGeofence
          };
        }
        return u;
      }));
    });

    // Sync Messages
    gun.get('bcs-media-v4-messages').map().on((data: any) => {
      if (!data) return;
      setMessages(prev => {
        if (prev.find(m => m.id === data.id)) return prev;
        return [...prev, data].sort((a, b) => a.timestamp - b.timestamp);
      });
    });

    // Sync Work Updates
    gun.get('bcs-media-v4-work').map().on((data: any) => {
      if (!data) return;
      setWorkUpdates(prev => {
        if (prev.find(w => w.id === data.id)) return prev;
        return [data, ...prev].sort((a, b) => b.timestamp - a.timestamp);
      });
    });

    // Sync Equipment
    gun.get('bcs-media-v4-gear').map().on((data: any) => {
      if (!data) return;
      setEquipments(prev => {
        const exists = prev.find(e => e.id === data.id);
        if (exists) return prev.map(e => e.id === data.id ? data : e);
        return [...prev, data];
      });
    });

    setSyncStatus('CONNECTED');
  }, []);

  const checkGeofence = (point: LocationPoint): boolean => {
    return (
      Math.abs(point.lat - GEOFENCE.center.lat) <= GEOFENCE.radiusLat &&
      Math.abs(point.lng - GEOFENCE.center.lng) <= GEOFENCE.radiusLng
    );
  };

  const handleUpdateLocation = (userId: string, lat: number, lng: number) => {
    const newPoint: LocationPoint = { lat, lng, timestamp: Date.now() };
    // Update local state immediately for responsiveness
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, currentLocation: newPoint, status: 'Online' } : u));
    
    // Broadcast to Mesh
    gun.get('bcs-media-v4-users').get(userId).put({
      location: JSON.stringify(newPoint),
      status: 'Online'
    });
  };

  const markAttendance = (userId: string, day: number, session: number) => {
    const sessionKey = `D${day}S${session}`;
    const userRef = users.find(u => u.id === userId);
    if (!userRef) return;

    if (!userRef.attendance.includes(sessionKey)) {
      const newAttendance = [...userRef.attendance, sessionKey];
      // Broadcast to Mesh
      gun.get('bcs-media-v4-users').get(userId).put({
        attendance: JSON.stringify(newAttendance)
      });
    }
  };

  const sendChatMessage = (senderId: string, receiverId: string, text: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newMessage: ChatMessage = {
      id,
      senderId,
      receiverId,
      text,
      timestamp: Date.now(),
      isRead: false
    };
    // Broadcast to Mesh
    gun.get('bcs-media-v4-messages').get(id).put(newMessage);
  };

  const addWorkUpdate = (userId: string, task: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const update: WorkUpdate = {
      id,
      userId,
      task,
      timestamp: Date.now()
    };
    // Broadcast to Mesh
    gun.get('bcs-media-v4-work').get(id).put(update);
  };

  const updateEquipment = (eq: Equipment) => {
    gun.get('bcs-media-v4-gear').get(eq.id).put(eq);
  };

  const registerEquipment = (name: string, sn: string, memberId: string) => {
    const id = `eq-${Date.now()}`;
    const newEq: Equipment = {
      id,
      name,
      serialNumber: sn,
      assignedToId: memberId,
      status: 'Good',
      lastUpdated: new Date().toISOString()
    };
    gun.get('bcs-media-v4-gear').get(id).put(newEq);
  };

  const handleLogin = (user: User) => {
    const latestUser = users.find(u => u.id === user.id) || user;
    setCurrentUser(latestUser);
    setIsLoggedIn(true);
    // Mark online in mesh
    gun.get('bcs-media-v4-users').get(user.id).put({ status: 'Online' });
  };

  const handleLogout = () => {
    if (currentUser) {
      gun.get('bcs-media-v4-users').get(currentUser.id).put({ status: 'Offline' });
    }
    setIsLoggedIn(false);
    setCurrentUser(null);
    setTrackingActive(false);
  };

  if (!isLoggedIn || !currentUser) {
    return <Login users={users} onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-slate-900 text-white p-2 text-xs flex justify-between items-center px-6 z-50 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${syncStatus === 'CONNECTED' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-amber-500'}`}></div>
            <span className="font-mono uppercase tracking-tighter text-[10px]">
              {syncStatus === 'CONNECTED' ? 'CLOUD_SYNC: ACTIVE' : 'CLOUD_SYNC: LINKING...'}
            </span>
          </div>
          <span className="text-slate-700">|</span>
          <span>Personnel: <strong>{currentUser.name}</strong></span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleLogout}
            className="bg-slate-800 hover:bg-red-600 px-3 py-1 rounded font-medium transition-colors border border-slate-700 text-[10px] uppercase font-black"
          >
            Disconnect
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-auto bg-slate-950">
        {currentUser.role === Role.ADMIN ? (
          <AdminDashboard 
            users={users} 
            equipments={equipments}
            messages={messages}
            workUpdates={workUpdates}
            onUpdateEquipment={updateEquipment}
            onRegisterEquipment={registerEquipment}
            onSendMessage={sendChatMessage}
            adminId={currentUser.id}
          />
        ) : (
          <MemberPortal 
            user={users.find(u => u.id === currentUser.id)!}
            allUsers={users}
            equipments={equipments.filter(e => e.assignedToId === currentUser.id)}
            messages={messages}
            onMarkAttendance={(day, session) => markAttendance(currentUser.id, day, session)}
            onToggleTracking={() => setTrackingActive(!trackingActive)}
            onUpdateLocation={(lat, lng) => handleUpdateLocation(currentUser.id, lat, lng)}
            isTracking={trackingActive}
            onSendMessage={(text) => sendChatMessage(currentUser.id, 'admin-1', text)}
            onAddWorkUpdate={(task) => addWorkUpdate(currentUser.id, task)}
          />
        )}
      </main>
    </div>
  );
};

export default App;