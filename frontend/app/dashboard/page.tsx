"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { memoAPI } from '@/lib/api';
import { formatDate, getStatusLabel } from '@/lib/utils';
import { FileText, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import Link from 'next/link';
import Sidebar from '@/components/layout/Sidebar';

interface Memo {
  id: string;
  memo_number: string;
  title: string;
  content: string;
  division: string;
  status: string;
  created_at: string;
  creator?: {
    full_name: string;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push('/login');
    }
    fetchMemos();
  }, []);

  const fetchMemos = async () => {
    try {
      const response = await memoAPI.getAll();
      const data = response.data.data || [];
      setMemos(data);
      
      const pending = data.filter((m: Memo) => m.status === 'pending').length;
      const approved = data.filter((m: Memo) => m.status === 'approved').length;
      const rejected = data.filter((m: Memo) => m.status === 'rejected').length;
      
      setStats({
        total: data.length,
        pending,
        approved,
        rejected,
      });
    } catch (error) {
      console.error('Error fetching memos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'draft',
      pending: 'pending',
      approved: 'approved',
      rejected: 'rejected',
      archived: 'secondary',
    };
    return colors[status] || 'default';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar user={null} />
        <div className="flex-1 flex items-center justify-center ml-64">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 ml-64 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back, {user?.full_name?.split(' ')[0] || 'User'} 👋
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {user?.role === 'head_manager' 
                ? `Head Manager of ${user?.division} Division` 
                : `${user?.division} Division Staff`}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total</p>
                    <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats.total}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-0.5">{stats.pending}</p>
                  </div>
                  <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Approved</p>
                    <p className="text-2xl font-bold text-green-600 mt-0.5">{stats.approved}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Rejected</p>
                    <p className="text-2xl font-bold text-red-600 mt-0.5">{stats.rejected}</p>
                  </div>
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm">
            <div className="px-5 py-3 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-900">Memo Terbaru</h2>
            </div>
            <div className="overflow-x-auto">
              {memos.length === 0 ? (
                <div className="text-center py-10">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Belum ada memo</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500 uppercase">No. Memo</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500 uppercase">Judul</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500 uppercase">Divisi</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500 uppercase">Status</th>
                      <th className="text-left py-2.5 px-4 text-xs font-medium text-slate-500 uppercase">Tanggal</th>
                      <th className="text-right py-2.5 px-4 text-xs font-medium text-slate-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memos.slice(0, 5).map((memo) => (
                      <tr key={memo.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-4 font-mono text-slate-700">{memo.memo_number}</td>
                        <td className="py-2.5 px-4 text-slate-900">{memo.title}</td>
                        <td className="py-2.5 px-4 text-slate-700">{memo.division}</td>
                        <td className="py-2.5 px-4">
                          <Badge variant={getStatusBadge(memo.status) as any} className="text-xs">
                            {getStatusLabel(memo.status)}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 text-slate-500">{formatDate(memo.created_at)}</td>
                        <td className="py-2.5 px-4 text-right">
                          <Link href={`/memos/${memo.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="w-4 h-4 text-slate-500" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
