import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Lock, Loader2 } from 'lucide-react';

const AdminLogin = ({ onLoginSuccess, onCancel }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Check credentials against the 'admins' table
            const { data, error } = await supabase
                .from('admins')
                .select('*')
                .eq('username', username)
                .eq('password', password) // Note: In production, passwords should be hashed!
                .single();

            if (error || !data) {
                throw new Error('Invalid credentials');
            }

            onLoginSuccess(data);
        } catch (err) {
            setError('Access Denied: Invalid username or password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white/5 rounded-xl border border-white/10 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-2 mb-4 text-white font-bold text-lg">
                <Lock className="text-blue-400" size={20} />
                Admin Access
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-xs text-neutral-400 mb-1">Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="Enter username"
                    />
                </div>

                <div>
                    <label className="block text-xs text-neutral-400 mb-1">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                        placeholder="Enter password"
                    />
                </div>

                {error && <p className="text-red-400 text-xs">{error}</p>}

                <div className="flex gap-2 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 text-sm transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors flex items-center justify-center"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : 'Login'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminLogin;
