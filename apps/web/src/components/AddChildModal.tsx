import React, { useState } from 'react';
import { UserPlus, X, AlertCircle } from 'lucide-react';

interface AddChildModalProps {
  isOpen: boolean;
  token: string;
  onClose: () => void;
  onChildAdded: () => void;
}

export const AddChildModal: React.FC<AddChildModalProps> = ({ isOpen, token, onClose, onChildAdded }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(10);
  const [avatar, setAvatar] = useState('avatar_lion.png');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

    try {
      const res = await fetch(`${baseUrl}/family/children`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, age, avatar }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add child profile');

      onChildAdded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition p-1">
          <X size={20} />
        </button>

        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <UserPlus size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Add Child Profile</h2>
              <p className="text-xs text-slate-400">No credentials required for child profiles.</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Child's Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Child's Name"
                className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Age</label>
              <input
                type="number"
                min={1}
                max={18}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Select Avatar</label>
              <div className="grid grid-cols-4 gap-3">
                {['avatar_lion.png', 'avatar_bear.png', 'avatar_fox.png', 'avatar_owl.png'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setAvatar(item)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center transition ${
                      avatar === item ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xl capitalize">{item.split('_')[1].split('.')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-sm transition shadow-lg shadow-emerald-600/20 disabled:opacity-50 mt-4"
            >
              {loading ? 'Creating...' : 'Create Child Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
