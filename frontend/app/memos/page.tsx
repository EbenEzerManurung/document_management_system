"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { memoAPI } from '@/lib/api';
import { formatDate, getStatusLabel } from '@/lib/utils';
import { FileText, Plus, Search, Eye, Trash2, QrCode, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '@/components/layout/Sidebar';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';

interface Memo {
  id: string;
  memo_number: string;
  title: string;
  content: string;
  division: string;
  status: string;
  created_at: string;
  created_by: string;
  creator?: {
    full_name: string;
  };
}

export default function MemosPage() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [filteredMemos, setFilteredMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<any>(null);
  const [showQR, setShowQR] = useState<string | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchMemos();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredMemos(memos);
    } else {
      const filtered = memos.filter(
        (memo) =>
          memo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          memo.memo_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          memo.division.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMemos(filtered);
    }
  }, [searchTerm, memos]);

  const fetchMemos = async () => {
    try {
      const response = await memoAPI.getAll();
      setMemos(response.data.data || []);
      setFilteredMemos(response.data.data || []);
    } catch (error) {
      console.error('Error fetching memos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus memo ini?')) return;
    
    try {
      await memoAPI.delete(id);
      toast.success('Memo berhasil dihapus');
      fetchMemos();
    } catch (error) {
      console.error('Error deleting memo:', error);
    }
  };

  const downloadQRCode = async (memoId: string, memoNumber: string) => {
    try {
      // Set the QR to show for this memo
      setShowQR(memoId);
      
      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (qrRef.current) {
        const canvas = await html2canvas(qrRef.current, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false,
        });
        
        // Create download link
        const link = document.createElement('a');
        link.download = `QR_${memoNumber}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch (error) {
      console.error('Error downloading QR:', error);
      toast.error('Gagal mendownload QR Code');
    } finally {
      setShowQR(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    const variants: Record<string, string> = {
      draft: 'draft',
      pending: 'pending',
      approved: 'approved',
      rejected: 'rejected',
      archived: 'secondary',
    };
    return variants[status] || 'default';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar user={user} />
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
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">List Memo</h1>
              <p className="text-slate-500 mt-1">Manage All your Memo</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/scan">
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                  <QrCode className="w-4 h-4 mr-2" />
                  Scan QR
                </Button>
              </Link>
              <Link href="/memos/create">
                <Button className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600">
                  <Plus className="w-4 h-4 mr-2" />
                  CREATE MEMO
                </Button>
              </Link>
            </div>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-xl">All Memo</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Cari memo..."
                    className="pl-10 w-full sm:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredMemos.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">
                    {searchTerm ? 'Memo tidak ditemukan' : 'Belum ada memo'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">No. Memo</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Title</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Division</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">Date</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMemos.map((memo) => (
                        <tr key={memo.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 text-sm font-medium text-slate-900">
                            {memo.memo_number}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-700">{memo.title}</td>
                          <td className="py-3 px-4 text-sm text-slate-700">{memo.division}</td>
                          <td className="py-3 px-4">
                            <Badge variant={getStatusBadgeVariant(memo.status) as any}>
                              {getStatusLabel(memo.status)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-500">
                            {formatDate(memo.created_at)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link href={`/memos/${memo.id}`}>
                                <Button variant="ghost" size="sm" title="Detail Memo">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Download QR Code PNG"
                                onClick={() => downloadQRCode(memo.id, memo.memo_number)}
                              >
                             <QrCode className="w-4 h-4" />
                              </Button>
                            
                              {(user?.role === 'head_manager' || user?.id === memo.created_by) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDelete(memo.id)}
                                  title="Hapus Memo"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
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

      {/* Hidden QR Code for download */}
      {showQR && (
        <div className="fixed -top-96 left-0 opacity-0 pointer-events-none">
          <div ref={qrRef} className="bg-white p-8 rounded-lg shadow-lg text-center">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900">DMS - Document Management</h3>
              <p className="text-sm text-slate-500">Scan QR Code untuk verifikasi memo</p>
            </div>
            <QRCodeCanvas
              value={`${window.location.origin}/memos/${showQR}`}
              size={200}
              level="H"
              includeMargin
            />
            <div className="mt-4">
              <p className="text-xs text-slate-400 break-all">
                {`${window.location.origin}/memos/${showQR}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
