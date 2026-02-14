
import React, { useState, useEffect } from 'react';
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

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [equipments, setEquipments] = useState<Equipment[]>(INITIAL_EQUIPMENT);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [workUpdates, setWorkUpdates] = useState<WorkUpdate[]>([]);
  const [trackingActive, setTrackingActive] = useState(false);

  const checkGeofence = (point: LocationPoint): boolean => {
    return (
      Math.abs(point.lat - GEOFENCE.center.lat) <= GEOFENCE.radiusLat &&
      Math.abs(point.lng - GEOFENCE.center.lng) <= GEOFENCE.radiusLng
    );
  };

  const handleUpdateLocation = (userId: string, lat: number, lng: number) => {
    const newPoint: LocationPoint = { lat, lng, timestamp: Date.now() };
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          status: 'Online',
          currentLocation: newPoint,
          isInsideGeofence: checkGeofence(newPoint),
          locationHistory: [...(u.locationHistory || []), newPoint].slice(-20)
        };
      }
      return u;
    }));
  };

  // Telemetry Simulation Fix: Ensure Online status is set for map visibility
  useEffect(() => {
    let interval: any;
    if (trackingActive) {
      interval = setInterval(() => {
        setUsers(prevUsers => prevUsers.map(u => {
          if (u.id !== currentUser?.id) {
            const offset = 0.006;
            const simulatedPoint: LocationPoint = {
              lat: GEOFENCE.center.lat + (Math.random() - 0.5) * offset,
              lng: GEOFENCE.center.lng + (Math.random() - 0.5) * offset,
              timestamp: Date.now()
            };
            // Map visibility requirement: Status must be 'Online'
            return {
              ...u,
              status: 'Online', 
              currentLocation: simulatedPoint,
              isInsideGeofence: checkGeofence(simulatedPoint),
              locationHistory: [...(u.locationHistory || []), simulatedPoint].slice(-15)
            };
          }
          return u;
        }));
      }, 5000);
    } else {
      setUsers(prevUsers => prevUsers.map(u => {
        if (u.id !== currentUser?.id) {
          return { ...u, status: 'Offline' };
        }
        return u;
      }));
    }
    return () => clearInterval(interval);
  }, [trackingActive, currentUser?.id]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    if (user.role === Role.ADMIN) setTrackingActive(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setTrackingActive(false);
  };

  const markAttendance = (userId: string, day: number, session: number) => {
    const sessionKey = `D${day}S${session}`;
    setUsers(prev => prev.map(u => 
      u.id === userId && !u.attendance.includes(sessionKey)
        ? { ...u, attendance: [...u.attendance, sessionKey] }
        : u
    ));
  };

  const updateEquipment = (eq: Equipment) => {
    setEquipments(prev => prev.map(e => e.id === eq.id ? eq : e));
  };

  const registerEquipment = (name: string, sn: string, memberId: string) => {
    const newEq: Equipment = {
      id: `eq-${Date.now()}`,
      name,
      serialNumber: sn,
      assignedToId: memberId,
      status: 'Good',
      lastUpdated: new Date().toISOString()
    };
    setEquipments(prev => [...prev, newEq]);
  };

  const sendChatMessage = (senderId: string, receiverId: string, text: string) => {
    const newMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      senderId,
      receiverId,
      text,
      timestamp: Date.now(),
      isRead: false
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addWorkUpdate = (userId: string, task: string) => {
    const update: WorkUpdate = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      task,
      timestamp: Date.now()
    };
    setWorkUpdates(prev => [update, ...prev]);
  };

  if (!isLoggedIn || !currentUser) {
    return <Login users={users} onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-slate-900 text-white p-2 text-xs flex justify-between items-center px-6 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${trackingActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></div>
            <span className="font-mono uppercase tracking-tighter text-[10px]">Signal: {trackingActive ? 'Syncing' : 'IDLE'}</span>
          </div>
          <span>|</span>
          <span>Logged in as: <strong>{currentUser.name}</strong></span>
        </div>
        <div className="flex items-center gap-4">
          {currentUser.role === Role.ADMIN && (
             <button 
              onClick={() => setTrackingActive(!trackingActive)}
              className={`text-[9px] font-black uppercase px-3 py-1 rounded-md transition-all ${trackingActive ? 'bg-emerald-600' : 'bg-slate-700 text-slate-400'}`}
             >
               {trackingActive ? 'Pause Simulation' : 'Start Simulation'}
             </button>
          )}
          <button 
            onClick={handleLogout}
            className="bg-slate-800 hover:bg-red-600 px-3 py-1 rounded font-medium transition-colors border border-slate-700"
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
