// File Path: app/page.js "important message for gemini ai - this is dashboard"

"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getDatabase, ref, onValue, set, serverTimestamp, get } from 'firebase/database';

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyDgFaTrHW7Grp_Q22p6KNcHZxaEujHsLsE",
    authDomain: "exchange-project-d4028.firebaseapp.com",
    databaseURL: "https://exchange-project-d4028-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "exchange-project-d4028",
    storageBucket: "exchange-project-d4028.firebasestorage.app",
    messagingSenderId: "313976742479",
    appId: "1:313976742479:web:45951b360d875c4768c03a"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getDatabase(app);
const appId = "exchange-project-d4028";

const translations = {
    bn: {
        authTagline: "প্রিমিয়াম মাইক্রো-টাস্ক প্ল্যাটফর্ম",
        fullName: "সম্পূর্ণ নাম", referCode: "রেফার কোড (ঐচ্ছিক)", email: "ইমেইল অ্যাড্রেস", password: "গোপন পাসওয়ার্ড",
        points: "পয়েন্ট", spin: "লাকি স্পিন", gift: "ডেইলি বোনাস", offers: "স্পেশাল অফার", missions: "উপলব্ধ মিশন",
        directChatText: "সরাসরি এডমিনের সাথে কথা বলতে:", adminSupportBtn: "এডমিন সাপোর্ট (চ্যাট)",
        pageHome: "হোম / মিশন", pagePromote: "প্রমোট পেজ", pageProfile: "প্রোফাইল পেজ", pageSpin: "স্পিন / বোনাস", pagePayment: "পেমেন্ট সমস্যা",
        navMissions: "মিশন", navPromote: "প্রমোট", navChat: "অভিযোগ", navProfile: "প্রোফাইল",
        adminReply: "এডমিনের উত্তর:", statusPending: "পেন্ডিং", statusSolved: "সমাধান হয়েছে", logout: "লগআউট",
        performTask: "কাজটি সম্পন্ন করুন 🔗", missionReward: "মিশন রিওয়ার্ড:", proofLabel: "প্রমাণ (ইউজারনেম/লিঙ্ক)", submitBtn: "সাবমিট করুন", cancelBtn: "বাতিল", backBtn: "পিছনে যান",
        verifyEmailTitle: "ইমেইল ভেরিফাই করুন", verifyEmailMsg: "আমরা আপনার ইমেইলে একটি ভেরিফিকেশন লিঙ্ক পাঠিয়েছি। অনুগ্রহ করে আপনার ইনবক্স চেক করুন।",
        checkVerifyBtn: "ভেরিফিকেশন চেক করুন", resendLinkBtn: "লিঙ্ক পুনরায় পাঠান",
        notifTitle: "সিস্টেম নোটিফিকেশন", noNotif: "নতুন কোন নোটিফিকেশন নেই"
    },
    en: {
        authTagline: "The Premium Micro-Task Platform",
        fullName: "Full Name", referCode: "Refer Code (Optional)", email: "Email Address", password: "Secret Password",
        points: "Points", spin: "Lucky Spin", gift: "Daily Gift", offers: "Special Offer", missions: "Available Missions",
        directChatText: "To talk directly with Admin:", adminSupportBtn: "Admin Support (Chat)",
        pageHome: "Home / Missions", pagePromote: "Promote Page", pageProfile: "Profile Page", pageSpin: "Spin / Bonus", pagePayment: "Payment Issue",
        navMissions: "Missions", navPromote: "Promote", navChat: "Complaint", navProfile: "Profile",
        adminReply: "Admin Reply:", statusPending: "Pending", statusSolved: "Solved", logout: "Logout",
        performTask: "Perform Task 🔗", missionReward: "Mission Reward:", proofLabel: "Proof (Username/Link)", submitBtn: "Submit", cancelBtn: "Cancel", backBtn: "Back",
        verifyEmailTitle: "Verify Your Email", verifyEmailMsg: "We've sent a verification link to your email. Please check your inbox.",
        checkVerifyBtn: "Check Verification Status", resendLinkBtn: "Resend Link",
        notifTitle: "System Notifications", noNotif: "No notifications found"
    }
};

const prizes = [
    { label: "0", color: "#f43f5e" }, { label: "2", color: "#6366f1" },
    { label: "5", color: "#10b981" }, { label: "10", color: "#f59e0b" },
    { label: "20", color: "#a855f7" }, { label: "0", color: "#64748b" },
    { label: "50", color: "#ec4899" }, { label: "5", color: "#06b6d4" }
];

export default function TaskBazarApp() {
    const router = useRouter();

    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState({ points: 0, name: "User", avatar: "" });
    const [currentLang, setCurrentLang] = useState('bn');
    const [view, setView] = useState('list-view');
    const [navOpen, setNavOpen] = useState(false);

    // State for Data
    const [systemNotice, setSystemNotice] = useState("");
    const [tasks, setTasks] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [hasNewNotif, setHasNewNotif] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);

    // UI State
    const [toast, setToast] = useState({ msg: "", visible: false });
    const [showAuthPopup, setShowAuthPopup] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [proofInput, setProofInput] = useState("");
    const [isSpinning, setIsSpinning] = useState(false);

    // Refs
    const wheelRef = useRef(null);
    const canvasRef = useRef(null);
    const chatBoxRef = useRef(null);
    const authPopupTimer = useRef(null);

    const t = translations[currentLang];

    // Hydration fix & Init
    useEffect(() => {
        const savedLang = localStorage.getItem('elite_lang') || 'bn';
        setCurrentLang(savedLang);
        const lastView = localStorage.getItem('last_view') || 'list-view';
        setView(lastView);

        // Auth Listener
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser && currentUser.emailVerified) {
                setUser(currentUser);
                localStorage.setItem('isLoggedIn', 'true');
                setShowAuthPopup(false);
                clearTimeout(authPopupTimer.current);
            } else {
                setUser(null);
                localStorage.removeItem('isLoggedIn');
                triggerAuthPopup();
            }
        });

        loadSystemNotice();

        return () => unsubscribe();
    }, []);

    // Change View logic
    const handleSetView = (newView) => {
        setView(newView);
        localStorage.setItem('last_view', newView);
        if (newView === 'spin-view') {
            setTimeout(drawWheel, 100);
        }
    };

    const requireAuth = () => {
        if (!user) {
            triggerAuthPopup();
            return false;
        }
        return true;
    };

    const triggerAuthPopup = () => {
        setShowAuthPopup(true);
    };

    const handleHideAuthPopup = () => {
        setShowAuthPopup(false);
        clearTimeout(authPopupTimer.current);
        authPopupTimer.current = setTimeout(triggerAuthPopup, 60000); // 1 minute
    };

    const showToast = (msg) => {
        setToast({ msg, visible: true });
        setTimeout(() => setToast({ msg: "", visible: false }), 3000);
    };

    const toggleMenu = () => setNavOpen(!navOpen);

    const changeLang = (lang) => {
        setCurrentLang(lang);
        localStorage.setItem('elite_lang', lang);
    };

    // Load Realtime Data
    useEffect(() => {
        if (!user) return;

        // Sync User Data
        const statsRef = ref(db, `artifacts/${appId}/users/${user.uid}/stats`);
        const unsubStats = onValue(statsRef, (snap) => {
            const data = snap.val() || {};
            setUserData({
                points: data.points || 0,
                name: data.name || "User",
                avatar: data.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"
            });
            localStorage.setItem('user_cache_data', JSON.stringify(data));
        });

        // Notifications
        const pubNotifRef = ref(db, `artifacts/${appId}/public/notifications`);
        const pvtNotifRef = ref(db, `artifacts/${appId}/users/${user.uid}/notifications`);

        const lastChecked = parseInt(localStorage.getItem('last_notif_check') || "0");

        const fetchNotifs = async () => {
            try {
                const [pubSnap, pvtSnap] = await Promise.all([get(pubNotifRef), get(pvtNotifRef)]);
                const pubs = pubSnap.val() || {};
                const pvts = pvtSnap.val() || {};
                const combined = [];
                Object.keys(pubs).forEach(id => combined.push({...pubs[id], id, scope: 'public'}));
                Object.keys(pvts).forEach(id => combined.push({...pvts[id], id, scope: 'private'}));
                combined.sort((a,b) => b.timestamp - a.timestamp);

                setNotifications(combined);
                const hasNew = combined.some(n => n.timestamp > lastChecked);
                setHasNewNotif(hasNew);
            } catch (err) { console.error(err); }
        };

        const unsubPubNotif = onValue(pubNotifRef, fetchNotifs);
        const unsubPvtNotif = onValue(pvtNotifRef, fetchNotifs);

        // Chat
        const chatRef = ref(db, `artifacts/${appId}/support/${user.uid}/messages`);
        const unsubChat = onValue(chatRef, (snap) => {
            const msgs = snap.val() || {};
            const msgArray = Object.keys(msgs).map(k => msgs[k]);
            setChatMessages(msgArray);
            if(chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        });

        return () => {
            unsubStats(); unsubPubNotif(); unsubPvtNotif(); unsubChat();
        };
    }, [user]);

    // Load Tasks
    useEffect(() => {
        const tasksRef = ref(db, `artifacts/${appId}/public/data/microtasks`);
        const subsRef = ref(db, `artifacts/${appId}/public/data/submissions`);

        const handleTasks = async () => {
            try {
                const [taskSnap, subSnap] = await Promise.all([get(tasksRef), get(subsRef)]);
                const tks = taskSnap.val() || {};
                const sbs = subSnap.val() || {};

                const loadedTasks = [];
                Object.keys(tks).reverse().forEach(id => {
                    const item = tks[id];
                    if (user && item.creatorId === user.uid) return;

                    let mySubStatus = null;
                    if (user && sbs[id]) {
                        Object.keys(sbs[id]).forEach(sId => {
                            if (sbs[id][sId].userId === user.uid) mySubStatus = sbs[id][sId].status;
                        });
                    }

                    if (mySubStatus === 'approved' || mySubStatus === 'rejected') return;
                    loadedTasks.push({ ...item, id, isPending: mySubStatus === 'pending' });
                });
                setTasks(loadedTasks);
            } catch (error) { console.error(error); }
        };

        const unsubTasks = onValue(tasksRef, handleTasks);
        const unsubSubs = onValue(subsRef, handleTasks);

        return () => { unsubTasks(); unsubSubs(); };
    }, [user]);

    const loadSystemNotice = () => {
        const noticeRef = ref(db, `artifacts/${appId}/public/settings/notice`);
        onValue(noticeRef, (s) => {
            setSystemNotice(s.val() || "");
        });
    };

    const openNotifications = () => {
        if (!requireAuth()) return;
        localStorage.setItem('last_notif_check', Date.now().toString());
        setHasNewNotif(false);
        handleSetView('notification-view');
    };

    const openTaskDetails = (task) => {
        if (!requireAuth()) return;
        setSelectedTask(task);
        handleSetView('detail-view');
    };

    const submitProof = async () => {
        if (!requireAuth()) return;
        if (!proofInput.trim()) return showToast("Proof required!");

        try {
            const subRef = ref(db, `artifacts/${appId}/public/data/submissions/${selectedTask.id}/${Date.now()}`);
            await set(subRef, {
                userId: user.uid,
                proof: proofInput.trim(),
                status: 'pending',
                timestamp: serverTimestamp()
            });
            setProofInput("");
            showToast("Submitted!");
            handleSetView('list-view');
        } catch (err) { showToast("Error submitting proof"); }
    };

    const claimDailyBonus = async () => {
        if (!requireAuth()) return;
        try {
            const token = await user.getIdToken();
            const response = await fetch('https://taskbajar-backend.vercel.app/api/daily-bonus', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (!response.ok) return showToast(data.error || "Something went wrong!");
            showToast(data.message);
        } catch (error) { showToast("Network Error!"); }
    };

    const sendChatMessage = async () => {
        if (!requireAuth()) return;
        if (!chatInput.trim()) return;

        try {
            const msgRef = ref(db, `artifacts/${appId}/support/${user.uid}/messages/${Date.now()}`);
            await set(msgRef, { text: chatInput.trim(), role: 'user', timestamp: serverTimestamp() });

            const listRef = ref(db, `artifacts/${appId}/support_list/${user.uid}`);
            await set(listRef, { lastMsg: chatInput.trim(), name: userData.name, timestamp: serverTimestamp() });

            setChatInput("");
        } catch (err) { showToast("Error sending message"); }
    };

    const drawWheel = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = canvas.width / 2;
        const sliceAngle = (2 * Math.PI) / prizes.length;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        prizes.forEach((prize, i) => {
            const angle = i * sliceAngle;
            ctx.beginPath();
            ctx.fillStyle = prize.color;
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, angle, angle + sliceAngle);
            ctx.fill();

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(angle + sliceAngle / 2);
            ctx.textAlign = "right";
            ctx.fillStyle = "white";
            ctx.font = "bold 16px sans-serif";
            ctx.fillText(prize.label, radius - 20, 5);
            ctx.restore();
        });
    };

    const enhancedSpinWheel = async () => {
        if (!requireAuth() || isSpinning) return;
        if (userData.points < 5) return showToast("Low points! Need at least 5 points.");

        setIsSpinning(true);

        try {
            const token = await user.getIdToken();
            const response = await fetch('https://taskbajar-backend.vercel.app/api/spin', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });

            const data = await response.json();
            if (!response.ok) {
                showToast(data.error || "Server Error!");
                setIsSpinning(false);
                return;
            }

            const sliceSize = 360 / prizes.length;
            const targetRotation = 270 - (data.prizeIndex * sliceSize) - (sliceSize / 2);
            const randomSpins = 360 * 5; 
            const totalSpin = randomSpins + targetRotation;

            if (wheelRef.current) {
                wheelRef.current.style.transform = `rotate(${totalSpin}deg)`;
            }

            setTimeout(() => {
                showToast(data.winAmount > 0 ? `Won ${data.winAmount} Points!` : "Try again.");
                setIsSpinning(false);

                if (wheelRef.current) {
                    const netRotation = totalSpin % 360;
                    wheelRef.current.style.transition = 'none';
                    wheelRef.current.style.transform = `rotate(${netRotation}deg)`;
                    setTimeout(() => { 
                        if (wheelRef.current) wheelRef.current.style.transition = 'transform 4s cubic-bezier(0.1, 0, 0, 1)'; 
                    }, 50);
                }
            }, 4000);

        } catch (error) {
            showToast("Network Error!");
            setIsSpinning(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 pb-28 font-sans overflow-x-hidden relative">
            
            {/* Toast */}
            {toast.visible && (
                <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-5 py-2.5 rounded-full text-xs font-semibold z-[3000] shadow-xl shadow-slate-900/20 transition-all animate-in fade-in slide-in-from-top-5">
                    {toast.msg}
                </div>
            )}

            {/* Auth Popup */}
            {showAuthPopup && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-[340px] text-center rounded-[2rem] p-8 shadow-2xl border border-white animate-in zoom-in-95 fade-in duration-300">
                        <div className="text-5xl mb-4">👋</div>
                        <h3 className="font-extrabold text-xl text-slate-900 mb-2">অ্যাকাউন্ট প্রয়োজন!</h3>
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed">সকল ফিচার ব্যবহার করতে এবং আয় শুরু করতে দয়া করে লগইন বা সাইন আপ করুন।</p>
                        <button className="w-full py-3.5 mb-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-bold shadow-lg shadow-indigo-500/30 hover:scale-[1.02] active:scale-95 transition-all" onClick={() => router.push('/login')}>
                            লগইন / সাইন আপ
                        </button>
                        <button className="w-full py-3.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 active:scale-95 transition-all" onClick={handleHideAuthPopup}>
                            পরে করব
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="sticky top-0 z-50 bg-gradient-to-br from-indigo-600 to-purple-600 text-white px-4 pt-4 pb-6 rounded-b-[2rem] shadow-xl shadow-indigo-500/10">
                <div className="flex justify-between items-center max-w-md mx-auto">
                    {user ? (
                        <div className="flex items-center gap-3">
                            <div 
                                className="w-11 h-11 rounded-[1rem] bg-white/20 border-2 border-white/30 backdrop-blur-md overflow-hidden flex items-center justify-center shrink-0 cursor-pointer shadow-inner" 
                                onClick={() => router.push('/profile')}
                            >
                                <img src={userData.avatar} className="w-full h-full object-cover" onError={(e) => {e.target.src="https://cdn-icons-png.flaticon.com/512/149/149071.png"}} alt="Avatar"/>
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-sm font-extrabold tracking-tight">{userData.name}</h2>
                                <span className="text-[9px] font-bold bg-white/20 px-1.5 py-0.5 rounded-md w-max mt-0.5 tracking-wider">PRO MEMBER</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center">
                            <button onClick={() => router.push('/login')} className="bg-white text-indigo-600 border-none px-5 py-2 rounded-xl font-bold text-sm cursor-pointer shadow-lg shadow-black/10 hover:scale-105 active:scale-95 transition-all">
                                Login
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-2.5">
                        <button 
                            className="relative bg-white/20 hover:bg-white/30 transition w-10 h-10 rounded-[1rem] flex justify-center items-center text-xl cursor-pointer shadow-inner" 
                            onClick={openNotifications}
                        >
                            🔔 {hasNewNotif && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-indigo-600"></span>}
                        </button>
                        <div className="flex bg-black/10 p-1 rounded-xl border border-white/10 backdrop-blur-sm">
                            <button className={`px-2 py-1 text-[10px] font-extrabold rounded-lg transition-all ${currentLang === 'bn' ? 'bg-white text-indigo-600 shadow-md' : 'text-white/70 hover:text-white'}`} onClick={() => changeLang('bn')}>BN</button>
                            <button className={`px-2 py-1 text-[10px] font-extrabold rounded-lg transition-all ${currentLang === 'en' ? 'bg-white text-indigo-600 shadow-md' : 'text-white/70 hover:text-white'}`} onClick={() => changeLang('en')}>EN</button>
                        </div>
                        <div className="bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20 text-right shrink-0 shadow-inner">
                            <span className="text-[9px] uppercase font-bold text-white/80 block leading-none">{t.points}</span>
                            <b className="block text-base font-extrabold leading-tight">{userData.points}</b>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Container */}
            <div className="max-w-md mx-auto px-4 -mt-3 relative z-10">

                {/* List View */}
                {view === 'list-view' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {systemNotice && (
                            <div className="bg-orange-50 border border-orange-200 p-3 rounded-2xl shadow-sm text-orange-700 text-xs font-bold overflow-hidden">
                                <marquee>{systemNotice}</marquee>
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-3 mt-5">
                            <div className="bg-white/90 backdrop-blur-xl border border-white rounded-[1.2rem] p-4 text-center cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1 transition-all" onClick={() => handleSetView('spin-view')}>
                                <div className="text-3xl mb-1.5 drop-shadow-sm">🎡</div>
                                <p className="text-[11px] font-extrabold text-indigo-500">{t.spin}</p>
                            </div>
                            <div className="bg-white/90 backdrop-blur-xl border border-white rounded-[1.2rem] p-4 text-center cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1 transition-all" onClick={claimDailyBonus}>
                                <div className="text-3xl mb-1.5 drop-shadow-sm">🎁</div>
                                <p className="text-[11px] font-extrabold text-emerald-500">{t.gift}</p>
                            </div>
                            <div className="bg-amber-50 border border-amber-200 border-dashed rounded-[1.2rem] p-4 text-center cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-1 transition-all" onClick={() => router.push('/specialoffers')}>
                                <div className="text-3xl mb-1.5 drop-shadow-sm">🎊</div>
                                <p className="text-[11px] font-extrabold text-amber-600">{t.offers}</p>
                            </div>
                        </div>

                        <h3 className="text-lg font-extrabold text-slate-800 mt-6 mb-3 px-1">{t.missions}</h3>
                        <div className="flex flex-col gap-3">
                            {tasks.map(task => (
                                <div 
                                    key={task.id} 
                                    className={`bg-white rounded-[1.25rem] p-4 flex justify-between items-center shadow-sm border border-slate-100 transition-all ${task.isPending ? 'opacity-60 grayscale-[30%] cursor-not-allowed' : 'cursor-pointer hover:shadow-md hover:border-indigo-100'}`} 
                                    onClick={() => !task.isPending && openTaskDetails(task)}
                                >
                                    <div>
                                        <h4 className="text-[15px] font-extrabold text-slate-800 mb-1 leading-tight">{task.title}</h4>
                                        <p className="text-emerald-500 font-bold text-xs inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md">+{task.reward} {t.points}</p>
                                    </div>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${task.isPending ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-500 shadow-inner'}`}>
                                        {task.isPending ? '🔒' : '→'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notification View */}
                {view === 'notification-view' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h3 className="text-lg font-extrabold text-slate-800">{t.notifTitle}</h3>
                        </div>
                        <div className="flex flex-col gap-3">
                            {notifications.length > 0 ? notifications.map(n => (
                                <div key={n.id} className={`bg-white p-4 rounded-2xl shadow-sm border-l-[6px] ${n.scope === 'private' ? 'border-amber-400 bg-amber-50/30' : 'border-indigo-500'}`}>
                                    <div className="flex justify-between items-start gap-2">
                                        <h4 className="text-sm font-extrabold text-slate-800 leading-tight">{n.title}</h4>
                                        <span className={`text-[9px] px-2 py-0.5 rounded-md font-extrabold border shrink-0 ${n.scope === 'private' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>
                                            {n.scope === 'private' ? 'PRIVATE' : 'PUBLIC'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{n.message}</p>
                                    <small className="text-[10px] text-slate-400 block mt-3 font-semibold">{new Date(n.timestamp).toLocaleString()}</small>
                                </div>
                            )) : (
                                <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-slate-200">
                                    <span className="text-4xl mb-2 block">📭</span>
                                    <p className="text-sm font-semibold text-slate-400">{t.noNotif}</p>
                                </div>
                            )}
                        </div>
                        <button className="w-full mt-5 py-3.5 rounded-xl bg-slate-200 text-slate-600 font-bold hover:bg-slate-300 transition-colors" onClick={() => handleSetView('list-view')}>
                            {t.backBtn}
                        </button>
                    </div>
                )}

                {/* Support View */}
                {view === 'support-view' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4">
                        <h3 className="text-lg font-extrabold text-slate-800 px-1 mb-3">Support Chat</h3>
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                            <div className="h-[320px] overflow-y-auto flex flex-col gap-3 p-2 custom-scrollbar" ref={chatBoxRef}>
                                {chatMessages.map((m, i) => (
                                    <div key={i} className={`px-4 py-2.5 rounded-[1.25rem] text-sm max-w-[80%] font-medium shadow-sm ${m.role === 'admin' ? 'bg-slate-100 text-slate-700 self-start rounded-bl-sm' : 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white self-end rounded-br-sm'}`}>
                                        {m.text}
                                    </div>
                                ))}
                                {chatMessages.length === 0 && <p className="text-center text-slate-400 text-xs mt-10">Send a message to start conversation</p>}
                            </div>
                            <div className="flex gap-2 mt-4 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                                <input 
                                    type="text" 
                                    value={chatInput} 
                                    onChange={(e) => setChatInput(e.target.value)} 
                                    placeholder="Type your message..." 
                                    className="flex-1 bg-transparent px-3 py-2 outline-none text-sm text-slate-700 placeholder-slate-400" 
                                />
                                <button 
                                    className="bg-indigo-500 hover:bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm"
                                    onClick={sendChatMessage}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Detail View */}
                {view === 'detail-view' && selectedTask && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6">
                        <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100">
                            <div>
                                <h3 className="font-extrabold text-lg text-slate-800 mb-3">{selectedTask.title}</h3>
                                <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-600 font-extrabold px-3 py-1.5 rounded-lg text-xs shadow-sm">
                                    <span>💰</span> {t.missionReward} {selectedTask.reward}
                                </div>
                                <p className="text-sm text-slate-500 my-5 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    সঠিকভাবে নির্দেশনা অনুসরণ করে মিশনটি সম্পন্ন করুন এবং প্রমাণ সাবমিট করুন।
                                </p>
                                <a href={selectedTask.link} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-slate-800 text-white text-sm font-bold shadow-lg shadow-slate-800/20 hover:bg-slate-700 transition-colors">
                                    {t.performTask}
                                </a>
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-100">
                                <div className="mb-4">
                                    <label className="block text-[11px] font-extrabold text-slate-500 mb-2 ml-1 uppercase tracking-wide">{t.proofLabel}</label>
                                    <textarea 
                                        value={proofInput} 
                                        onChange={(e) => setProofInput(e.target.value)} 
                                        rows={2} 
                                        placeholder="প্রমাণ হিসেবে আপনার ইউজারনেম বা আইডি দিন..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
                                    ></textarea>
                                </div>
                                <div className="flex gap-3">
                                    <button className="flex-1 py-3.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors" onClick={() => handleSetView('list-view')}>
                                        {t.cancelBtn}
                                    </button>
                                    <button className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-[1.02] transition-all" onClick={submitProof}>
                                        {t.submitBtn}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Spin View */}
                {view === 'spin-view' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mt-4">
                        <h3 className="text-lg font-extrabold text-slate-800 px-1 mb-3 text-center">{t.spin}</h3>
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 text-center relative overflow-hidden">
                            {/* Background decorations */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -z-10"></div>
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-50 rounded-full blur-3xl -z-10"></div>

                            <div className="relative w-[260px] h-[260px] mx-auto mb-8 flex justify-center items-center">
                                {/* Wheel Container */}
                                <div 
                                    ref={wheelRef} 
                                    className="w-full h-full rounded-full border-[8px] border-slate-50 shadow-2xl shadow-indigo-900/10 overflow-hidden"
                                    style={{ transition: 'transform 4s cubic-bezier(0.1, 0, 0, 1)' }}
                                >
                                    <canvas ref={canvasRef} width="260" height="260"></canvas>
                                </div>
                                {/* Pointer Indicator */}
                                <div className="absolute -top-[15px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-indigo-600 z-10 drop-shadow-md"></div>
                                {/* Center Dot */}
                                <div className="absolute w-[45px] h-[45px] bg-white rounded-full shadow-lg z-[5] flex items-center justify-center font-black text-indigo-600 text-xs border-[4px] border-indigo-500">
                                    WIN
                                </div>
                            </div>

                            <button 
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-lg shadow-lg shadow-indigo-500/30 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all mb-3" 
                                onClick={enhancedSpinWheel} 
                                disabled={isSpinning}
                            >
                                {isSpinning ? 'Spinning...' : 'Spin for 5 Points'}
                            </button>
                            <button className="w-full py-3.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors" onClick={() => handleSetView('list-view')}>
                                {t.backBtn}
                            </button>
                        </div>
                    </div>
                )}

            </div>

            {/* Footer Navigation Bar */}
            <div className="fixed bottom-4 left-4 right-4 z-[1000] flex flex-col gap-3 max-w-md mx-auto">
                {/* Expanded Menu */}
                <div className={`bg-white/95 backdrop-blur-xl border border-white rounded-[1.5rem] p-3 flex gap-3 shadow-xl shadow-slate-900/10 transition-all duration-300 origin-bottom ${navOpen ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-8 scale-95 pointer-events-none'}`}>
                    <div onClick={() => router.push('/leaderboard')} className="flex-1 flex flex-col items-center justify-center bg-pink-50 hover:bg-pink-100 rounded-xl py-3 cursor-pointer transition-colors">
                        <span className="text-2xl mb-1">🏆</span>
                        <span className="text-[10px] font-extrabold text-pink-700">Leaderboard</span>
                    </div>
                    <div onClick={() => { handleSetView('support-view'); setNavOpen(false); }} className="flex-1 flex flex-col items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-xl py-3 cursor-pointer transition-colors">
                        <span className="text-2xl mb-1">🛠️</span>
                        <span className="text-[10px] font-extrabold text-slate-700">Support</span>
                    </div>
                </div>

                {/* Main Nav Bar */}
                <div className="h-[70px] bg-white/95 backdrop-blur-xl rounded-[1.5rem] flex items-center justify-around shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-white/50 px-2">
                    <div className={`flex flex-col items-center justify-center w-[20%] cursor-pointer transition-all duration-300 ${view === 'list-view' ? 'text-indigo-600 -translate-y-1' : 'text-slate-400 hover:text-indigo-400'}`} onClick={() => handleSetView('list-view')}>
                        <span className="text-xl mb-0.5">🏠</span>
                        <span className="text-[9px] font-extrabold">{t.navMissions}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center w-[20%] text-slate-400 cursor-pointer hover:text-indigo-400 transition-all duration-300 hover:-translate-y-1" onClick={() => router.push('/order')}>
                        <span className="text-xl mb-0.5">🚀</span>
                        <span className="text-[9px] font-extrabold">{t.navPromote}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center w-[20%] text-slate-400 cursor-pointer hover:text-indigo-400 transition-all duration-300 hover:-translate-y-1" onClick={() => router.push('/profile')}>
                        <span className="text-xl mb-0.5">👤</span>
                        <span className="text-[9px] font-extrabold">{t.navProfile}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center w-[20%] text-slate-400 cursor-pointer" onClick={toggleMenu}>
                        <div className={`bg-indigo-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-md shadow-indigo-500/30 transition-transform duration-300 ${navOpen ? 'rotate-45 bg-rose-500 shadow-rose-500/30' : 'rotate-0'}`}>
                            +
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}

