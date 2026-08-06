"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { memoAPI } from '@/lib/api';
import { toast } from 'react-toastify';
import { QrCode, Upload, X, CheckCircle, FileText, Camera, Signature } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import { QRCodeCanvas } from 'qrcode.react';
import { QrScanner } from '@/components/ui/QrScanner';
import { BrowserMultiFormatReader, NotFoundException, FormatException, ChecksumException } from '@zxing/library';

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
  approver?: {
    full_name: string;
    email: string;
    division: string;
  };
  approver_signature?: string;
}

export default function ScanQRPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [memo, setMemo] = useState<Memo | null>(null);
  const [qrInput, setQrInput] = useState('');
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [cameraSupported, setCameraSupported] = useState(true);
  const isProcessing = useRef(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push('/login');
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraSupported(false);
      toast.warning('Kamera tidak didukung di browser ini');
    }
  }, []);

  const findMemoById = async (id: string) => {
    try {
      const response = await memoAPI.getById(id);
      if (response.data.data) {
        return response.data.data;
      }
      return null;
    } catch (err) {
      return null;
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    if (isProcessing.current) return;
    isProcessing.current = true;
    
    setShowScanner(false);
    console.log('Scanned text:', decodedText);
    
    let memoId = decodedText.trim();
    
    const urlMatch = decodedText.match(/\/memos\/([a-f0-9-]+|[a-f0-9]+)/i);
    if (urlMatch) {
      memoId = urlMatch[1];
    }
    
    const uuidMatch = decodedText.match(/[a-f0-9-]{36}/i);
    if (uuidMatch && !urlMatch) {
      memoId = uuidMatch[0];
    }
    
    const memoMatch = decodedText.match(/memo_[a-f0-9]+/i);
    if (memoMatch && !uuidMatch && !urlMatch) {
      memoId = memoMatch[0];
    }

    setQrInput(memoId);
    setLoading(true);
    setError('');
    
    try {
      const foundMemo = await findMemoById(memoId);
      if (foundMemo) {
        setMemo(foundMemo);
        toast.success('✅ Memo ditemukan!');
      } else {
        setError('Memo tidak ditemukan. Pastikan QR Code valid.');
        setMemo(null);
        toast.error('Memo tidak ditemukan');
      }
    } catch (err) {
      setError('Terjadi kesalahan, silakan coba lagi.');
      setMemo(null);
    } finally {
      setLoading(false);
      // Reset processing flag after a delay
      setTimeout(() => {
        isProcessing.current = false;
      }, 1000);
    }
  };

  const handleScanQR = async () => {
    if (!qrInput.trim()) {
      toast.warning('Masukkan data QR Code atau ID memo');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const foundMemo = await findMemoById(qrInput.trim());
      if (foundMemo) {
        setMemo(foundMemo);
        toast.success('Memo ditemukan!');
      } else {
        setError('Memo tidak ditemukan. Pastikan ID memo benar.');
        setMemo(null);
        toast.error('Memo tidak ditemukan');
      }
    } catch (err) {
      setError('Terjadi kesalahan, silakan coba lagi.');
      setMemo(null);
    } finally {
      setLoading(false);
    }
  };

  const decodeQRFromImage = async (imageFile: File): Promise<string | null> => {
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const imageData = event.target?.result as string;
            const img = new Image();
            img.onload = async () => {
              try {
                const codeReader = new BrowserMultiFormatReader();
                const result = await codeReader.decodeFromImageElement(img);
                const text = result.getText();
                console.log('Decoded QR text:', text);
                resolve(text);
              } catch (err) {
                if (err instanceof NotFoundException || 
                    err instanceof FormatException || 
                    err instanceof ChecksumException) {
                  resolve(null);
                } else {
                  reject(err);
                }
              }
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = imageData;
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(imageFile);
      });
    } catch (err) {
      console.error('Error decoding QR from image:', err);
      return null;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const decodedText = await decodeQRFromImage(file);
      
      if (decodedText) {
        console.log('Decoded from image:', decodedText);
        await handleScanSuccess(decodedText);
        return;
      }
      
      toast.error('Tidak dapat membaca QR Code dari gambar');
      setError('QR Code tidak terbaca. Pastikan gambar jelas.');
      setLoading(false);
    } catch (err) {
      console.error('Error processing image:', err);
      toast.error('Gagal memproses gambar');
      setError('Gagal membaca QR Code dari gambar');
      setLoading(false);
    }
  };

  const handleViewMemo = () => {
    if (memo) {
      router.push(`/memos/${memo.id}`);
    }
  };

  const clearResult = () => {
    setMemo(null);
    setQrInput('');
    setError('');
    isProcessing.current = false;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      archived: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Draft',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      archived: 'Archived',
    };
    return labels[status] || status;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex justify-center p-6">
        <div className="w-full max-w-6xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Scan QR Code</h1>
            <p className="text-sm text-slate-500 mt-0.5">Scan atau upload QR Code untuk verifikasi memo</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scan Form */}
            <Card className="border-0 shadow-sm lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-blue-600" />
                  Scan QR Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Kamera Scanner</Label>
                  {showScanner ? (
                    <QrScanner
                      onScan={handleScanSuccess}
                      onClose={() => setShowScanner(false)}
                    />
                  ) : (
                    <Button
                      onClick={() => setShowScanner(true)}
                      variant="blue"
                      className="w-full"
                      disabled={!cameraSupported}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {!cameraSupported ? 'Kamera Tidak Tersedia' : 'Buka Kamera'}
                    </Button>
                  )}
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="qr-input">Atau Masukkan ID Memo</Label>
                    <div className="flex gap-2">
                      <Input
                        id="qr-input"
                        placeholder="Masukkan ID memo..."
                        value={qrInput}
                        onChange={(e) => setQrInput(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={handleScanQR} disabled={loading} variant="blue">
                        {loading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <QrCode className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <p className="text-sm text-slate-500 mb-2">Upload Gambar QR Code</p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('qr-file')?.click()}
                      className="w-full"
                      disabled={loading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload QR Code
                    </Button>
                    <input
                      id="qr-file"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Upload gambar QR Code (JPG, PNG, max 5MB)
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {!memo && !error && !loading && (
                  <div className="p-6 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 text-center">
                    <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">
                      Scan QR Code dengan kamera,<br />
                      upload gambar, atau masukkan ID memo
                    </p>
                  </div>
                )}

                {loading && (
                  <div className="flex items-center justify-center p-6">
                    <div className="loading-spinner" />
                    <span className="ml-2 text-slate-500">Memproses...</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Result */}
            <Card className="border-0 shadow-sm lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    Hasil Verifikasi
                  </CardTitle>
                  {memo && (
                    <Button variant="ghost" size="sm" onClick={clearResult}>
                      <X className="w-4 h-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {memo ? (
                  <div className="space-y-4">
                    <div className="flex justify-center p-4 bg-white rounded-lg border border-slate-200">
                      <QRCodeCanvas
                        value={`${window.location.origin}/memos/${memo.id}`}
                        size={150}
                        level="H"
                        includeMargin
                      />
                      <p className="text-xs text-slate-400 mt-2 break-all text-center">
                        ID: {memo.id}
                      </p>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-green-700 mb-2">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">Memo Terverifikasi!</span>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-700">No. Memo:</span>
                          <span className="text-sm">{memo.memo_number}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-700">Judul:</span>
                          <span className="text-sm font-semibold">{memo.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-700">Divisi:</span>
                          <span className="text-sm">{memo.division}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-700">Status:</span>
                          <span className={`text-sm px-2 py-0.5 rounded-full ${getStatusBadge(memo.status)}`}>
                            {getStatusLabel(memo.status)}
                          </span>
                        </div>
                        {memo.creator && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-700">Dibuat Oleh:</span>
                            <span className="text-sm">{memo.creator.full_name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-700">Tanggal:</span>
                          <span className="text-sm">{formatDate(memo.created_at)}</span>
                        </div>
                        {/* Signature */}
                        {memo.status === 'approved' && memo.approver_signature && (
                          <div className="mt-2 pt-3 border-t border-green-200">
                            <div className="flex items-center gap-2 text-green-700 mb-2">
                              <Signature className="w-4 h-4" />
                              <span className="text-sm font-medium">Tanda Tangan Digital</span>
                            </div>
                            {memo.approver && (
                              <p className="text-sm text-slate-600 mb-2">
                                Disetujui oleh: <span className="font-medium">{memo.approver.full_name}</span>
                              </p>
                            )}
                            <div className="inline-block bg-white p-3 rounded-lg border border-green-200 shadow-sm">
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
                        {memo.status === 'approved' && !memo.approver_signature && memo.approver && (
                          <div className="mt-2 pt-3 border-t border-green-200">
                            <p className="text-sm text-slate-600">
                              Disetujui oleh: <span className="font-medium">{memo.approver.full_name}</span>
                            </p>
                            <p className="text-xs text-slate-400 mt-1">Tanda tangan digital tidak tersedia</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button onClick={handleViewMemo} variant="blue" className="flex-1">
                        <FileText className="w-4 h-4 mr-2" />
                        Lihat Detail Memo
                      </Button>
                      <Button onClick={clearResult} variant="outline" className="flex-1">
                        <QrCode className="w-4 h-4 mr-2" />
                        Scan Lagi
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <QrCode className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700">Belum Ada Hasil Scan</h3>
                    <p className="text-slate-500 mt-1">
                      Scan QR Code dengan kamera, upload gambar,<br />
                      atau masukkan ID memo untuk memverifikasi
                    </p>
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
