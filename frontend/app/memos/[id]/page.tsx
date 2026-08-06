"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SignaturePadComponent } from '@/components/ui/SignaturePad';
import { memoAPI } from '@/lib/api';
import { formatDate, getStatusLabel } from '@/lib/utils';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Download, 
  QrCode,
  User,
  Calendar,
  Building2,
  FileText,
  PenTool,
  Signature
} from 'lucide-react';
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
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
  qr_code: string;
  file_path: string;
  created_at: string;
  updated_at: string;
  creator?: {
    full_name: string;
    email: string;
    division: string;
  };
  approver?: {
    full_name: string;
    email: string;
    division: string;
  };
  approver_signature?: string;
}

export default function MemoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const memoId = params.id as string;
  const [memo, setMemo] = useState<Memo | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
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
      setUser(JSON.parse(userData));
    } else {
      router.push('/login');
    }
    if (memoId && memoId !== '[object Object]') {
      fetchMemo();
    }
  }, [memoId]);

  const fetchMemo = async () => {
    try {
      const response = await memoAPI.getById(memoId);
      setMemo(response.data.data);
    } catch (error) {
      console.error('Error fetching memo:', error);
      toast.error('Gagal mengambil data memo');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
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
      fetchMemo();
    } catch (error) {
      console.error('Error approving memo:', error);
      toast.error('Gagal menyetujui memo');
    }
  };

  const handleReject = async () => {
    try {
      await memoAPI.reject(memoId, {
        comments: rejectionData.comments || 'Memo has been rejected',
      });
      toast.success('Memo has been rejected');
      setShowRejectModal(false);
      setRejectionData({ comments: '' });
      fetchMemo();
    } catch (error) {
      console.error('Error rejecting memo:', error);
      toast.error('Gagal menolak memo');
    }
  };

  const handleDownloadPDF = async () => {
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
        <Sidebar user={null} />
        <div className="flex-1 flex items-center justify-center ml-64">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  if (!memo) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar user={null} />
        <div className="flex-1 ml-64 p-6">
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Memo tidak ditemukan</p>
            <Link href="/memos">
              <Button variant="blue" className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Daftar Memo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isHeadManager = user?.role === 'head_manager' && user?.division === memo.division;
  const canApprove = isHeadManager && memo.status === 'pending';
  const hasSignature = !!approvalData.signature;
  const isApproved = memo.status === 'approved';
  const hasApproverSignature = memo.approver_signature && memo.approver_signature.length > 0;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 ml-64 p-6">
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/memos">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-slate-900">Detail Memo</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowQR(!showQR)}>
                <QrCode className="w-4 h-4 mr-2" />
                {showQR ? 'Close QR Code' : 'QR Code'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>

          {showQR && (
            <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
              <CardContent className="p-6 text-center">
                <div className="inline-block bg-white p-4 rounded-xl shadow-sm">
                  <QRCodeCanvas
                    value={`${window.location.origin}/memos/${memo.id}`}
                    size={200}
                    level="H"
                    includeMargin
                  />
                </div>
                <p className="mt-3 text-sm text-slate-500">Scan QR Code untuk verifikasi memo</p>
                <p className="text-xs text-slate-400 mt-1 break-all">
                  {`${window.location.origin}/memos/${memo.id}`}
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{memo.title}</CardTitle>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant={memo.status as any}>
                      {getStatusLabel(memo.status)}
                    </Badge>
                    <span className="text-sm text-slate-500">{memo.memo_number}</span>
                  </div>
                </div>
                {canApprove && (
                  <div className="flex gap-2">
                    {hasSignature ? (
                      <Button 
                        onClick={() => setShowApproveModal(true)} 
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Setujui
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => {
                          setShowApproveModal(true);
                          setShowSignaturePad(true);
                        }} 
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <PenTool className="w-4 h-4 mr-2" />
                        Signature & Approve
                      </Button>
                    )}
                    <Button 
                      onClick={() => setShowRejectModal(true)} 
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Memo Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">Division</p>
                    <p className="font-medium">{memo.division}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">Created By</p>
                    <p className="font-medium">{memo.creator?.full_name || 'Unknown'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-500">Created Date</p>
                    <p className="font-medium">{formatDate(memo.created_at)}</p>
                  </div>
                </div>
                {memo.approved_at && (
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm text-slate-500">Tanggal Disetujui</p>
                      <p className="font-medium">{formatDate(memo.approved_at)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div>
                <h3 className="font-medium text-slate-900 mb-2">Content</h3>
                <div className="p-4 bg-white border border-slate-200 rounded-lg whitespace-pre-wrap">
                  {memo.content}
                </div>
              </div>

              {/* Disetujui Oleh dengan Signature */}
              {isApproved && memo.approver && (
                <div className="border-t border-slate-200 pt-6">
                  <h3 className="font-medium text-slate-900 mb-4">Disetujui Oleh</h3>
                  <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold text-lg flex-shrink-0">
                      {memo.approver.full_name?.charAt(0) || 'A'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 text-lg">{memo.approver.full_name}</p>
                      <p className="text-sm text-slate-500">
                        {memo.approver.division} • {memo.approver.email}
                      </p>
                      {hasApproverSignature && (
                        <div className="mt-3">
                          <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                            <Signature className="w-3 h-3" />
                            Tanda Tangan Digital
                          </p>
                          <div className="inline-block bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                            <img 
                              src={memo.approver_signature} 
                              alt="Digital Signature" 
                              className="h-14 object-contain"
                              style={{ maxWidth: '250px' }}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<span class="text-sm text-slate-400">Tanda tangan digital tidak tersedia</span>';
                                }
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Rejected */}
              {memo.status === 'rejected' && (
                <div className="border-t border-slate-200 pt-6">
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-red-700 font-medium">Memo Rejected</p>
                    <p className="text-sm text-red-600 mt-1">
                      Memo has been rejected and requires repair.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && memo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowApproveModal(false)}>
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Approve Memo</h3>
            <p className="text-sm text-slate-500 mb-4">
              Memo: <strong>{memo.title}</strong>
            </p>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Tanda Tangan Digital</Label>
                <div className="mt-2">
                  {showSignaturePad ? (
                    <SignaturePadComponent
                      onSave={handleSignatureSave}
                      onCancel={() => {
                        setShowSignaturePad(false);
                        if (!approvalData.signature) {
                          setShowApproveModal(false);
                        }
                      }}
                    />
                  ) : approvalData.signature ? (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-green-700 text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        ✓ Tanda tangan sudah dibuat
                      </p>
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
                      className="w-full h-12 border-dashed border-2"
                    >
                      <PenTool className="w-4 h-4 mr-2" />
                      Klik untuk membuat tanda tangan
                    </Button>
                  )}
                </div>
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
                  onClick={handleApprove}
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
      {showRejectModal && memo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowRejectModal(false)}>
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Reject Memo</h3>
            <p className="text-sm text-slate-500 mb-4">
              Memo: <strong>{memo.title}</strong>
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reject-comments">Alasan Penolakan (Opsional)</Label>
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
                  onClick={handleReject}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                Reject
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
