"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { userAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import { 
  User, 
  Key, 
  Save, 
  X,
  PenTool,
  Upload,
  Camera,
  Users
} from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  full_name: string;
  division: string;
  role: string;
  profile_image: string;
  digital_signature: string;
  is_active: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const [formData, setFormData] = useState({
    full_name: '',
    profile_image: '',
  });
  
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }
    fetchProfile();
  }, [refreshKey]);

  const fetchProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      const data = response.data.data;
      console.log('Profile fetched:', data.full_name);
      console.log('Image URL:', data.profile_image);
      setUser(data);
      setFormData({
        full_name: data.full_name || '',
        profile_image: data.profile_image || '',
      });
      
      // Update local storage with latest data
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.profile_image = data.profile_image || '';
        parsed.full_name = data.full_name;
        localStorage.setItem('user', JSON.stringify(parsed));
      }
      
      // Trigger storage event for sidebar
      window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Gagal mengambil data profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await userAPI.updateProfile({
        full_name: formData.full_name,
      });
      toast.success('Profile berhasil diupdate!');
      setEditing(false);
      await fetchProfile();
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Gagal update profile');
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Password baru dan konfirmasi password tidak sama');
      return;
    }
    if (passwordData.new_password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }

    try {
      await userAPI.changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      });
      toast.success('Password berhasil diubah!');
      setChangingPassword(false);
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Gagal mengubah password');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2MB');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('File harus berupa gambar (JPG, PNG, GIF, WEBP)');
      return;
    }

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64String = event.target?.result as string;
          console.log('Uploading image, length:', base64String.length);
          
          await userAPI.updateProfileImage({
            profile_image: base64String,
          });
          
          toast.success('Foto profile berhasil diupdate!');
          
          // Refresh profile data
          await fetchProfile();
          
          // Force sidebar refresh
          setRefreshKey(prev => prev + 1);
          
          // Trigger storage event
          window.dispatchEvent(new Event('storage'));
          
          setUploadingImage(false);
        } catch (err) {
          console.error('Upload error:', err);
          toast.error('Gagal upload foto');
          setUploadingImage(false);
        }
      };
      reader.onerror = () => {
        toast.error('Gagal membaca file');
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Gagal upload foto');
      setUploadingImage(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http') || imagePath.startsWith('/uploads')) {
      return `http://localhost:8080${imagePath}`;
    }
    if (imagePath.startsWith('data:image')) {
      return imagePath;
    }
    return null;
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

  const imageUrl = getImageUrl(user?.profile_image || '');

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 ml-64 p-6">
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Profile</h1>
            <p className="text-slate-500 mt-1">Kelola informasi akun Anda</p>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-blue-600" />
                  Ganti Password
                </CardTitle>
                {!changingPassword ? (
                  <Button variant="outline" size="sm" onClick={() => setChangingPassword(true)}>
                    <Key className="w-4 h-4 mr-2" />
                    Ganti Password
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      setChangingPassword(false);
                      setPasswordData({
                        old_password: '',
                        new_password: '',
                        confirm_password: '',
                      });
                    }}>
                      <X className="w-4 h-4 mr-1" />
                      Batal
                    </Button>
                    <Button variant="blue" size="sm" onClick={handleChangePassword}>
                      <Save className="w-4 h-4 mr-1" />
                      Simpan Password
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            {changingPassword && (
              <CardContent>
                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="old_password">Password Lama</Label>
                    <Input
                      id="old_password"
                      type="password"
                      value={passwordData.old_password}
                      onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                      placeholder="Masukkan password lama"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new_password">Password Baru</Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                      placeholder="Minimal 6 karakter"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Konfirmasi Password Baru</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                      placeholder="Konfirmasi password baru"
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-0 shadow-sm lg:col-span-1">
              <CardContent className="p-6 text-center">
                <div className="relative inline-block group">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center text-white text-4xl font-bold mx-auto overflow-hidden">
                    {imageUrl ? (
                      <img 
                        key={refreshKey}
                        src={imageUrl} 
                        alt={user?.full_name || 'User'}
                        className="w-full h-full object-cover"
                        onError={() => {
                          console.log('Image load error, using initials');
                        }}
                      />
                    ) : null}
                    {(!imageUrl || imageUrl === 'null') && (
                      <span className="text-5xl font-bold text-white">
                        {getInitials(user?.full_name || '')}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition-colors shadow-lg"
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-4">{user?.full_name}</h2>
                <p className="text-slate-500">{user?.email}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {user?.division}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user?.role === 'head_manager' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user?.role === 'head_manager' ? 'Head Manager' : 'Staff'}
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-500">Status</p>
                  <p className={`font-medium ${user?.is_active ? 'text-green-600' : 'text-red-600'}`}>
                    {user?.is_active ? 'Aktif' : 'Nonaktif'}
                  </p>
                </div>
              
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Informasi Profile
                  </CardTitle>
                  {!editing ? (
                    <Button variant="blue" size="sm" onClick={() => setEditing(true)}>
                      <PenTool className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditing(false);
                        setFormData({
                          full_name: user?.full_name || '',
                          profile_image: user?.profile_image || '',
                        });
                      }}>
                        <X className="w-4 h-4 mr-1" />
                        Batal
                      </Button>
                      <Button variant="blue" size="sm" onClick={handleUpdateProfile}>
                        <Save className="w-4 h-4 mr-1" />
                        Simpan
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nama Lengkap</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Nama lengkap"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={user?.email || ''} disabled className="bg-slate-50" />
                      <p className="text-xs text-slate-500">Email tidak dapat diubah</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Divisi</Label>
                      <Input value={user?.division || ''} disabled className="bg-slate-50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Input value={user?.role === 'head_manager' ? 'Head Manager' : 'Staff'} disabled className="bg-slate-50" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profile_image">Foto Profile</Label>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Input
                            id="profile_image"
                            value={formData.profile_image || ''}
                            onChange={(e) => setFormData({ ...formData, profile_image: e.target.value })}
                            placeholder="Upload gambar"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                        >
                          <Upload className="w-4 h-4 mr-1" />
                          Upload
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500">Upload gambar (max 2MB)</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-500">Nama Lengkap</p>
                        <p className="font-medium">{user?.full_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Username</p>
                        <p className="font-medium">@{user?.username}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Email</p>
                        <p className="font-medium">{user?.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Divisi</p>
                        <p className="font-medium">{user?.division}</p>
                      </div>
                    </div>
                    {imageUrl && (
                      <div className="pt-4 border-t border-slate-200">
                        <p className="text-sm text-slate-500 mb-2">Foto Profile</p>
                        <img 
                          key={refreshKey}
                          src={imageUrl} 
                          alt={user?.full_name || 'User'} 
                          className="w-20 h-20 rounded-full object-cover border-2 border-blue-200"
                          onError={() => {
                            console.log('Profile image error');
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
