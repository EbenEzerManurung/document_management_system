"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SignaturePadComponent } from '@/components/ui/SignaturePad';
import { memoAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Clock, Eye, CheckCircle, XCircle, QrCode, Download, FileText, User, Calendar, Building2, PenTool } from 'lucide-react';
import { toast } from 'react-toastify';
import { QRCodeCanvas } from 'qrcode.react';
import Sidebar from '@/components/layout/Sidebar';

interface Memo {
  id: string;
  memo_number: string;
  title: string;
  content: string;
  division: string;
  status: string;
  created_at: string;
  qr_code: string;
  creator?: {
    full_name: string;
    email: string;
    division: string;
  };
}

export default function PendingMemosPage() {
  const router = useRouter();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [approvalData, setApprovalData] = useState({
    signature: '',
    comments: '',
  });
  const [rejectionData, setRejectionData] = useState({
    comments: '',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      if (parsed.role !== 'head_manager') {
        router.push('/dashboard');
        toast.warning('Hanya Head Manager yang dapat mengakses halaman ini');
        return;
      }
      fetchPendingMemos();
    } else {
      router.push('/login');
    }
  }, []);

  const fetchPendingMemos = async () => {
    try {
      const response = await memoAPI.getPending();
      setMemos(response.data.data || []);
    } catch (error) {
      console.error('Error fetching pending memos:', error);
      toast.error('Gagal mengambil data memo pending');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (memoId: string) => {
    if (!approvalData.signature) {
      toast.warning('Mohon buat tanda tangan digital terlebih dahulu');
      return;
    }

    try {
      await memoAPI.approve(memoId, {
        signature: approvalData.signature,
        comments: approvalData.comments || '',
      });
      toast.success('Memo berhasil disetujui!');
      setShowApproveModal(false);
      setShowSignaturePad(false);
      setApprovalData({ signature: '', comments: '' });
      fetchPendingMemos();
    } catch (error) {
      console.error('Error approving memo:', error);
    }
  };

  const handleReject = async (memoId: string) => {
    try {
      await memoAPI.reject(memoId, {
        comments: rejectionData.comments || 'Memo ditolak',
      });
      toast.success('Memo berhasil ditolak');
      setShowRejectModal(false);
      setRejectionData({ comments: '' });
      fetchPendingMemos();
    } catch (error) {
      console.error('Error rejecting memo:', error);
    }
  };

  const handleDownloadPDF = async (memoId: string) => {
    if (!memoId || memoId === '[object Object]') {
      toast.error('ID memo tidak valid');
      return;
    }

    try {
      toast.info('Sedang memproses PDF...');
      const response = await memoAPI.exportPDF(memoId);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `memo_${memoId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF berhasil didownload!');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Gagal mendownload PDF');
    }
  };

  const handleSignatureSave = (signatureData: string) => {
    setApprovalData({ ...approvalData, signature: signatureData });
    setShowSignaturePad(false);
    toast.success('Tanda tangan berhasil dibuat!');
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
              <h1 className="text-3xl font-bold text-slate-900">Pending Approval</h1>
              <p className="text-slate-500 mt-1">Waiting For Approval</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="warning" className="text-lg px-4 py-2">
                <Clock className="w-4 h-4 mr-2" />
                {memos.length} Waiting
              </Badge>
            </div>
          </div>

          {memos.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700">No Pending Approval</h3>
                <p className="text-slate-500 mt-2">All Memo have been processed</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {memos.map((memo) => (
                <Card key={memo.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="text-lg font-semibold text-slate-900">
                                {memo.title}
                              </h3>
                              <Badge variant="pending">Pending</Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 flex-wrap">
                              <span className="flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                {memo.memo_number}
                              </span>
                              <span className="flex items-center gap-1">
                                <Building2 className="w-4 h-4" />
                                {memo.division}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {memo.creator?.full_name || 'Unknown'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(memo.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                          <p className="text-sm text-slate-600 line-clamp-2">
                            {memo.content}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMemo(memo);
                              setShowQR(!showQR);
                            }}
                          >
                            <QrCode className="w-4 h-4 mr-1" />
                            QR Code
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadPDF(memo.id)}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            PDF
                          </Button>
                          <Link href={`/memos/${memo.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              Detail
                            </Button>
                          </Link>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => {
                              setSelectedMemo(memo);
                              setShowApproveModal(true);
                              setShowSignaturePad(true);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Setujui
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedMemo(memo);
                              setShowRejectModal(true);
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Tolak
                          </Button>
                        </div>

                        {showQR && selectedMemo?.id === memo.id && (
                          <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200 inline-block">
                            <QRCodeCanvas
                              value={`${window.location.origin}/memos/${memo.id}`}
                              size={150}
                              level="H"
                              includeMargin
                            />
                            <p className="text-xs text-slate-500 mt-2 text-center">
                              Scan untuk verifikasi memo
                            </p>
                            <p className="text-xs text-slate-400 mt-1 text-center break-all">
                              {`${window.location.origin}/memos/${memo.id}`}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedMemo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Approve Memo</h3>
            <p className="text-sm text-slate-500 mb-4">
              Memo: <strong>{selectedMemo.title}</strong>
            </p>
            <div className="space-y-4">
              <div>
                <Label>Tanda Tangan Digital</Label>
                {showSignaturePad ? (
                  <SignaturePadComponent
                    onSave={handleSignatureSave}
                    onCancel={() => {
                      setShowSignaturePad(false);
                      setShowApproveModal(false);
                    }}
                  />
                ) : approvalData.signature ? (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-green-700 text-sm">✓ Tanda tangan sudah dibuat</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSignaturePad(true)}
                      className="mt-2"
                    >
                      <PenTool className="w-4 h-4 mr-2" />
                      Buat Ulang
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowSignaturePad(true)}
                    className="w-full"
                  >
                    <PenTool className="w-4 h-4 mr-2" />
                    Buat Tanda Tangan
                  </Button>
                )}
              </div>
              <div>
                <Label htmlFor="approve-comments">Komentar (Opsional)</Label>
                <Textarea
                  id="approve-comments"
                  placeholder="Tambahkan komentar..."
                  value={approvalData.comments}
                  onChange={(e) => setApprovalData({ ...approvalData, comments: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => handleApprove(selectedMemo.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  disabled={!approvalData.signature}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Setujui
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowApproveModal(false);
                    setShowSignaturePad(false);
                    setApprovalData({ signature: '', comments: '' });
                  }}
                  className="flex-1"
                >
                  Batal
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedMemo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Tolak Memo</h3>
            <p className="text-sm text-slate-500 mb-4">
              Memo: <strong>{selectedMemo.title}</strong>
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reject-comments">Alasan Penolakan</Label>
                <Textarea
                  id="reject-comments"
                  placeholder="Berikan alasan penolakan..."
                  value={rejectionData.comments}
                  onChange={(e) => setRejectionData({ comments: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => handleReject(selectedMemo.id)}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Tolak
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionData({ comments: '' });
                  }}
                  className="flex-1"
                >
                  Batal
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
