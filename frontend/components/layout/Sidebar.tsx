"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  FileText, 
  User, 
  LogOut,
  Plus,
  CheckSquare,
  Users,
  QrCode
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  user: any;
}

export default function Sidebar({ user: initialUser }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [user, setUser] = useState(initialUser);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setUser(parsed);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, [refreshKey]);

  useEffect(() => {
    const handleStorageChange = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          setUser(parsed);
          setRefreshKey(prev => prev + 1);
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const isActive = (path: string) => {
    return pathname?.startsWith(path);
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/memos', label: 'Memo', icon: FileText },
    { path: '/memos/create', label: 'Create Memo', icon: Plus },
    { path: '/scan', label: 'Scan QR', icon: QrCode },
  ];

  if (user?.role === 'head_manager') {
    menuItems.push({ path: '/memos/pending', label: 'Pending Approval', icon: CheckSquare });
    menuItems.push({ path: '/users', label: 'Manage User', icon: Users });
  }

    if (user?.role === 'super_admin') {
    menuItems.push({ path: '/memos/pending', label: 'Pending Approval', icon: CheckSquare });
    menuItems.push({ path: '/users', label: 'Manage User', icon: Users });
  }


  menuItems.push({ path: '/profile', label: 'Profile', icon: User });

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const getImageUrl = (imagePath: any) => {
    if (!imagePath || typeof imagePath !== 'string') return null;
    if (imagePath.trim() === '') return null;
    if (imagePath.startsWith('http') || imagePath.startsWith('/uploads')) {
      return `http://localhost:8080${imagePath}`;
    }
    if (imagePath.startsWith('data:image')) return imagePath;
    return null;
  };

  const imageUrl = getImageUrl(user?.profile_image);

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-40 h-full bg-white border-r border-slate-200 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className={cn(
          "p-4 border-b border-slate-200 flex items-center",
          collapsed ? "justify-center" : "gap-3"
        )}>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            D
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-slate-900">DMS</h1>
              <p className="text-xs text-slate-500">Document Management</p>
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 bg-white border border-slate-200 rounded-full p-1 shadow-sm hover:bg-slate-50"
        >
          {collapsed ? (
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7" />
            </svg>
          )}
        </button>

        {/* User Info */}
        {user && !collapsed && (
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden">
                {imageUrl ? (
                  <img 
                    key={refreshKey}
                    src={imageUrl} 
                    alt={user.full_name} 
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                    onLoad={() => setImageError(false)}
                  />
                ) : (
                  <span className="text-base font-bold">{getInitials(user.full_name)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user.full_name}</p>
                <p className="text-xs text-slate-500 truncate">
                  {user.role === 'head_manager' ? 'Head Manager' : 'Staff'} • {user.division}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center rounded-lg transition-all",
                collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
                isActive(item.path)
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className={cn(
          "p-4 border-t border-slate-200",
          collapsed ? "flex justify-center" : ""
        )}>
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center rounded-lg transition-all text-red-600 hover:bg-red-50",
              collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2.5 w-full"
            )}
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
