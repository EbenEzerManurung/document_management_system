"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { userAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import { Users, Search, UserCheck, UserX, Eye, RefreshCw, User } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';

interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  division: string;
  role: string;
  profile_image: string;
  is_active: boolean;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setCurrentUser(parsed);
        if (!['head_manager', 'super_admin'].includes(parsed.role)) {
        router.push('/dashboard');
        toast.warning('Hanya Head Manager dan Super Admin yang dapat mengakses halaman ini');
        return;
      }
     
      fetchUsers(parsed.division);
    } else {
      router.push('/login');
    }
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const fetchUsers = async (division: string) => {
    try {
      const response = await userAPI.getUsersByDivision(division);
      console.log('Users data:', response.data.data);
      setUsers(response.data.data || []);
      setFilteredUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Gagal mengambil data user');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    setActionLoading(userId);
    try {
      if (currentStatus) {
        await userAPI.deactivateUser(userId);
        toast.success('User berhasil dinonaktifkan');
      } else {
        await userAPI.activateUser(userId);
        toast.success('User berhasil diaktifkan');
      }
      // Refresh user list
      if (currentUser) {
        await fetchUsers(currentUser.division);
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Gagal mengubah status user');
    } finally {
      setActionLoading(null);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar user={null} />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  // Pisahkan user aktif dan tidak aktif
  const activeUsers = filteredUsers.filter(user => user.is_active);
  const inactiveUsers = filteredUsers.filter(user => !user.is_active);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={currentUser} />
      <div className="flex-1 ml-64 p-6">
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Manage User</h1>
              <p className="text-slate-500 mt-1">Kelola semua user di divisi Anda</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Cari user..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => currentUser && fetchUsers(currentUser.division)}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  List User
                </span>
                <div className="flex items-center gap-3">
                  <Badge variant="success" className="text-sm">
                    Aktif: {activeUsers.length}
                  </Badge>
                  {inactiveUsers.length > 0 && (
                    <Badge variant="destructive" className="text-sm">
                      Nonaktif: {inactiveUsers.length}
                    </Badge>
                  )}
                  <Badge variant="info" className="text-sm">
                    Total: {filteredUsers.length}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">
                    {searchTerm ? 'User tidak ditemukan' : 'Belum ada user di divisi ini'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">User</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Email</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Divisi</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Role</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Status</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* User Aktif */}
                      {activeUsers.map((user) => (
                        <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                {getInitials(user.full_name)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900">{user.full_name}</p>
                                <p className="text-xs text-slate-500">@{user.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-700">{user.email}</td>
                          <td className="py-3 px-4 text-sm text-slate-700">{user.division}</td>
                          <td className="py-3 px-4">
                            <Badge variant={user.role === 'head_manager' ? 'success' : 'secondary'}>
                              {user.role === 'head_manager' ? 'Head Manager' : 'Staff'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="success">Aktif</Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link href={`/users/${user.id}`}>
                                <Button variant="ghost" size="sm" title="Detail User">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                              {currentUser?.id !== user.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleToggleStatus(user.id, user.is_active)}
                                  disabled={actionLoading === user.id}
                                  title="Nonaktifkan User"
                                >
                                  {actionLoading === user.id ? (
                                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <UserX className="w-4 h-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}

                      {/* User Nonaktif */}
                      {inactiveUsers.map((user) => (
                        <tr key={user.id} className="border-b border-slate-100 bg-slate-50 opacity-70 hover:bg-slate-100 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                {getInitials(user.full_name)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-600">{user.full_name}</p>
                                <p className="text-xs text-slate-400">@{user.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-500">{user.email}</td>
                          <td className="py-3 px-4 text-sm text-slate-500">{user.division}</td>
                          <td className="py-3 px-4">
                            <Badge variant="secondary">
                              {user.role === 'head_manager' ? 'Head Manager' : 'Staff'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="destructive">Nonaktif</Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link href={`/users/${user.id}`}>
                                <Button variant="ghost" size="sm" title="Detail User">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                              {currentUser?.id !== user.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-500 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleToggleStatus(user.id, user.is_active)}
                                  disabled={actionLoading === user.id}
                                  title="Aktifkan User"
                                >
                                  {actionLoading === user.id ? (
                                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <UserCheck className="w-4 h-4" />
                                  )}
                                </Button>
                              )}
                              <span className="text-xs text-slate-400 italic">(Nonaktif)</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
