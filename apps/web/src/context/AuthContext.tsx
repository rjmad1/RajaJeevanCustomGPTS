import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { verifyToken, checkMasterPassphrase, generateToken } from '../utils/tokenManager';

export interface LocalUser {
  uid: string;
  email: string;
  displayName: string;
}

interface AuthContextType {
  user: LocalUser | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, token: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    async function restoreSession() {
      const savedToken = localStorage.getItem('access_pass_token');
      const savedEmail = localStorage.getItem('access_pass_email');

      if (savedToken && savedEmail) {
        // Check if master passphrase
        if (checkMasterPassphrase(savedEmail, savedToken)) {
          setUser({
            uid: 'admin-uid',
            email: 'rajajeevankumar@gmail.com',
            displayName: 'Raja Jeevan (Admin)'
          });
          setProfile({
            id: 'admin-uid',
            email: 'rajajeevankumar@gmail.com',
            name: 'Raja Jeevan',
            role: 'super_admin',
            status: 'approved'
          });
        } else {
          // Verify cryptographic token
          const payload = await verifyToken(savedToken);
          if (payload && payload.email === savedEmail.toLowerCase().trim()) {
            setUser({
              uid: payload.email,
              email: payload.email,
              displayName: payload.email.split('@')[0]
            });
            setProfile({
              id: payload.email,
              email: payload.email,
              name: payload.email.split('@')[0],
              role: payload.role,
              status: 'approved',
              accessExpiresAt: payload.expiresAt
            });
          } else {
            // Invalid/expired session, clear it
            localStorage.removeItem('access_pass_token');
            localStorage.removeItem('access_pass_email');
          }
        }
      }
      setLoading(false);
    }
    restoreSession();
  }, []);

  const login = async (email: string, token: string): Promise<boolean> => {
    const emailClean = email.toLowerCase().trim();
    const tokenClean = token.trim();

    try {
      setLoading(true);

      // 1. Handle Master Admin Login
      if (checkMasterPassphrase(emailClean, tokenClean)) {
        // Generate a valid permanent token for rajajeevankumar@gmail.com
        const adminToken = await generateToken(emailClean, 'forever');
        
        localStorage.setItem('access_pass_token', adminToken);
        localStorage.setItem('access_pass_email', emailClean);

        setUser({
          uid: 'admin-uid',
          email: emailClean,
          displayName: 'Raja Jeevan (Admin)'
        });
        setProfile({
          id: 'admin-uid',
          email: emailClean,
          name: 'Raja Jeevan',
          role: 'super_admin',
          status: 'approved'
        });
        
        return true;
      }

      // 2. Handle Guest Cryptographic Pass Login
      const payload = await verifyToken(tokenClean);
      if (!payload) {
        throw new Error("Invalid or corrupted access pass.");
      }

      if (payload.email !== emailClean) {
        throw new Error(`This access pass was issued for email: ${payload.email}`);
      }

      if (payload.expiresAt < Date.now()) {
        throw new Error("This access pass has expired.");
      }

      localStorage.setItem('access_pass_token', tokenClean);
      localStorage.setItem('access_pass_email', emailClean);

      setUser({
        uid: payload.email,
        email: payload.email,
        displayName: payload.email.split('@')[0]
      });
      setProfile({
        id: payload.email,
        email: payload.email,
        name: payload.email.split('@')[0],
        role: payload.role,
        status: 'approved',
        accessExpiresAt: payload.expiresAt
      });

      return true;
    } catch (err) {
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('access_pass_token');
    localStorage.removeItem('access_pass_email');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
