"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { userAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Building2, 
  Shield,
  Edit,
  Save,
  X,
  Users,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';

interface UserDetail {
  id: string;
  username: string;
  email: string;
  full_name: string;
  division: string;
  role: string;
  profile_image: string;
  digital_signature: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    profile_image: '',
    digital_signature: '',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    } else {
      router.push('/login');
    }
    if (userId && userId !== '[object Object]') {
      fetchUser();
    }
  }, [userId]);

  const fetchUser = async () => {
    try {
      const response = await userAPI.getUserById(userId);
      const data = response.data.data;
      setUser(data);
      setFormData({
        full_name: data.full_name || '',
        profile_image: data.profile_image || '',
        digital_signature: data.digital_signature || '',
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Gagal mengambil data user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      await userAPI.updateProfile({
        full_name: formData.full_name,
        profile_image: formData.profile_image,
        digital_signature: formData.digital_signature,
      });
      toast.success('User berhasil diupdate');
      setEditing(false);
      fetchUser();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Gagal update user');
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar user={currentUser} />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar user={currentUser} />
        <div className="flex-1 ml-64 p-6">
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">User tidak ditemukan</p>
            <Link href="/users">
              <Button variant="blue" className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={currentUser} />
      <div className="flex-1 ml-64 p-6">
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/users">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-slate-900">Detail User</h1>
            </div>
            <div className="flex items-center gap-2">
              {!editing ? (
                <Button onClick={() => setEditing(true)} variant="blue">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button onClick={() => setEditing(false)} variant="outline">
                    <X className="w-4 h-4 mr-2" />
                    Batal
                  </Button>
                  <Button onClick={handleUpdate} variant="blue">
                    <Save className="w-4 h-4 mr-2" />
                    Simpan
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <Card className="border-0 shadow-sm lg:col-span-1">
              <CardContent className="p-6 text-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-white text-4xl font-bold mx-auto overflow-hidden">
                  {user.profile_image ? (
                    <img 
                      src={user.profile_image} 
                      alt={user.full_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span className="text-5xl font-bold text-white">
                      {getInitials(user.full_name)}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-4">{user.full_name}</h2>
                <p className="text-slate-500">@{user.username}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge variant="info">{user.division}</Badge>
                  <Badge variant={user.role === 'head_manager' ? 'success' : 'secondary'}>
                    {user.role === 'head_manager' ? 'Head Manager' : 'Staff'}
                  </Badge>
                  <Badge variant={user.is_active ? 'success' : 'destructive'}>
                    {user.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-0 shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Informasi User
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  // Edit Mode
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nama Lengkap</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      />
                    </div>
                    
                   
                  </>
                ) : (
                  // View Mode
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-500">Nama Lengkap</p>
                        <p className="font-medium">{user.full_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Username</p>
                        <p className="font-medium">@{user.username}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Email</p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Divisi</p>
                        <p className="font-medium">{user.division}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Role</p>
                        <p className="font-medium">{user.role === 'head_manager' ? 'Head Manager' : 'Staff'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Status</p>
                        <p className={`font-medium ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>
                          {user.is_active ? 'Aktif' : 'Nonaktif'}
                        </p>
                      </div>
                    </div>
                  
                  
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
