import React, { useState, useEffect } from 'react';
import { User } from '../types';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ users, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [showAdminHelp, setShowAdminHelp] = useState(false);
  const [sysStatus, setSysStatus] = useState({ geo: false, cam: false, api: !!process.env.API_KEY });

  useEffect(() => {
    // Check hardware availability
    if ("geolocation" in navigator) setSysStatus(s => ({ ...s, geo: true }));
    navigator.mediaDevices.enumerateDevices().then(devices => {
      if (devices.some(d => d.kind === 'videoinput')) setSysStatus(s => ({ ...s, cam: true }));
    });

    const savedEmail = localStorage.getItem('bcs_last_email');
    const savedPass = localStorage.getItem('bcs_last_pass');
    const savedRemember = localStorage.getItem('bcs_remember') === 'true';

    if (savedRemember) {
      if (savedEmail) setEmail(savedEmail);
      if (savedPass) setPassword(savedPass);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail && u.password === password);
    
    if (user) {
      if (rememberMe) {
        localStorage.setItem('bcs_last_email', email);
        localStorage.setItem('bcs_last_pass', password);
        localStorage.setItem('bcs_remember', 'true');
      } else {
        localStorage.removeItem('bcs_last_email');
        localStorage.removeItem('bcs_last_pass');
        localStorage.setItem('bcs_remember', 'false');
      }
      onLogin(user);
    } else {
      setError('Invalid Access Key. Hint: name@bcs.com');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-600 to-transparent" />
      
      <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/10 transform rotate-3">
            <svg className="w-8 h-8 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          <h2 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">BCS MEDIA TEAM</h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">Operational Access Hub</p>
        </div>

        {/* Tactical System Check Bar */}
        <div className="flex justify-center gap-4 mb-8 bg-slate-950/40 py-2 rounded-xl border border-slate-800">
           <div className="flex items-center gap-1.5">
             <div className={`w-1.5 h-1.5 rounded-full ${sysStatus.geo ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-red-500'}`}></div>
             <span className="text-[7px] font-black text-slate-500 uppercase tracking-tighter">GPS</span>
           </div>
           <div className="flex items-center gap-1.5">
             <div className={`w-1.5 h-1.5 rounded-full ${sysStatus.cam ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-red-500'}`}></div>
             <span className="text-[7px] font-black text-slate-500 uppercase tracking-tighter">CAM</span>
           </div>
           <div className="flex items-center gap-1.5">
             <div className={`w-1.5 h-1.5 rounded-full ${sysStatus.api ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-amber-500'}`}></div>
             <span className="text-[7px] font-black text-slate-500 uppercase tracking-tighter">API</span>
           </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Personnel ID</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-6 py-4 text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono text-sm"
              placeholder="NAME@BCS.COM"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Key</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-6 py-4 text-white placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-mono text-sm"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex items-center gap-3 px-1 py-1">
            <button 
              type="button"
              onClick={() => setRememberMe(!rememberMe)}
              className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${
                rememberMe ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-950 border-slate-700'
              }`}
            >
              {rememberMe && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"/></svg>}
            </button>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest cursor-pointer select-none" onClick={() => setRememberMe(!rememberMe)}>
              Remember Identity
            </span>
          </div>

          {error && <div className="text-red-500 text-[9px] font-black uppercase text-center tracking-widest bg-red-500/5 p-2 rounded-lg border border-red-500/20">{error}</div>}

          <button
            type="submit"
            className="w-full bg-white text-slate-950 font-black py-4 rounded-2xl shadow-xl hover:bg-slate-100 transition-all transform active:scale-95 uppercase text-xs tracking-[0.3em]"
          >
            Authenticate
          </button>
        </form>

        <div className="mt-8 text-center space-y-4">
          <button 
            onClick={() => setShowAdminHelp(!showAdminHelp)}
            className="text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-400"
          >
            {showAdminHelp ? '[ Close Help ]' : '[ View Credentials ]'}
          </button>
          
          {showAdminHelp && (
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-left animate-in slide-in-from-top-2 overflow-auto max-h-60 custom-scrollbar">
              <p className="text-[8px] text-slate-500 font-bold uppercase mb-2 border-b border-slate-800 pb-2">HQ Admin Access</p>
              <code className="text-[9px] text-indigo-400 block mb-3">admin1@bcs.com / admin</code>
              
              <p className="text-[8px] text-slate-500 font-bold uppercase mb-2 border-b border-slate-800 pb-2">Team Access Template</p>
              <div className="space-y-2">
                <p className="text-[9px] text-emerald-400">ID: [full_name]@bcs.com</p>
                <p className="text-[9px] text-emerald-400">Key: member</p>
                
                <div className="mt-4 pt-2 border-t border-slate-800">
                  <p className="text-[7px] text-slate-600 font-bold uppercase">Example: Khushdil Goyal</p>
                  <code className="text-[9px] text-white block">khushdilgoyal@bcs.com / member</code>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;