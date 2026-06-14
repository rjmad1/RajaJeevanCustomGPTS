export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'authorized_user' | 'suspended_user';
  status: 'pending_approval' | 'approved' | 'suspended';
  createdAt?: any;
  lastLogin?: any;
}

export interface Category {
  id: string;
  name: string; // 'Plan', 'Do', 'Check', 'Act'
  sortOrder: number;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  url: string;
  categoryId: string;
  createdBy: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Favorite {
  id: string;
  userId: string;
  agentId: string;
  createdAt: any;
}

export interface AccessCode {
  id: string;
  code: string;
  issuedTo: string;
  createdBy: string;
  createdAt: any;
  expiresAt: any;
  used: boolean;
  redeemedBy?: string;
  redeemedEmail?: string;
  redeemedAt?: any;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: any;
  details?: any;
}
