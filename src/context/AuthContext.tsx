import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Role, RolePermission, ScreenKey, ActionKey } from '../types/database';
import { db } from '../services/dbStore';

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  switchUser: (userId: number) => void;
  updatePassword: (newPass: string) => boolean;
  allUsers: User[];
  allRoles: Role[];
  allPermissions: RolePermission[];
  selectedBranchFilter: number | null; // null means all branches
  setSelectedBranchFilter: (branchId: number | null) => void;
  hasPermission: (screen: ScreenKey, action: ActionKey) => boolean;
  canAccessScreen: (screen: ScreenKey) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dbState, setDbState] = useState(db.getState());
  const [currentUserId, setCurrentUserId] = useState<number | null>(() => {
    const saved = localStorage.getItem('albahri_current_user_id');
    return saved ? parseInt(saved, 10) : null;
  });
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<number | null>(null);

  useEffect(() => {
    return db.subscribe(() => {
      setDbState({ ...db.getState() });
    });
  }, []);

  const currentUser = currentUserId ? dbState.users.find((u) => u.UserID === currentUserId && u.IsActive === 1) || null : null;

  const hasPermission = useCallback((screen: ScreenKey, action: ActionKey): boolean => {
    return db.hasPermission(currentUser, screen, action);
  }, [currentUser, dbState.rolePermissions, dbState.roles]);

  const canAccessScreen = useCallback((screen: ScreenKey): boolean => {
    return db.canAccessScreen(currentUser, screen);
  }, [currentUser, dbState.rolePermissions, dbState.roles]);

  const login = (username: string, password: string): boolean => {
    const found = dbState.users.find(
      (u) => u.UserName.toLowerCase() === username.trim().toLowerCase() && u.PasswordHash === password && u.IsActive === 1
    );
    if (found) {
      setCurrentUserId(found.UserID);
      localStorage.setItem('albahri_current_user_id', found.UserID.toString());
      db.logAudit(found.UserID, 'LOGIN', 'tblUsers', found.UserID, `تسجيل دخول ناجح (${found.UserName})`);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUserId(null);
    localStorage.removeItem('albahri_current_user_id');
    setSelectedBranchFilter(null);
  };

  const switchUser = (userId: number) => {
    const target = dbState.users.find((u) => u.UserID === userId && u.IsActive === 1);
    if (target) {
      setCurrentUserId(userId);
      localStorage.setItem('albahri_current_user_id', userId.toString());
      db.logAudit(userId, 'LOGIN', 'tblUsers', userId, `تبديل الحساب إلى (${target.UserName} - ${target.Role})`);
    }
  };

  const updatePassword = (newPass: string): boolean => {
    if (!currentUser) return false;
    return db.updatePassword(currentUser.UserID, newPass);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        logout,
        switchUser,
        updatePassword,
        allUsers: dbState.users,
        allRoles: dbState.roles,
        allPermissions: dbState.rolePermissions,
        selectedBranchFilter,
        setSelectedBranchFilter,
        hasPermission,
        canAccessScreen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
