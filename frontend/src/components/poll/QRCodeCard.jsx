import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { QrCode as QrIcon } from 'lucide-react';

export default function QRCodeCard({ url, size = 180 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(
        canvasRef.current,
        url,
        {
          width: size,
          margin: 1.5,
          color: {
            dark: '#090d16',
            light: '#f8fafc',
          },
        },
        (error) => {
          if (error) console.error('Failed to generate QR code:', error);
        }
      );
    }
  }, [url, size]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1.25rem',
        borderRadius: 'var(--radius-lg)',
        background: '#ffffff',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        width: 'fit-content',
        margin: '0 auto',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          borderRadius: 'var(--radius-sm)',
          display: 'block',
        }}
        aria-label="QR Code to join this poll"
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          marginTop: '0.6rem',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: '#334155',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        <QrIcon size={14} />
        Scan to Vote
      </div>
    </div>
  );
}
