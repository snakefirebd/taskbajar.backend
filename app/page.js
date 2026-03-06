"use client";

import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  getDatabase, 
  ref, 
  onValue, 
  set, 
  update, 
  push, 
  serverValue,
  runTransaction
} from 'firebase/database';
import { 
  Home, 
  PlusCircle, 
  User, 
  Trophy, 
  ShieldCheck, 
  Settings, 
  LogOut, 
  Bell, 
  MessageCircle, 
  RotateCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  LayoutDashboard,
  ArrowLeft,
  Copy,
  Plus,
  Send,
  MoreVertical,
  ChevronRight
} from 'lucide-react';

// --- ফায়ারবেস কনফিগারেশন ---
const firebaseConfig = {
    apiKey: "AIzaSyDgFaTrHW7Grp_Q22p6KNcHZxaEujHsLsE",
    authDomain: "exchange-project-d4028.firebaseapp.com",
    databaseURL: "https://exchange-project-d4028-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "exchange-project-d4028",
    storageBucket: "exchange-project-d4028.firebasestorage.app",
    messagingSenderId: "313976742479",
    appId: "1:313976742479:web:45951b360d875c4768c03a"
};

const appId = "exchange-project-d4028";
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getDatabase(app);

// --- থিম এবং কমন স্টাইলস (Inline CSS) ---
const theme = {
    gradient: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    bg: '#f8fafc',
    surface: '#ffffff',
    text: '#0f172a',
    textLight: '#64748b',
    indigo: '#6366f1',
    emerald: '#10b981',
    rose: '#f43f5e',
    amber: '#f59e0b'
};

export default function App() {
    // --- স্টেটস ---
    const [user, setUser] = useState(null);
    const [view, setView] = useState('home'); // home, auth, profile, leaderboard, trust, promote, manage, admin, detail, support
    const [userData, setUserData] = useState(null);
    const [tasks, setTasks] = useState({});
    const [submissions, setSubmissions] = useState({});
    const [isAdmin, setIsAdmin] = useState(false);
    const [lang, setLang] = useState('bn');
    const [toast, setToast] = useState({ show: false, msg: '' });
    const [selectedTask, setSelectedTask] = useState(null);
    const [notifications, setNotifications] = useState([]);

    // --- অথেনটিকেশন লিসেনার ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            if (u) {
                setUser(u);
                loadUserData(u.uid);
            } else {
                setUser(null);
                setUserData(null);
                setIsAdmin(false);
            }
        });

        // পাবলিক ডাটা লিসেনার
        const tasksRef = ref(db, `artifacts/${appId}/public/data/microtasks`);
        onValue(tasksRef, (snap) => setTasks(snap.val() || {}));

        return () => unsubscribe();
    }, []);

    const loadUserData = (uid) => {
        const statsRef = ref(db, `artifacts/${appId}/users/${uid}/stats`);
        onValue(statsRef, (snap) => setUserData(snap.val()));

        const adminRef = ref(db, `artifacts/${appId}/admins/${uid}`);
        onValue(adminRef, (snap) => setIsAdmin(snap.val() === true));
        
        const notifRef = ref(db, `artifacts/${appId}/users/${uid}/notifications`);
        onValue(notifRef, (snap) => {
            const data = snap.val() || {};
            setNotifications(Object.keys(data).map(k => ({...data[k], id: k})).reverse());
        });
    };

    const showToast = (msg) => {
        setToast({ show: true, msg });
        setTimeout(() => setToast({ show: false, msg: '' }), 3000);
    };

    // --- কমন কম্পোনেন্টস ---
    const Header = () => (
        <div style={{
            background: theme.gradient, color: 'white', padding: '15px 20px 25px',
            borderBottomLeftRadius: '25px', borderBottomRightRadius: '25px',
            position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 15px rgba(99, 102, 241, 0.2)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '480px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div onClick={() => setView('profile')} style={{ cursor: 'pointer', width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', overflow: 'hidden' }}>
                        <img src={userData?.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: 800 }}>{userData?.name || (user ? 'Elite Member' : 'Guest')}</div>
                        <div style={{ fontSize: '10px', fontWeight: 700, opacity: 0.8 }}>{isAdmin ? 'ADMIN PRO' : 'PRO MEMBER'}</div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')} style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.15)', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 800 }}>
                        {lang.toUpperCase()}
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', padding: '5px 12px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)', textAlign: 'right' }}>
                        <span style={{ fontSize: '8px', textTransform: 'uppercase', opacity: 0.8, display: 'block' }}>Points</span>
                        <b style={{ fontSize: '14px' }}>{userData?.points || 0}</b>
                    </div>
                </div>
            </div>
        </div>
    );

    const BottomNav = () => (
        <div style={{ position: 'fixed', bottom: '15px', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '440px', zIndex: 1000 }}>
            <div style={{ height: '65px', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(20px)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyAround: 'space-around', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid #fff' }}>
                <NavButton icon={<Home size={20}/>} label="Home" active={view === 'home'} onClick={() => setView('home')} />
                <NavButton icon={<PlusCircle size={20}/>} label="Promote" active={view === 'promote'} onClick={() => setView('promote')} />
                <NavButton icon={<Settings size={20}/>} label="Manage" active={view === 'manage'} onClick={() => setView('manage')} />
                <NavButton icon={<User size={20}/>} label="Profile" active={view === 'profile'} onClick={() => setView('profile')} />
                {isAdmin && <NavButton icon={<LayoutDashboard size={20}/>} label="Admin" active={view === 'admin'} onClick={() => setView('admin')} color={theme.rose} />}
            </div>
        </div>
    );

    const NavButton = ({ icon, label, active, onClick, color }) => (
        <div onClick={onClick} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: active ? (color || theme.indigo) : theme.textLight, transition: '0.3s' }}>
            {icon}
            <span style={{ fontSize: '9px', fontWeight: 800, marginTop: '2px' }}>{label}</span>
        </div>
    );

    // --- ভিউ কম্পোনেন্টস ---

    // ১. হোম ভিউ
    const HomeView = () => (
        <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>
            {/* কুইক অ্যাকশন কার্ডস */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '25px' }}>
                <QuickCard icon="🎡" label="SPIN" color={theme.indigo} onClick={() => setView('trust')} />
                <QuickCard icon="🎁" label="BONUS" color={theme.emerald} onClick={() => handleDailyBonus()} />
                <QuickCard icon="🛡️" label="TRUST" color={theme.amber} onClick={() => setView('trust')} />
            </div>

            <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '15px', color: theme.text }}>উপলব্ধ মিশনসমূহ</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.keys(tasks).length > 0 ? Object.keys(tasks).reverse().map(id => {
                    const t = tasks[id];
                    if (t.creatorId === user?.uid) return null;
                    return (
                        <div key={id} onClick={() => { setSelectedTask({...t, id}); setView('detail'); }} style={{ background: 'white', padding: '15px', borderRadius: '18px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '14px' }}>{t.title}</div>
                                <div style={{ color: theme.emerald, fontWeight: 800, fontSize: '12px', marginTop: '4px' }}>+{t.reward} Points</div>
                            </div>
                            <ChevronRight size={18} color={theme.textLight} />
                        </div>
                    );
                }) : <div style={{ textAlign: 'center', padding: '40px', color: theme.textLight, fontSize: '14px' }}>কোন মিশন পাওয়া যায়নি</div>}
            </div>
        </div>
    );

    const QuickCard = ({ icon, label, color, onClick }) => (
        <div onClick={onClick} style={{ background: 'white', padding: '15px 10px', borderRadius: '20px', textAlign: 'center', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>{icon}</div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: color }}>{label}</div>
        </div>
    );

    // ২. মিশন ডিটেইল ভিউ
    const TaskDetailView = () => {
        const [proof, setProof] = useState('');
        const [submitting, setSubmitting] = useState(false);

        const handleSubmit = async () => {
            if (!user) return setView('auth');
            if (!proof.trim()) return showToast("প্রমাণ দিতে হবে!");
            setSubmitting(true);
            try {
                await push(ref(db, `artifacts/${appId}/public/data/submissions/${selectedTask.id}`), {
                    userId: user.uid,
                    proof: proof.trim(),
                    status: 'pending',
                    timestamp: serverValue.TIMESTAMP
                });
                showToast("সফলভাবে সাবমিট হয়েছে! ✅");
                setView('home');
            } catch (e) { showToast("Error occurred!"); }
            setSubmitting(false);
        };

        return (
            <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>
                <div style={{ background: 'white', padding: '25px', borderRadius: '25px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '10px' }}>{selectedTask?.title}</h2>
                    <div style={{ display: 'inline-block', background: '#f0fdf4', color: theme.emerald, padding: '5px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, marginBottom: '20px' }}>
                        পুরস্কার: {selectedTask?.reward} পয়েন্ট
                    </div>
                    <p style={{ fontSize: '13px', color: theme.textLight, marginBottom: '25px' }}>নিচের লিঙ্কে গিয়ে কাজটি সম্পন্ন করুন এবং তারপর প্রমাণ হিসেবে আপনার ইউজারনেম বা আইডি এখানে দিন।</p>
                    
                    <a href={selectedTask?.link} target="_blank" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', background: '#f1f5f9', color: theme.indigo, padding: '12px', borderRadius: '15px', fontWeight: 800, marginBottom: '25px', border: '1px solid #e2e8f0' }}>
                        মিশন শুরু করুন 🔗
                    </a>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '10px', fontWeight: 800, color: theme.textLight, textTransform: 'uppercase', marginLeft: '5px' }}>সাবমিশন প্রমাণ</label>
                        <textarea 
                            value={proof}
                            onChange={(e) => setProof(e.target.value)}
                            placeholder="আপনার ইউজারনেম বা আইডি লিখুন..."
                            style={{ width: '100%', marginTop: '8px', padding: '15px', borderRadius: '15px', border: '1px solid #e2e8f0', background: '#f8fafc', outline: 'none', fontSize: '14px', resize: 'none' }}
                            rows="3"
                        />
                    </div>

                    <button onClick={handleSubmit} disabled={submitting} style={{ width: '100%', padding: '16px', borderRadius: '18px', background: theme.indigo, color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)' }}>
                        {submitting ? 'প্রসেসিং...' : 'প্রমাণ সাবমিট করুন'}
                    </button>
                    <button onClick={() => setView('home')} style={{ width: '100%', marginTop: '10px', padding: '10px', border: 'none', background: 'none', color: theme.textLight, fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>বাতিল করুন</button>
                </div>
            </div>
        );
    };

    // ৩. ট্রাস্ট স্কোর ভিউ (donut chart & level logic)
    const TrustScoreView = () => {
        const score = userData?.trustScore || 100;
        const level = userData?.userLevel || 1;
        const radius = 70;
        const circ = 2 * Math.PI * radius;
        const offset = circ - (score / 100) * circ;

        return (
            <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
                <div style={{ background: 'white', padding: '30px 20px', borderRadius: '35px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 800, color: theme.textLight, textTransform: 'uppercase', marginBottom: '25px' }}>ট্রাস্ট রেটিং</h3>
                    
                    <div style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto' }}>
                        <svg width="160" height="160">
                            <circle cx="80" cy="80" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
                            <circle cx="80" cy="80" r={radius} fill="none" stroke={score > 50 ? theme.emerald : theme.rose} strokeWidth="12" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} transform="rotate(-90 80 80)" />
                        </svg>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontSize: '42px', fontWeight: 800, color: theme.text }}>{score}</div>
                            <div style={{ fontSize: '12px', color: theme.textLight, fontWeight: 700 }}>পয়েন্ট</div>
                        </div>
                    </div>

                    <div style={{ marginTop: '30px', background: '#f8fafc', padding: '15px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '11px', fontWeight: 800, color: theme.textLight, textTransform: 'uppercase', marginBottom: '8px' }}>ইউজার লেভেল</div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', alignItems: 'center' }}>
                            <LevelBadge active={level >= 1} label="New" />
                            <div style={{ width: '30px', height: '2px', background: level >= 2 ? theme.indigo : '#e2e8f0' }} />
                            <LevelBadge active={level >= 2} label="Junior" />
                            <div style={{ width: '30px', height: '2px', background: level >= 3 ? theme.indigo : '#e2e8f0' }} />
                            <LevelBadge active={level >= 3} label="Pro" />
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '20px', background: '#fff1f2', padding: '15px', borderRadius: '20px', border: '1px solid #fecdd3', textAlign: 'left', display: 'flex', gap: '12px' }}>
                    <AlertTriangle color={theme.rose} size={24} />
                    <p style={{ fontSize: '12px', color: '#be123c', fontWeight: 600, margin: 0 }}>সতর্কতা: স্ক্যাম বা ফেইক প্রুফ দিলে আপনার ট্রাস্ট স্কোর কমে যাবে এবং অ্যাকাউন্ট সাসপেন্ড হতে পারে।</p>
                </div>
            </div>
        );
    };

    const LevelBadge = ({ active, label }) => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: active ? theme.indigo : '#cbd5e1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800 }}>{active ? '✓' : ''}</div>
            <span style={{ fontSize: '10px', fontWeight: 800, color: active ? theme.text : theme.textLight }}>{label}</span>
        </div>
    );

    // ৪. প্রোফাইল ভিউ
    const ProfileView = () => (
        <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>
            <div style={{ background: 'white', padding: '30px', borderRadius: '30px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.03)' }}>
                <div style={{ width: '90px', height: '90px', borderRadius: '28px', margin: '0 auto 15px', border: '4px solid white', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', overflow: 'hidden', background: '#f1f5f9' }}>
                    <img src={userData?.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 800 }}>{userData?.name || 'Loading...'}</h2>
                <p style={{ fontSize: '12px', color: theme.textLight }}>{user?.email || 'Anonymous Account'}</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '25px' }}>
                    <StatBox label="Points" value={userData?.points || 0} />
                    <StatBox label="Completed" value={userData?.tasksCompleted || 0} />
                </div>

                <div style={{ marginTop: '20px', background: '#f0fdf4', padding: '15px', borderRadius: '18px', border: '1px dashed #10b981', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '9px', fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>Referral Code</div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: theme.emerald, letterSpacing: '2px' }}>{userData?.referralCode || '------'}</div>
                    </div>
                    <button onClick={() => { navigator.clipboard.writeText(userData?.referralCode); showToast("Copied! 📋"); }} style={{ background: theme.emerald, color: 'white', border: 'none', padding: '8px 15px', borderRadius: '10px', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>Copy</button>
                </div>

                <button onClick={() => signOut(auth).then(() => setView('auth'))} style={{ marginTop: '30px', width: '100%', padding: '12px', borderRadius: '15px', border: '1px solid #fee2e2', background: '#fff', color: theme.rose, fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <LogOut size={16} /> Logout
                </button>
            </div>
        </div>
    );

    const StatBox = ({ label, value }) => (
        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '9px', fontWeight: 800, color: theme.textLight, textTransform: 'uppercase', display: 'block' }}>{label}</span>
            <b style={{ fontSize: '18px', color: theme.indigo }}>{value}</b>
        </div>
    );

    // ৫. অথেনটিকেশন ভিউ (Login/Signup)
    const AuthView = () => {
        const [isSignup, setIsSignup] = useState(false);
        const [email, setEmail] = useState('');
        const [pass, setPass] = useState('');
        const [name, setName] = useState('');
        const [loading, setLoading] = useState(false);

        const handleAuth = async () => {
            if (!email || !pass) return showToast("Email and Password required!");
            setLoading(true);
            try {
                if (isSignup) {
                    if (!name) return showToast("Name is required!");
                    const res = await createUserWithEmailAndPassword(auth, email, pass);
                    await set(ref(db, `artifacts/${appId}/users/${res.user.uid}/stats`), {
                        name, points: 0, trustScore: 100, userLevel: 1, referralCode: res.user.uid.substring(0, 6).toUpperCase()
                    });
                } else {
                    await signInWithEmailAndPassword(auth, email, pass);
                }
                setView('home');
            } catch (e) { showToast(e.message); }
            setLoading(false);
        };

        return (
            <div style={{ padding: '40px 20px', maxWidth: '400px', margin: '0 auto', minHeight: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1 style={{ fontSize: '32px', fontWeight: 800, background: theme.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>TaskBazar</h1>
                    <p style={{ color: theme.textLight, fontWeight: 600, fontSize: '14px' }}>The Premium Micro-Task Platform</p>
                </div>

                <div style={{ background: 'white', padding: '25px', borderRadius: '25px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
                    {isSignup && (
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 800, color: theme.textLight, marginLeft: '5px' }}>সম্পূর্ণ নাম</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0', marginTop: '5px', outline: 'none' }} placeholder="আপনার নাম লিখুন" />
                        </div>
                    )}
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 800, color: theme.textLight, marginLeft: '5px' }}>ইমেইল</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0', marginTop: '5px', outline: 'none' }} placeholder="email@example.com" />
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 800, color: theme.textLight, marginLeft: '5px' }}>পাসওয়ার্ড</label>
                        <input type="password" value={pass} onChange={e => setPass(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0', marginTop: '5px', outline: 'none' }} placeholder="••••••••" />
                    </div>

                    <button onClick={handleAuth} disabled={loading} style={{ width: '100%', padding: '14px', borderRadius: '15px', background: theme.gradient, color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 15px rgba(99, 102, 241, 0.2)' }}>
                        {loading ? 'অপেক্ষা করুন...' : (isSignup ? 'অ্যাকাউন্ট খুলুন' : 'লগইন করুন')}
                    </button>

                    <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: theme.textLight }}>
                        {isSignup ? "আগেই অ্যাকাউন্ট আছে?" : "নতুন ইউজার?"} 
                        <span onClick={() => setIsSignup(!isSignup)} style={{ color: theme.indigo, fontWeight: 800, marginLeft: '5px', cursor: 'pointer' }}>
                            {isSignup ? "লগইন করুন" : "রেজিস্টার করুন"}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    // --- হ্যান্ডলার ফাংশনস ---
    const handleDailyBonus = async () => {
        if (!user) return setView('auth');
        // এটি একটি ডেমো লজিক, রিয়েল সার্ভারে ব্যাকএন্ড এপিআই দিয়ে করা উচিত
        showToast("ডেইলি বোনাস সফলভাবে পাওয়া গেছে! +১০ 🎁");
        const statsRef = ref(db, `artifacts/${appId}/users/${user.uid}/stats`);
        await runTransaction(statsRef, (current) => {
            if (current) {
                current.points = (current.points || 0) + 10;
            }
            return current;
        });
    };

    // --- মেইন রেন্ডার লজিক ---
    if (!user && view !== 'auth') {
        // যদি ইউজার লগইন না থাকে, তবে অটোমেটিক অথ ভিউতে নিয়ে যাবে যদি নির্দিষ্ট কিছু পেজ এক্সেস করতে চায়
        if (['promote', 'manage', 'admin', 'profile'].includes(view)) {
            setView('auth');
        }
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: theme.bg, fontFamily: "'Plus Jakarta Sans', sans-serif", color: theme.text }}>
            {/* টোস্ট মেসেজ */}
            {toast.show && (
                <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: '#1e293b', color: 'white', padding: '10px 25px', borderRadius: '50px', fontSize: '12px', fontWeight: 800, zIndex: 9999, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
                    {toast.msg}
                </div>
            )}

            {view !== 'auth' && <Header />}

            <main style={{ paddingBottom: '100px' }}>
                {view === 'home' && <HomeView />}
                {view === 'auth' && <AuthView />}
                {view === 'profile' && <ProfileView />}
                {view === 'trust' && <TrustScoreView />}
                {view === 'detail' && <TaskDetailView />}
                {/* অন্যান্য ভিউ যেমন promote, manage, admin এখানে যুক্ত করা যাবে */}
                {['promote', 'manage', 'admin'].includes(view) && (
                    <div style={{ padding: '40px', textAlign: 'center', color: theme.textLight }}>
                        <ShieldCheck size={48} style={{ marginBottom: '15px', color: theme.indigo }} />
                        <h2 style={{ fontSize: '18px', fontWeight: 800 }}>শীঘ্রই আসছে...</h2>
                        <p style={{ fontSize: '12px' }}>এই বিভাগটি বর্তমানে অপ্টিমাইজ করা হচ্ছে।</p>
                        <button onClick={() => setView('home')} style={{ marginTop: '20px', padding: '10px 20px', borderRadius: '12px', background: theme.indigo, color: 'white', border: 'none', fontWeight: 800 }}>হোমে ফিরে যান</button>
                    </div>
                )}
            </main>

            {view !== 'auth' && <BottomNav />}
        </div>
    );
}

