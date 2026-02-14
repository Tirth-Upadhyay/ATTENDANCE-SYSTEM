
export enum Role {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER'
}

export interface LocationPoint {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface Geofence {
  center: LocationPoint;
  radiusLat: number;
  radiusLng: number;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  department: string; // New field added
  role: Role;
  avatar: string;
  status: 'Online' | 'Offline';
  currentLocation?: LocationPoint;
  locationHistory: LocationPoint[];
  attendance: string[];
  isInsideGeofence?: boolean;
}

export interface Equipment {
  id: string;
  name: string;
  serialNumber: string;
  assignedToId: string;
  status: 'Good' | 'Needs Service' | 'Damaged';
  lastUpdated: string;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: number;
  isRead: boolean;
}

export interface WorkUpdate {
  id: string;
  userId: string;
  task: string;
  timestamp: number;
}
