import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { 
  getDatabase, 
  ref, 
  onValue, 
  set, 
  update, 
  push, 
  serverValue, 
  runTransaction,
  query,
  orderByChild,
  equalTo,
  limitToLast
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
  ChevronRight,
  Copy,
  Plus,
  ArrowLeft,
  Trash2,
  Flag,
  Send,
  ExternalLink,
  Gift,
  Star
} from 'lucide-react';

// --- Firebase Configuration (আপনার আগের ফাইল থেকে নেওয়া) ---
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

// --- থিম কালারস (Inline CSS এর জন্য) ---
const theme = {
    primary: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    bg: '#f8fafc',
    surface: '#ffffff',
    text: '#0f172a',
    textLight: '#64748b',
    success: '#10b981',
    danger: '#f43f5e',
    warning: '#f59e0b',
    indigo: '#4f46e5'
};

export default function App() {
    // --- স্টেটস ---
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [view, setView] = useState('home'); // home, profile, order, manage, admin, leaderboard, support, trust, spin, special
    const [lang, setLang] = useState('bn');
    const [tasks, setTasks] = useState({});
    const [submissions, setSubmissions] = useState({});
    const [toast, setToast] = useState({ show: false, msg: '' });
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);

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
            setLoading(false);
        });

        // পাবলিক টাস্ক লিস্ট লিসেনার
        const tasksRef = ref(db, `artifacts/${appId}/public/data/microtasks`);
        onValue(tasksRef, (snap) => {
            setTasks(snap.val() || {});
        });

        return () => unsubscribe();
    }, []);

    const loadUserData = (uid) => {
        // ইউজার স্ট্যাটস
        const statsRef = ref(db, `artifacts/${appId}/users/${uid}/stats`);
        onValue(statsRef, (snap) => {
            setUserData(snap.val());
        });

        // অ্যাডমিন চেক
        const adminRef = ref(db, `artifacts/${appId}/admins/${uid}`);
        onValue(adminRef, (snap) => {
            setIsAdmin(snap.val() === true);
        });

        // সাবমিশনস (ম্যানেজ পেজের জন্য)
        const subRef = ref(db, `artifacts/${appId}/public/data/submissions`);
        onValue(subRef, (snap) => {
            setSubmissions(snap.val() || {});
        });
    };

    const showToast = (msg) => {
        setToast({ show: true, msg });
        setTimeout(() => setToast({ show: false, msg: '' }), 3000);
    };

    // --- হ্যান্ডলার ফাংশনস ---
    const handleDailyBonus = async () => {
        if (!user) return setView('auth');
        // আসল প্রজেক্টে এটি এপিআই এর মাধ্যমে করা নিরাপদ
        showToast("ডেইলি বোনাস সফলভাবে যুক্ত হয়েছে! +৫");
        const statsRef = ref(db, `artifacts/${appId}/users/${user.uid}/stats`);
        await runTransaction(statsRef, (current) => {
            if (current) {
                current.points = (current.points || 0) + 5;
            }
            return current;
        });
    };

    // --- সাব-কম্পোনেন্টস (Views) ---

    const Header = () => (
        <div style={{
            background: theme.primary, padding: '15px 20px 25px', color: 'white',
            borderBottomLeftRadius: '25px', borderBottomRightRadius: '25px',
            position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '480px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div onClick={() => setView('profile')} style={{ cursor: 'pointer', width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.4)', overflow: 'hidden' }}>
                        <img src={userData?.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: '13px', fontWeight: 800 }}>{userData?.name || (user ? 'Elite User' : 'Guest')}</div>
                        <div style={{ fontSize: '9px', fontWeight: 700, opacity: 0.8, background: 'rgba(255,255,255,0.2)', padding: '1px 5px', borderRadius: '4px', display: 'inline-block' }}>{isAdmin ? 'ADMIN PRO' : 'PRO MEMBER'}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')} style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.15)', padding: '5px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: 800 }}>
                        {lang.toUpperCase()}
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', padding: '5px 12px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.3)', textAlign: 'right' }}>
                        <span style={{ fontSize: '8px', textTransform: 'uppercase', opacity: 0.8, display: 'block' }}>Points</span>
                        <b style={{ fontSize: '14px' }}>{userData?.points || 0}</b>
                    </div>
                </div>
            </div>
        </div>
    );

    const BottomNav = () => (
        <div style={{ position: 'fixed', bottom: '15px', left: '50%', transform: 'translateX(-50%)', width: '92%', maxWidth: '440px', zIndex: 1000 }}>
            <div style={{ height: '65px', background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(20px)', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid #fff' }}>
                <NavBtn icon={<Home size={20}/>} label="Home" active={view === 'home'} onClick={() => setView('home')} />
                <NavBtn icon={<PlusCircle size={20}/>} label="Order" active={view === 'order'} onClick={() => setView('order')} />
                <NavBtn icon={<Settings size={20}/>} label="Manage" active={view === 'manage'} onClick={() => setView('manage')} />
                <NavBtn icon={<User size={20}/>} label="Profile" active={view === 'profile'} onClick={() => setView('profile')} />
                {isAdmin && <NavBtn icon={<LayoutDashboard size={20}/>} label="Admin" active={view === 'admin'} onClick={() => setView('admin')} color={theme.danger} />}
            </div>
        </div>
    );

    const NavBtn = ({ icon, label, active, onClick, color }) => (
        <div onClick={onClick} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: active ? (color || '#6366f1') : theme.textLight, transition: '0.3s' }}>
            {icon}
            <span style={{ fontSize: '9px', fontWeight: 800, marginTop: '2px' }}>{label}</span>
        </div>
    );

    // --- ভিউ রেন্ডারিং লজিক ---

    const HomeView = () => (
        <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>
            {/* Quick Actions Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '25px' }}>
                <QuickCard icon="🎡" label="SPIN" color="#6366f1" onClick={() => setView('spin')} />
                <QuickCard icon="🎁" label="BONUS" color="#10b981" onClick={handleDailyBonus} />
                <QuickCard icon="🛡️" label="TRUST" color="#f59e0b" onClick={() => setView('trust')} />
            </div>

            <h3 style={{ fontSize: '15px', fontWeight: 800, marginBottom: '15px', color: theme.text, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RotateCw size={16} color="#6366f1" /> উপলব্ধ মিশনসমূহ
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.keys(tasks).length > 0 ? Object.keys(tasks).reverse().map(id => {
                    const t = tasks[id];
                    // নিজের তৈরি টাস্ক হাইড করা
                    if (t.creatorId === user?.uid) return null;
                    return (
                        <div key={id} onClick={() => { setSelectedTask({...t, id}); setView('task-detail'); }} style={{ background: 'white', padding: '15px', borderRadius: '18px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: '0.2s' }}>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: '14px', color: theme.text }}>{t.title}</div>
                                <div style={{ color: theme.success, fontWeight: 800, fontSize: '12px', marginTop: '4px' }}>+{t.reward} Points</div>
                            </div>
                            <ChevronRight size={18} color="#cbd5e1" />
                        </div>
                    );
                }) : <div style={{ textAlign: 'center', padding: '40px', color: theme.textLight, fontSize: '13px' }}>কোন নতুন মিশন নেই</div>}
            </div>
            
            <div onClick={() => setView('leaderboard')} style={{ marginTop: '25px', background: '#eef2ff', padding: '15px', borderRadius: '18px', border: '1px solid #c7d2fe', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ background: 'white', padding: '8px', borderRadius: '12px' }}>🏆</div>
                    <div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#3730a3' }}>লিডারবোর্ড দেখুন</div>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: '#6366f1' }}>সেরা ২০ ইউজারদের তালিকা</div>
                    </div>
                </div>
                <ChevronRight size={18} color="#6366f1" />
            </div>
        </div>
    );

    const QuickCard = ({ icon, label, color, onClick }) => (
        <div onClick={onClick} style={{ background: 'white', padding: '15px 10px', borderRadius: '20px', textAlign: 'center', border: '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>{icon}</div>
            <div style={{ fontSize: '10px', fontWeight: 800, color: color }}>{label}</div>
        </div>
    );

    const ProfileView = () => (
        <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>
            <div style={{ background: 'white', padding: '30px 20px', borderRadius: '30px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                <div style={{ position: 'relative', width: '90px', height: '90px', margin: '0 auto 15px' }}>
                    <div style={{ width: '100%', height: '100%', borderRadius: '30px', overflow: 'hidden', border: '4px solid white', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>
                        <img src={userData?.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: '#6366f1', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', cursor: 'pointer' }}>✎</div>
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: theme.text }}>{userData?.name || 'Loading...'}</h2>
                <p style={{ fontSize: '12px', color: theme.textLight }}>{user?.email}</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '25px' }}>
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '9px', fontWeight: 800, color: theme.textLight, textTransform: 'uppercase', display: 'block' }}>Points</span>
                        <b style={{ fontSize: '18px', color: '#6366f1' }}>{userData?.points || 0}</b>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '9px', fontWeight: 800, color: theme.textLight, textTransform: 'uppercase', display: 'block' }}>Missions</span>
                        <b style={{ fontSize: '18px', color: '#6366f1' }}>{userData?.tasksCompleted || 0}</b>
                    </div>
                </div>

                <div style={{ marginTop: '20px', background: '#f0fdf4', padding: '15px', borderRadius: '18px', border: '1px dashed #10b981', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}>
                    <div>
                        <div style={{ fontSize: '9px', fontWeight: 800, color: '#166534' }}>REFER CODE</div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#10b981', letterSpacing: '1px' }}>{userData?.referralCode || '------'}</div>
                    </div>
                    <button onClick={() => { navigator.clipboard.writeText(userData?.referralCode); showToast("Copied! 📋"); }} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '10px', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>Copy</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '30px' }}>
                    <button onClick={() => setView('support')} style={{ width: '100%', padding: '12px', borderRadius: '15px', background: '#f1f5f9', border: 'none', color: '#475569', fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <MessageCircle size={16} /> Help & Support
                    </button>
                    <button onClick={() => signOut(auth)} style={{ width: '100%', padding: '12px', borderRadius: '15px', background: '#fff', border: '1px solid #fee2e2', color: theme.danger, fontWeight: 800, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </div>
        </div>
    );

    const AuthView = () => {
        const [isSignup, setIsSignup] = useState(false);
        const [email, setEmail] = useState('');
        const [pass, setPass] = useState('');
        const [name, setName] = useState('');

        const handleAuth = async () => {
            if (!email || !pass) return showToast("ইমেইল ও পাসওয়ার্ড দিন!");
            try {
                if (isSignup) {
                    if (!name) return showToast("সম্পূর্ণ নাম লিখুন!");
                    const res = await createUserWithEmailAndPassword(auth, email, pass);
                    await set(ref(db, `artifacts/${appId}/users/${res.user.uid}/stats`), {
                        name, points: 0, trustScore: 100, userLevel: 1, tasksCompleted: 0,
                        referralCode: res.user.uid.substring(0, 6).toUpperCase(),
                        createdAt: serverValue.TIMESTAMP
                    });
                } else {
                    await signInWithEmailAndPassword(auth, email, pass);
                }
                setView('home');
            } catch (e) { showToast(e.message); }
        };

        return (
            <div style={{ padding: '40px 20px', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 800, background: theme.primary, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '5px' }}>TaskBazar</h1>
                <p style={{ color: theme.textLight, fontSize: '13px', marginBottom: '30px' }}>Elite Micro-Task Platform</p>

                <div style={{ background: 'white', padding: '25px', borderRadius: '25px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px' }}>{isSignup ? 'রেজিস্ট্রেশন করুন' : 'লগইন করুন'}</h3>
                    
                    {isSignup && (
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 800, color: theme.textLight, marginLeft: '5px' }}>আপনার নাম</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0', marginTop: '5px', outline: 'none' }} placeholder="সম্পূর্ণ নাম লিখুন" />
                        </div>
                    )}
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 800, color: theme.textLight, marginLeft: '5px' }}>ইমেইল অ্যাড্রেস</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0', marginTop: '5px', outline: 'none' }} placeholder="example@mail.com" />
                    </div>
                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 800, color: theme.textLight, marginLeft: '5px' }}>গোপন পাসওয়ার্ড</label>
                        <input type="password" value={pass} onChange={e => setPass(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e2e8f0', marginTop: '5px', outline: 'none' }} placeholder="••••••••" />
                    </div>

                    <button onClick={handleAuth} style={{ width: '100%', padding: '15px', borderRadius: '15px', background: theme.primary, color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 15px rgba(99, 102, 241, 0.2)' }}>
                        {isSignup ? 'অ্যাকাউন্ট খুলুন' : 'প্রবেশ করুন'}
                    </button>

                    <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: theme.textLight }}>
                        {isSignup ? 'আগেই অ্যাকাউন্ট আছে?' : 'নতুন মেম্বার?'} 
                        <span onClick={() => setIsSignup(!isSignup)} style={{ color: '#6366f1', fontWeight: 800, marginLeft: '5px', cursor: 'pointer' }}>
                            {isSignup ? 'লগইন করুন' : 'সাইন আপ করুন'}
                        </span>
                    </p>
                </div>
            </div>
        );
    };

    const OrderView = () => {
        const [order, setOrder] = useState({ title: '', link: '', type: 'YouTube Subscribe', qty: 10 });
        const rates = { "YouTube Subscribe": 5, "Facebook Like": 3, "Telegram Join": 4, "App Install": 10 };
        const total = (order.qty || 0) * (rates[order.type] || 0);

        const createCampaign = async () => {
            if (!order.title || !order.link || order.qty < 10) return showToast("সবগুলো তথ্য সঠিকভাবে দিন!");
            if (total > (userData?.points || 0)) return showToast("পর্যাপ্ত পয়েন্ট নেই!");

            try {
                // এটি একটি সিম্পল ট্রানজেকশন, ব্যাকএন্ড থাকলে আরও সিকিউর হতো
                const newRef = push(ref(db, `artifacts/${appId}/public/data/microtasks`));
                await set(newRef, {
                    ...order,
                    creatorId: user.uid,
                    reward: rates[order.type] - 1, // ১ পয়েন্ট সিস্টেম চার্জ
                    timestamp: serverValue.TIMESTAMP
                });

                const statsRef = ref(db, `artifacts/${appId}/users/${user.uid}/stats`);
                await runTransaction(statsRef, (curr) => {
                    if (curr) curr.points -= total;
                    return curr;
                });

                showToast("ক্যাম্পেইন সফলভাবে তৈরি হয়েছে! 🚀");
                setView('home');
            } catch (e) { showToast("Error occurred!"); }
        };

        return (
            <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '15px' }}>নতুন ক্যাম্পেইন তৈরি করুন</h3>
                <div style={{ background: 'white', padding: '20px', borderRadius: '25px', border: '1px solid #e2e8f0' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: theme.textLight }}>সার্ভিস ক্যাটাগরি</label>
                        <select value={order.type} onChange={e => setOrder({...order, type: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', marginTop: '5px', fontWeight: 700 }}>
                            {Object.keys(rates).map(k => <option key={k} value={k}>{k} ({rates[k]} pts)</option>)}
                        </select>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: theme.textLight }}>টাইটেল</label>
                        <input type="text" placeholder="যেমন: সাবস্ক্রাইব করুন" value={order.title} onChange={e => setOrder({...order, title: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', marginTop: '5px', outline: 'none' }} />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: theme.textLight }}>লিঙ্ক (URL)</label>
                        <input type="url" placeholder="https://..." value={order.link} onChange={e => setOrder({...order, link: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', marginTop: '5px', outline: 'none' }} />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: theme.textLight }}>পরিমাণ (নূন্যতম ১০)</label>
                        <input type="number" placeholder="10" value={order.qty} onChange={e => setOrder({...order, qty: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', marginTop: '5px', outline: 'none' }} />
                    </div>

                    <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '15px', border: '1px dashed #10b981', textAlign: 'center', marginBottom: '20px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#166534' }}>মোট খরচ: </span>
                        <b style={{ fontSize: '18px', color: '#10b981' }}>{total} Pts</b>
                    </div>

                    <button onClick={createCampaign} style={{ width: '100%', padding: '15px', borderRadius: '15px', background: theme.primary, color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer' }}>
                        লঞ্চ ক্যাম্পেইন 🚀
                    </button>
                </div>
            </div>
        );
    };

    // --- মেইন রেন্ডার ---
    if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme.bg }}>
        <RotateCw className="animate-spin" color="#6366f1" size={40} />
    </div>;

    if (!user && view !== 'auth') return <AuthView />;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: theme.bg, fontFamily: "'Plus Jakarta Sans', sans-serif", paddingBottom: '100px' }}>
            {/* টোস্ট নোটিফিকেশন */}
            {toast.show && (
                <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', background: '#1e293b', color: 'white', padding: '10px 20px', borderRadius: '50px', fontSize: '12px', fontWeight: 800, zIndex: 9999, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
                    {toast.msg}
                </div>
            )}

            <Header />

            <main>
                {view === 'home' && <HomeView />}
                {view === 'auth' && <AuthView />}
                {view === 'profile' && <ProfileView />}
                {view === 'order' && <OrderView />}
                
                {/* টাস্ক ডিটেইল ভিউ */}
                {view === 'task-detail' && selectedTask && (
                    <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>
                        <div style={{ background: 'white', padding: '25px', borderRadius: '25px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
                            <div onClick={() => setView('home')} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: theme.textLight, fontSize: '12px', fontWeight: 800, marginBottom: '20px', cursor: 'pointer' }}>
                                <ArrowLeft size={16} /> পিছনে যান
                            </div>
                            <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '5px' }}>{selectedTask.title}</h2>
                            <div style={{ background: '#f0fdf4', color: theme.success, padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, display: 'inline-block', marginBottom: '20px' }}>রিওয়ার্ড: {selectedTask.reward} পয়েন্ট</div>
                            
                            <p style={{ fontSize: '13px', color: theme.textLight, marginBottom: '25px', lineHeight: 1.6 }}>
                                নির্দেশনাবলী: নিচের লিঙ্কে ক্লিক করে কাজটি সম্পন্ন করুন। কাজ শেষে আপনার ইউজারনেম বা আইডি এখানে প্রুফ হিসেবে জমা দিন।
                            </p>

                            <a href={selectedTask.link} target="_blank" style={{ display: 'block', textDecoration: 'none', background: '#f1f5f9', padding: '15px', borderRadius: '15px', textAlign: 'center', color: '#6366f1', fontWeight: 800, fontSize: '14px', border: '1px solid #e2e8f0', marginBottom: '25px' }}>
                                মিশন শুরু করুন 🔗
                            </a>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 800, color: theme.textLight, marginLeft: '5px' }}>প্রমাণ (Username/ID)</label>
                                <textarea id="task-proof" placeholder="আপনার কাজের প্রমাণ এখানে লিখুন..." style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', marginTop: '5px', outline: 'none', fontSize: '13px', minHeight: '80px' }}></textarea>
                            </div>

                            <button onClick={async () => {
                                const proof = document.getElementById('task-proof').value.trim();
                                if(!proof) return showToast("প্রমাণ দিতে হবে!");
                                await push(ref(db, `artifacts/${appId}/public/data/submissions/${selectedTask.id}`), {
                                    userId: user.uid,
                                    proof,
                                    status: 'pending',
                                    timestamp: serverValue.TIMESTAMP
                                });
                                showToast("সফলভাবে জমা হয়েছে! ✅");
                                setView('home');
                            }} style={{ width: '100%', padding: '15px', borderRadius: '15px', background: theme.primary, color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer' }}>
                                প্রমাণ জমা দিন
                            </button>
                        </div>
                    </div>
                )}

                {/* লিডারবোর্ড ভিউ */}
                {view === 'leaderboard' && (
                    <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>
                        <div onClick={() => setView('home')} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: theme.textLight, fontSize: '12px', fontWeight: 800, marginBottom: '20px', cursor: 'pointer' }}>
                            <ArrowLeft size={16} /> পিছনে যান
                        </div>
                        <h2 style={{ fontSize: '20px', fontWeight: 800, textAlign: 'center', marginBottom: '25px' }}>🏆 লিডারবোর্ড</h2>
                        <div style={{ background: 'white', borderRadius: '25px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            <LeaderboardList db={db} appId={appId} currentUserId={user.uid} />
                        </div>
                    </div>
                )}

                {/* ট্রাস্ট স্কোর ভিউ */}
                {view === 'trust' && (
                    <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>
                        <div onClick={() => setView('home')} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: theme.textLight, fontSize: '12px', fontWeight: 800, marginBottom: '20px', cursor: 'pointer' }}>
                            <ArrowLeft size={16} /> পিছনে যান
                        </div>
                        <div style={{ background: 'white', padding: '30px 20px', borderRadius: '35px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 800, color: theme.textLight, textTransform: 'uppercase', marginBottom: '25px' }}>ট্রাস্ট রেটিং</h3>
                            <div style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto' }}>
                                <svg width="160" height="160" viewBox="0 0 160 160">
                                    <circle cx="80" cy="80" r="70" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                                    <circle cx="80" cy="80" r="70" fill="none" stroke="#10b981" strokeWidth="12" strokeDasharray="440" strokeDashoffset={440 - (userData?.trustScore || 100) / 100 * 440} strokeLinecap="round" transform="rotate(-90 80 80)" style={{ transition: 'stroke-dashoffset 1s' }} />
                                </svg>
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                    <div style={{ fontSize: '42px', fontWeight: 800 }}>{userData?.trustScore || 100}</div>
                                    <div style={{ fontSize: '12px', color: theme.textLight, fontWeight: 700 }}>পয়েন্ট</div>
                                </div>
                            </div>
                            <div style={{ marginTop: '25px', background: '#f8fafc', padding: '15px', borderRadius: '20px', border: '1px solid #e2e8f0', textAlign: 'left' }}>
                                <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: 1.6 }}>
                                    ✅ <b>খুব ভালো!</b> আপনি একজন বিশ্বস্ত মেম্বার। সৎভাবে কাজ করলে আপনার ট্রাস্ট স্কোর বাড়বে এবং পেমেন্ট দ্রুত পাবেন।
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* ম্যানেজ ক্যাম্পেইন ভিউ */}
                {view === 'manage' && (
                    <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '15px' }}>আমার ক্যাম্পেইনসমূহ</h3>
                        <ManageCampaigns db={db} appId={appId} user={user} submissions={submissions} tasks={tasks} showToast={showToast} />
                    </div>
                )}

                {/* সাপোর্ট ভিউ */}
                {view === 'support' && (
                    <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>
                         <div onClick={() => setView('profile')} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: theme.textLight, fontSize: '12px', fontWeight: 800, marginBottom: '20px', cursor: 'pointer' }}>
                            <ArrowLeft size={16} /> প্রোফাইলে যান
                        </div>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '15px' }}>সাপোর্ট সেন্টার</h3>
                        <div style={{ background: 'white', padding: '20px', borderRadius: '25px', border: '1px solid #e2e8f0', minHeight: '300px' }}>
                            <p style={{ fontSize: '13px', color: theme.textLight, textAlign: 'center', padding: '40px' }}>সাপোর্ট চ্যাট ফিচারটি শীঘ্রই আপডেট করা হবে। জরুরী প্রয়োজনে আমাদের টেলিগ্রামে মেসেজ দিন।</p>
                            <a href="https://t.me/taskbazar" target="_blank" style={{ display: 'block', textDecoration: 'none', background: '#0088cc', color: 'white', textAlign: 'center', padding: '12px', borderRadius: '15px', fontWeight: 800 }}>Telegram Support</a>
                        </div>
                    </div>
                )}

                {/* অ্যাডমিন ভিউ (শুধুমাত্র অ্যাডমিনদের জন্য) */}
                {view === 'admin' && isAdmin && (
                    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px' }}>অ্যাডমিন কন্ট্রোল প্যানেল</h3>
                        <AdminPanel db={db} appId={appId} showToast={showToast} />
                    </div>
                )}
            </main>

            {view !== 'auth' && <BottomNav />}
        </div>
    );
}

// --- হেল্পার কম্পোনেন্টস ---

function LeaderboardList({ db, appId, currentUserId }) {
    const [list, setList] = useState([]);

    useEffect(() => {
        const usersRef = ref(db, `artifacts/${appId}/users`);
        onValue(usersRef, (snap) => {
            const data = snap.val() || {};
            const arr = Object.keys(data).map(uid => ({
                uid,
                ...data[uid].stats
            })).sort((a, b) => (b.points || 0) - (a.points || 0));
            setList(arr.slice(0, 20));
        });
    }, []);

    return (
        <div>
            {list.map((u, idx) => (
                <div key={u.uid} style={{ display: 'flex', alignItems: 'center', padding: '15px', borderBottom: '1px solid #f1f5f9', background: u.uid === currentUserId ? '#f5f3ff' : 'transparent' }}>
                    <div style={{ width: '25px', fontWeight: 800, color: idx < 3 ? '#6366f1' : '#94a3b8' }}>{idx + 1}</div>
                    <img src={u.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} style={{ width: '35px', height: '35px', borderRadius: '10px', objectFit: 'cover', margin: '0 12px' }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700 }}>{u.name} {u.uid === currentUserId && '⭐'}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>{u.tasksCompleted || 0} Missions</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#6366f1' }}>{u.points || 0}</div>
                        <div style={{ fontSize: '8px', color: '#94a3b8', textTransform: 'uppercase' }}>Points</div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function ManageCampaigns({ db, appId, user, submissions, tasks, showToast }) {
    const myTasks = Object.keys(tasks).filter(id => tasks[id].creatorId === user.uid);
    const [reviewTask, setReviewTask] = useState(null);

    const handleReview = async (taskId, subId, workerId, status, reward) => {
        try {
            await update(ref(db, `artifacts/${appId}/public/data/submissions/${taskId}/${subId}`), { status });
            if (status === 'approved') {
                const workerRef = ref(db, `artifacts/${appId}/users/${workerId}/stats`);
                await runTransaction(workerRef, (curr) => {
                    if (curr) {
                        curr.points = (curr.points || 0) + reward;
                        curr.tasksCompleted = (curr.tasksCompleted || 0) + 1;
                    }
                    return curr;
                });
            }
            showToast(status === 'approved' ? "Approved! ✅" : "Rejected! ❌");
        } catch(e) { showToast("Error review!"); }
    };

    if (reviewTask) {
        const taskSubs = submissions[reviewTask.id] || {};
        const pending = Object.keys(taskSubs).filter(k => taskSubs[k].status === 'pending');
        return (
            <div>
                <div onClick={() => setReviewTask(null)} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b', fontSize: '12px', fontWeight: 800, marginBottom: '15px', cursor: 'pointer' }}>
                    <ArrowLeft size={16} /> লিস্টে ফিরে যান
                </div>
                <h4 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '15px' }}>রিভিউ প্রুফ: {reviewTask.title}</h4>
                {pending.length === 0 ? <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', marginTop: '40px' }}>কোন পেন্ডিং প্রুফ নেই</p> : 
                pending.map(sid => (
                    <div key={sid} style={{ background: 'white', padding: '15px', borderRadius: '18px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '5px' }}>ইউজার প্রমাণ:</div>
                        <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '10px', border: '1px dashed #cbd5e1', fontSize: '13px', fontWeight: 700, marginBottom: '15px', wordBreak: 'break-all' }}>{taskSubs[sid].proof}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <button onClick={() => handleReview(reviewTask.id, sid, taskSubs[sid].userId, 'approved', reviewTask.reward)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '10px', borderRadius: '12px', fontWeight: 800, fontSize: '12px' }}>Approve ✅</button>
                            <button onClick={() => handleReview(reviewTask.id, sid, taskSubs[sid].userId, 'rejected', reviewTask.reward)} style={{ background: '#f43f5e', color: 'white', border: 'none', padding: '10px', borderRadius: '12px', fontWeight: 800, fontSize: '12px' }}>Reject ❌</button>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {myTasks.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', marginTop: '40px' }}>আপনার কোন সক্রিয় ক্যাম্পেইন নেই</p>}
            {myTasks.map(id => {
                const t = tasks[id];
                const taskSubs = submissions[id] || {};
                const pendingCount = Object.keys(taskSubs).filter(k => taskSubs[k].status === 'pending').length;
                const approvedCount = Object.keys(taskSubs).filter(k => taskSubs[k].status === 'approved').length;
                return (
                    <div key={id} style={{ background: 'white', padding: '18px', borderRadius: '22px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '5px' }}>{t.title}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '15px' }}>
                            <span>টার্গেট: {t.qty}</span>
                            <span style={{ color: '#f59e0b' }}>পেন্ডিং: {pendingCount}</span>
                            <span style={{ color: '#10b981' }}>সম্পন্ন: {approvedCount}</span>
                        </div>
                        <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden', marginBottom: '15px' }}>
                            <div style={{ height: '100%', background: 'linear-gradient(90deg, #6366f1, #a855f7)', width: `${(approvedCount / t.qty) * 100}%` }}></div>
                        </div>
                        <button onClick={() => setReviewTask({...t, id})} style={{ width: '100%', padding: '10px', borderRadius: '12px', background: '#f1f5f9', color: '#6366f1', border: 'none', fontWeight: 800, fontSize: '12px' }}>রিভিউ প্রুফ</button>
                    </div>
                );
            })}
        </div>
    );
}

function AdminPanel({ db, appId, showToast }) {
    const [stats, setStats] = useState({ users: 0, tasks: 0 });
    const [notice, setNotice] = useState('');

    useEffect(() => {
        onValue(ref(db, `artifacts/${appId}/users`), (snap) => setStats(s => ({...s, users: Object.keys(snap.val() || {}).length})));
        onValue(ref(db, `artifacts/${appId}/public/data/microtasks`), (snap) => setStats(s => ({...s, tasks: Object.keys(snap.val() || {}).length})));
        onValue(ref(db, `artifacts/${appId}/public/settings/notice`), (snap) => setNotice(snap.val() || ''));
    }, []);

    const saveNotice = async () => {
        await set(ref(db, `artifacts/${appId}/public/settings/notice`), notice);
        showToast("নোটিশ আপডেট হয়েছে!");
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Total Users</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#6366f1' }}>{stats.users}</div>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Total Tasks</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#6366f1' }}>{stats.tasks}</div>
                </div>
            </div>

            <div style={{ background: 'white', padding: '20px', borderRadius: '25px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 800, marginBottom: '15px' }}>সিস্টেম নোটিশ (Scrolling)</h4>
                <textarea value={notice} onChange={e => setNotice(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', minHeight: '60px', outline: 'none', fontSize: '13px' }} placeholder="নোটিশ এখানে লিখুন..."></textarea>
                <button onClick={saveNotice} style={{ width: '100%', marginTop: '10px', padding: '12px', borderRadius: '12px', background: '#1e293b', color: 'white', border: 'none', fontWeight: 800 }}>Save Notice</button>
            </div>
            
            <div style={{ background: '#fff1f2', padding: '20px', borderRadius: '25px', border: '1px solid #fecdd3' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#9f1239', marginBottom: '10px' }}>ডেঞ্জার জোন</h4>
                <p style={{ fontSize: '12px', color: '#be123c', marginBottom: '15px' }}>এখান থেকে সিস্টেমের সেনসিটিভ সেটিংস পরিবর্তন করা যায়। দয়া করে সাবধানে ব্যবহার করুন।</p>
                <button style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#f43f5e', color: 'white', border: 'none', fontWeight: 800 }}>Clear All Reports</button>
            </div>
        </div>
    );
}

