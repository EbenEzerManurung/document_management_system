"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { memoAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import { FileText, Send, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';

const createMemoSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter'),
  content: z.string().min(10, 'Isi memo minimal 10 karakter'),
  division: z.string().min(1, 'Divisi harus dipilih'),
});

type CreateMemoFormData = z.infer<typeof createMemoSchema>;

const allDivisions = ['HR', 'Accounting', 'Finance', 'Marketing', 'IT', 'Purchase', 'Claim'];

export default function CreateMemoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [availableDivisions, setAvailableDivisions] = useState<string[]>([]);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CreateMemoFormData>({
    resolver: zodResolver(createMemoSchema),
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      
      // Determine available divisions based on role
      if (parsed.role === 'super_admin') {
        // Super admin can send to all divisions
        setAvailableDivisions(allDivisions);
      } else if (parsed.role === 'head_manager') {
        // Head manager can send to all divisions
        setAvailableDivisions(allDivisions);
      } else {
        // Staff can only send to their own division
        setAvailableDivisions([parsed.division]);
        setValue('division', parsed.division);
      }
    }
  }, []);

  const onSubmit = async (data: CreateMemoFormData) => {
    setLoading(true);
    try {
      console.log('Creating memo with data:', data);
      await memoAPI.create(data);
      toast.success('Memo berhasil dibuat!');
      router.push('/memos');
    } catch (error: any) {
      console.error('Error creating memo:', error);
      toast.error(error.response?.data?.message || 'Failed create memo');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar user={null} />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 ml-64 p-6">
        <div className="max-w-3xl mx-auto animate-fade-in">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/memos">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">CREATE NEW MEMO</h1>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Form Memo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Memo Title</Label>
                  <Input
                    id="title"
                    placeholder="Fill the Title"
                    {...register('title')}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="division">Division</Label>
                  <select
                    id="division"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    {...register('division')}
                    defaultValue={user?.division || ''}
                  >
                    <option value="">Pilih Divisi</option>
                    {availableDivisions.map((div) => (
                      <option key={div} value={div}>{div}</option>
                    ))}
                  </select>
                  {errors.division && (
                    <p className="text-sm text-red-500">{errors.division.message}</p>
                  )}
                  {user?.role === 'staff' && (
                    <p className="text-xs text-slate-500">
                     Staff members can only send memos to their own division.
                    </p>
                  )}
                  {(user?.role === 'head_manager' || user?.role === 'super_admin') && (
                    <p className="text-xs text-slate-500">
                      Anda dapat mengirim memo ke semua divisi
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content Memo</Label>
                  <textarea
                    id="content"
                    rows={8}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Please Fille the content here..."
                    {...register('content')}
                  />
                  {errors.content && (
                    <p className="text-sm text-red-500">{errors.content.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="loading-spinner w-5 h-5 border-2" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Memo
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
