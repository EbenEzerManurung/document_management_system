"use client";

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from './button';
import { Camera, X } from 'lucide-react';

interface QrScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export function QrScanner({ onScan, onClose }: QrScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);
  const isScanned = useRef(false);

  useEffect(() => {
    startScanner();

    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    if (!containerRef.current || isScanned.current) return;

    try {
      setError(null);
      
      // Request permission first
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      stream.getTracks().forEach(track => track.stop());

      // Clean container
      containerRef.current.innerHTML = '';
      
      const html5QrCode = new Html5Qrcode(containerRef.current.id);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      setScanning(true);

      await html5QrCode.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanError
      );
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
        setError('Izin kamera ditolak. Mohon izinkan akses kamera.');
      } else if (err.name === 'NotFoundError') {
        setError('Tidak ada kamera yang terdeteksi');
      } else {
        setError('Gagal mengakses kamera: ' + (err.message || 'Unknown error'));
      }
      setScanning(false);
    }
  };

  const onScanSuccess = (decodedText: string) => {
    if (isScanned.current) return;
    isScanned.current = true;
    
    console.log('QR Code scanned:', decodedText);
    stopScanner();
    onScan(decodedText);
  };

  const onScanError = (err: any) => {
    // Ignore - these happen frequently
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (err) {
      console.log('Scanner stop error:', err);
    }
    setScanning(false);
  };

  const handleClose = () => {
    isScanned.current = false;
    stopScanner();
    onClose();
  };

  return (
    <div className="relative">
      {error ? (
        <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-center">
          <Camera className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-600 text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={handleClose} className="mt-2">
            Tutup
          </Button>
        </div>
      ) : (
        <>
          <div className="relative bg-black rounded-lg overflow-hidden">
            <div 
              id="qr-reader-container"
              ref={containerRef}
              className="w-full h-[300px]"
            />
            <div className="absolute inset-0 border-2 border-blue-500 rounded-lg opacity-50 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-blue-500 rounded-lg pointer-events-none" />
          </div>
          <div className="flex gap-2 mt-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClose}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Tutup
            </Button>
          </div>
          {scanning && (
            <p className="text-xs text-green-600 text-center mt-2">
              ✅ Kamera aktif, arahkan ke QR Code
            </p>
          )}
        </>
      )}
    </div>
  );
}
