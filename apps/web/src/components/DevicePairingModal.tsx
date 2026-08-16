import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, RefreshCw, X, ShieldAlert, Monitor, Smartphone } from 'lucide-react';
import { PairingCodeResponse } from '@tracker/shared';

interface DevicePairingModalProps {
  isOpen: boolean;
  childName: string;
  childId: string;
  token: string;
  onClose: () => void;
}

export const DevicePairingModal: React.FC<DevicePairingModalProps> = ({
  isOpen,
  childName,
  childId,
  token,
  onClose,
}) => {
  const [pairingData, setPairingData] = useState<PairingCodeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const fetchPairingCode = async () => {
    setLoading(true);
    setError('');
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

    try {
      const res = await fetch(`${baseUrl}/family/children/${childId}/pairing-code`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to generate pairing code');
      setPairingData(data);
    } catch (err: any) {
      setError(err.message || 'Could not generate pairing code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition p-1">
          <X size={20} />
        </button>

        <div className="p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4">
            <QrCode size={28} />
          </div>

          <h2 className="text-xl font-bold text-white mb-1">Pair Device for {childName}</h2>
          <p className="text-xs text-slate-400 mb-6">
            Generate a secure short-lived pairing code or scan the QR code from the Android agent app.
          </p>

          {!pairingData ? (
            <button
              onClick={fetchPairingCode}
              disabled={loading}
              className="py-3 px-6 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2 mx-auto"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" /> Generating Code...
                </>
              ) : (
                'Generate Pairing Code'
              )}
            </button>
          ) : (
            <div className="space-y-6">
              {/* Pairing Code Display */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-500 block mb-1 uppercase tracking-widest font-semibold">6-Digit Pairing Code</span>
                <span className="text-4xl font-mono font-extrabold text-cyan-400 tracking-widest">
                  {pairingData.pairingCode}
                </span>
                <p className="text-[11px] text-slate-500 mt-2">
                  Valid until: {new Date(pairingData.expiresAt).toLocaleTimeString()}
                </p>
              </div>

              {/* QR Code Rendering */}
              <div className="p-4 bg-white rounded-2xl w-fit mx-auto shadow-xl">
                <QRCodeSVG value={pairingData.qrPayload} size={160} level="M" />
              </div>

              {/* Instructions */}
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-start gap-2.5">
                  <Monitor size={18} className="text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Windows Agent</h4>
                    <p className="text-[11px] text-slate-400 leading-tight">Enter the 6-digit code in the desktop setup wizard.</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-start gap-2.5">
                  <Smartphone size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">Android Agent</h4>
                    <p className="text-[11px] text-slate-400 leading-tight">Scan the QR code directly using the mobile app.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={fetchPairingCode}
                className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1.5 mx-auto transition"
              >
                <RefreshCw size={14} /> Refresh Code
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-center gap-2">
              <ShieldAlert size={16} />
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
