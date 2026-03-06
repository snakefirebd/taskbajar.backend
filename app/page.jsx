import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getDatabase, ref, onValue, set, serverTimestamp } from 'firebase/database';

// 1. Firebase Configuration (From your original code)
const firebaseConfig = {
    apiKey: "AIzaSyDgFaTrHW7Grp_Q22p6KNcHZxaEujHsLsE",
    authDomain: "exchange-project-d4028.firebaseapp.com",
    databaseURL: "https://exchange-project-d4028-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "exchange-project-d4028",
    storageBucket: "exchange-project-d4028.firebasestorage.app",
    messagingSenderId: "313976742479",
    appId: "1:313976742479:web:45951b360d875c4768c03a"
};

// Initialize Firebase outside component to prevent re-initialization
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const targetAppId = "exchange-project-d4028";

// 2. Translations
const translations = {
    bn: {
        points: "পয়েন্ট", spin: "লাকি স্পিন", gift: "ডেইলি বোনাস", offers: "স্পেশাল অফার", missions: "উপলব্ধ মিশন",
        navMissions: "মিশন", navPromote: "প্রমোট", navChat: "অভিযোগ", navProfile: "প্রোফাইল",
        statusPending: "পেন্ডিং", statusSolved: "সমাধান হয়েছে",
        performTask: "কাজটি সম্পন্ন করুন 🔗", missionReward: "মিশন রিওয়ার্ড:", proofLabel: "প্রমাণ (ইউজারনেম/লিঙ্ক)", submitBtn: "সাবমিট করুন", cancelBtn: "বাতিল", backBtn: "পিছনে যান",
        notifTitle: "সিস্টেম নোটিফিকেশন", noNotif: "নতুন কোন নোটিফিকেশন নেই", support: "সাপোর্ট চ্যাট"
    },
    en: {
        points: "Points", spin: "Lucky Spin", gift: "Daily Gift", offers: "Special Offer", missions: "Available Missions",
        navMissions: "Missions", navPromote: "Promote", navChat: "Complaint", navProfile: "Profile",
        statusPending: "Pending", statusSolved: "Solved",
        performTask: "Perform Task 🔗", missionReward: "Mission Reward:", proofLabel: "Proof (Username/Link)", submitBtn: "Submit", cancelBtn: "Cancel", backBtn: "Back",
        notifTitle: "System Notifications", noNotif: "No notifications found", support: "Support Chat"
    }
};

const prizes = [
    { label: "0", color: "#f43f5e" }, { label: "2", color: "#6366f1" }, { label: "5", color: "#10b981" }, { label: "10", color: "#f59e0b" },
    { label: "20", color: "#a855f7" }, { label: "0", color: "#64748b" }, { label: "50", color: "#ec4899" }, { label: "5", color: "#06b6d4" }
];

export default function App() {
    // State Management
    const [user, setUser] = useState(null);
    const [isGuestMode, setIsGuestMode] = useState(false);
    const [showAuthPopup, setShowAuthPopup] = useState(false);
    const [currentView, setCurrentView] = useState('list-view');
    const [lang, setLang] = useState('bn');
    const [toastMsg, setToastMsg] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    // Data States
    const [userData, setUserData] = useState({ points: 0, name: "Elite Member", avatar: "" });
    const [notice, setNotice] = useState("");
    const [tasks, setTasks] = useState({});
    const [submissions, setSubmissions] = useState({});
    const [notifications, setNotifications] = useState([]);
    const [hasNewNotif, setHasNewNotif] = useState(false);
    const [chatMessages, setChatMessages] = useState({});
    
    // Action States
    const [selectedTask, setSelectedTask] = useState(null);
    const [proofText, setProofText] = useState("");
    const [chatInput, setChatInput] = useState("");
    const [isSpinning, setIsSpinning] = useState(false);
    
    // Refs
    const wheelRef = useRef(null);
    const chatBoxRef = useRef(null);
    const authPopupTimer = useRef(null);

    const t = translations[lang];

    // Helper: Show Toast
    const showToast = (msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(''), 3000);
    };

    // Firebase Init & Auth Listener
    useEffect(() => {
        const initAuth = async () => {
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (error) {
                console.error("Auth error:", error);
            }
        };
        initAuth();

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser && !currentUser.isAnonymous) {
                // Real logged-in user
                setUser(currentUser);
                setIsGuestMode(false);
                setShowAuthPopup(false);
                if (authPopupTimer.current) clearTimeout(authPopupTimer.current);
            } else {
                // Guest / Anonymous (Simulating logged out state for your app UI)
                setUser(currentUser); // Keep anonymous user for DB rules if needed
                setIsGuestMode(true);
                setShowAuthPopup(true);
            }
        });

        // Load language preference
        const savedLang = localStorage.getItem('elite_lang');
        if (savedLang) setLang(savedLang);

        const savedView = localStorage.getItem('last_view');
        if (savedView) setCurrentView(savedView);

        return () => unsubscribe();
    }, []);

    // Guest Mode Timer
    const handleHideAuthPopup = () => {
        setShowAuthPopup(false);
        if (authPopupTimer.current) clearTimeout(authPopupTimer.current);
        authPopupTimer.current = setTimeout(() => setShowAuthPopup(true), 60000); // 1 min
    };

    const requireAuth = () => {
        if (isGuestMode) {
            setShowAuthPopup(true);
            return false;
        }
        return true;
    };

    // Data Fetching (Realtime Database)
    useEffect(() => {
        // Public Data (Loads for everyone)
        const noticeRef = ref(db, `artifacts/${targetAppId}/public/settings/notice`);
        const tasksRef = ref(db, `artifacts/${targetAppId}/public/data/microtasks`);
        const subsRef = ref(db, `artifacts/${targetAppId}/public/data/submissions`);

        onValue(noticeRef, (s) => setNotice(s.val() || ""));
        onValue(tasksRef, (s) => setTasks(s.val() || {}));
        onValue(subsRef, (s) => setSubmissions(s.val() || {}));

        // Private Data (Only if logged in / has valid uid)
        if (user) {
            const statsRef = ref(db, `artifacts/${targetAppId}/users/${user.uid}/stats`);
            onValue(statsRef, (s) => {
                const d = s.val() || {};
                setUserData({
                    points: d.points || 0,
                    name: d.name || "User",
                    avatar: d.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                });
            });

            // Notifications logic
            const pubNotifRef = ref(db, `artifacts/${targetAppId}/public/notifications`);
            const pvtNotifRef = ref(db, `artifacts/${targetAppId}/users/${user.uid}/notifications`);
            
            const handleNotifs = () => {
                let combined = [];
                onValue(pubNotifRef, (pubSnap) => {
                    const pubs = pubSnap.val() || {};
                    Object.keys(pubs).forEach(id => combined.push({...pubs[id], id, scope: 'public'}));
                    
                    onValue(pvtNotifRef, (pvtSnap) => {
                        const pvts = pvtSnap.val() || {};
                        Object.keys(pvts).forEach(id => combined.push({...pvts[id], id, scope: 'private'}));
                        
                        combined.sort((a,b) => b.timestamp - a.timestamp);
                        setNotifications(combined);
                        
                        const lastChecked = localStorage.getItem('last_notif_check') || 0;
                        setHasNewNotif(combined.some(n => n.timestamp > lastChecked));
                    }, { onlyOnce: true });
                }, { onlyOnce: true });
            };
            
            onValue(pubNotifRef, handleNotifs);
            onValue(pvtNotifRef, handleNotifs);

            // Support Chat
            const chatRef = ref(db, `artifacts/${targetAppId}/support/${user.uid}/messages`);
            onValue(chatRef, (s) => {
                setChatMessages(s.val() || {});
                if (chatBoxRef.current) chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
            });
        }
    }, [user]);

    // View Switching
    const changeView = (view) => {
        if (view === 'spin-view' && !requireAuth()) return;
        if (view === 'notification-view' && !requireAuth()) return;
        if (view === 'support-view' && !requireAuth()) return;

        setCurrentView(view);
        localStorage.setItem('last_view', view);
        
        if (view === 'spin-view') {
            setTimeout(drawWheel, 100);
        }
    };

    const openNotifications = () => {
        if(!requireAuth()) return;
        localStorage.setItem('last_notif_check', Date.now());
        setHasNewNotif(false);
        changeView('notification-view');
    };

    // APIs & Actions
    const claimDailyBonus = async () => {
        if(!requireAuth()) return;
        try {
            const token = await user.getIdToken();
            const response = await fetch('https://taskbajar-backend.vercel.app/api/daily-bonus', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (!response.ok) return showToast(data.error || "Something went wrong!");
            showToast(data.message);
        } catch (error) {
            showToast("Network Error!");
        }
    };

    const enhancedSpinWheel = async () => {
        if(!requireAuth() || isSpinning) return;
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
            const totalSpin = (360 * 5) + targetRotation;

            if(wheelRef.current) {
                wheelRef.current.style.transition = 'transform 4s cubic-bezier(0.1, 0, 0, 1)';
                wheelRef.current.style.transform = `rotate(${totalSpin}deg)`;
            }

            setTimeout(() => {
                showToast(data.winAmount > 0 ? `Won ${data.winAmount} Points!` : "Try again.");
                setIsSpinning(false);
                if(wheelRef.current) {
                    const netRotation = totalSpin % 360;
                    wheelRef.current.style.transition = 'none';
                    wheelRef.current.style.transform = `rotate(${netRotation}deg)`;
                }
            }, 4000);

        } catch (error) {
            showToast("Network Error!");
            setIsSpinning(false);
        }
    };

    const submitProof = async () => {
        if(!requireAuth()) return;
        if(!proofText.trim()) return showToast("Proof required!");
        
        const subRef = ref(db, `artifacts/${targetAppId}/public/data/submissions/${selectedTask.id}/${Date.now()}`);
        await set(subRef, {
            userId: user.uid, proof: proofText, status: 'pending', timestamp: serverTimestamp()
        });
        
        setProofText("");
        showToast("Submitted!");
        changeView('list-view');
    };

    const sendChatMessage = async () => {
        if(!requireAuth() || !chatInput.trim()) return;
        
        const msgRef = ref(db, `artifacts/${targetAppId}/support/${user.uid}/messages/${Date.now()}`);
        await set(msgRef, { text: chatInput, role: 'user', timestamp: serverTimestamp() });
        
        const listRef = ref(db, `artifacts/${targetAppId}/support_list/${user.uid}`);
        await set(listRef, { lastMsg: chatInput, name: userData.name, timestamp: serverTimestamp() });
        
        setChatInput("");
    };

    // Canvas Logic
    const drawWheel = () => {
        const canvas = document.getElementById('wheel-canvas'); 
        if (!canvas) return;
        const ctx = canvas.getContext('2d'); 
        const centerX = canvas.width / 2; 
        const centerY = canvas.height / 2;
        const radius = canvas.width / 2; 
        const sliceAngle = (2 * Math.PI) / prizes.length;
        
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

    return (
        <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-['Plus_Jakarta_Sans',sans-serif] pb-[90px] overflow-x-hidden">
            
            {/* Toast Notification */}
            {toastMsg && (
                <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-[#1e293b] text-white px-5 py-2.5 rounded-full text-xs font-semibold z-[3000] shadow-[0_8px_15px_rgba(0,0,0,0.15)] animate-bounce">
                    {toastMsg}
                </div>
            )}

            {/* Auth Popup Overlay */}
            {showAuthPopup && (
                <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-[9999] flex items-center justify-center">
                    <div className="bg-white w-[90%] max-w-[360px] text-center p-8 rounded-[22px] shadow-2xl animate-[viewIn_0.3s_ease-out]">
                        <div className="text-5xl mb-3">👋</div>
                        <h3 className="font-extrabold text-xl text-[#0f172a] mb-2">অ্যাকাউন্ট প্রয়োজন!</h3>
                        <p className="text-sm text-[#64748b] mb-6">সকল ফিচার ব্যবহার করতে এবং আয় শুরু করতে দয়া করে লগইন বা সাইন আপ করুন।</p>
                        <button 
                            className="w-full p-3.5 rounded-2xl bg-gradient-to-br from-[#6366f1] to-[#a855f7] text-white font-bold shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-[0.98] transition-transform"
                            onClick={() => window.location.href='#'} // Normally 'login.html'
                        >
                            লগইন / সাইন আপ
                        </button>
                        <button 
                            className="w-full p-3.5 rounded-2xl bg-[#f1f5f9] text-[#64748b] font-bold mt-3 hover:bg-[#e2e8f0] transition-colors"
                            onClick={handleHideAuthPopup}
                        >
                            পরে করব
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-gradient-to-br from-[#6366f1] to-[#a855f7] text-white pt-3 pb-6 px-4 rounded-b-[25px] sticky top-0 z-[100] shadow-[0_5px_15px_rgba(99,102,241,0.15)]">
                <div className="flex justify-between items-center max-w-[500px] mx-auto gap-2">
                    
                    {/* Profile Area */}
                    {!isGuestMode ? (
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => requireAuth()}>
                            <div className="w-9 h-9 rounded-xl bg-white/20 border-2 border-white/40 backdrop-blur-md overflow-hidden flex justify-center items-center shrink-0">
                                <img src={userData.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h2 className="text-xs font-extrabold">{userData.name}</h2>
                                <span className="text-[10px] font-extrabold bg-white/20 px-1.5 py-0.5 rounded-md">PRO</span>
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setShowAuthPopup(true)}
                            className="bg-white text-[#6366f1] border-none py-2 px-4 rounded-xl font-extrabold text-xs shadow-md transition-transform hover:scale-105"
                        >
                            Login
                        </button>
                    )}

                    {/* Right Header Actions */}
                    <div className="flex items-center gap-2">
                        <div className="relative bg-white/20 w-9 h-9 rounded-xl flex justify-center items-center text-lg cursor-pointer" onClick={openNotifications}>
                            🔔
                            {hasNewNotif && <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#f43f5e] rounded-full border-2 border-white"></div>}
                        </div>
                        <div className="flex bg-black/10 p-1 rounded-xl border border-white/15">
                            <button className={`px-2 py-1 text-[10px] font-extrabold rounded-lg transition-all ${lang === 'bn' ? 'bg-white text-[#6366f1] shadow-sm' : 'text-white/60'}`} onClick={() => {setLang('bn'); localStorage.setItem('elite_lang', 'bn');}}>BN</button>
                            <button className={`px-2 py-1 text-[10px] font-extrabold rounded-lg transition-all ${lang === 'en' ? 'bg-white text-[#6366f1] shadow-sm' : 'text-white/60'}`} onClick={() => {setLang('en'); localStorage.setItem('elite_lang', 'en');}}>EN</button>
                        </div>
                        <div className="bg-white/15 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/25 text-right shrink-0">
                            <span className="text-[10px] uppercase font-extrabold opacity-80 block leading-none">{t.points}</span>
                            <b className="block text-base font-extrabold leading-tight">{userData.points}</b>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Container */}
            <div className="px-4 -mt-2 max-w-[480px] mx-auto">
                
                {/* 1. LIST VIEW (HOME) */}
                {currentView === 'list-view' && (
                    <div className="animate-[viewIn_0.4s_ease-out]">
                        {/* Notice Board */}
                        {notice && (
                            <div className="bg-[#fff7ed] border border-[#ffedd5] p-2.5 rounded-2xl mt-5 text-[#9a3412] text-xs font-bold">
                                <marquee>{notice}</marquee>
                            </div>
                        )}
                        
                        {/* Top Action Grid */}
                        <div className="grid grid-cols-3 gap-2.5 mt-4">
                            <div onClick={() => changeView('spin-view')} className="bg-white/85 backdrop-blur-[20px] rounded-[22px] p-3 text-center cursor-pointer border border-white/70 shadow-sm hover:scale-[0.98] transition-transform">
                                <div className="text-2xl mb-1">🎡</div>
                                <p className="text-[10px] font-extrabold text-[#6366f1]">{t.spin}</p>
                            </div>
                            <div onClick={claimDailyBonus} className="bg-white/85 backdrop-blur-[20px] rounded-[22px] p-3 text-center cursor-pointer border border-white/70 shadow-sm hover:scale-[0.98] transition-transform">
                                <div className="text-2xl mb-1">🎁</div>
                                <p className="text-[10px] font-extrabold text-[#10b981]">{t.gift}</p>
                            </div>
                            <div className="bg-[#fffbeb] backdrop-blur-[20px] rounded-[22px] p-3 text-center cursor-pointer border-2 border-dashed border-[#f59e0b] shadow-sm hover:scale-[0.98] transition-transform">
                                <div className="text-2xl mb-1">🎊</div>
                                <p className="text-[10px] font-extrabold text-[#d97706]">{t.offers}</p>
                            </div>
                        </div>

                        <h3 className="text-base font-extrabold mt-4 mb-2.5 ml-1 text-[#1e293b]">{t.missions}</h3>
                        
                        {/* Task List */}
                        <div className="flex flex-col gap-3">
                            {Object.keys(tasks).reverse().map(id => {
                                const item = tasks[id];
                                if (user && item.creatorId === user.uid) return null;
                                
                                let mySubStatus = null;
                                if(user && submissions[id]) {
                                    Object.keys(submissions[id]).forEach(sId => {
                                        if(submissions[id][sId].userId === user.uid) mySubStatus = submissions[id][sId].status;
                                    });
                                }
                                if (mySubStatus === 'approved' || mySubStatus === 'rejected') return null;
                                
                                const isPending = mySubStatus === 'pending';

                                return (
                                    <div key={id} onClick={() => !isPending && (setSelectedTask({...item, id}), changeView('detail-view'))} 
                                         className={`bg-white/85 backdrop-blur-[20px] rounded-[22px] p-4 flex justify-between items-center border border-white/70 shadow-sm transition-transform ${!isPending ? 'cursor-pointer hover:scale-[0.98]' : 'opacity-70'}`}>
                                        <div>
                                            <h4 className="text-sm font-extrabold text-[#1e293b]">{item.title}</h4>
                                            <p className="text-[#10b981] font-extrabold text-xs mt-0.5">+{item.reward} {t.points}</p>
                                        </div>
                                        <div className="bg-[#f1f5f9] w-8 h-8 rounded-xl flex items-center justify-center text-[#64748b]">
                                            {isPending ? '🔒' : '→'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 2. NOTIFICATION VIEW */}
                {currentView === 'notification-view' && (
                    <div className="animate-[viewIn_0.4s_ease-out]">
                        <h3 className="text-base font-extrabold mt-4 mb-2.5 ml-1 text-[#1e293b]">{t.notifTitle}</h3>
                        <div className="mt-3 flex flex-col gap-3">
                            {notifications.length === 0 ? (
                                <p className="text-center p-5 text-sm text-[#64748b]">{t.noNotif}</p>
                            ) : (
                                notifications.map(n => {
                                    const isPvt = n.scope === 'private';
                                    return (
                                        <div key={n.id} className={`bg-white p-4 rounded-2xl shadow-sm ${isPvt ? 'border-l-4 border-[#f59e0b] bg-[#fffbeb]' : 'border-l-4 border-[#6366f1]'}`}>
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-sm font-extrabold text-[#1e293b]">{n.title}</h4>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold border border-black/5 ${isPvt ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#eef2ff] text-[#4338ca]'}`}>
                                                    {isPvt ? 'PRIVATE' : 'PUBLIC'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-[#64748b] mt-1.5">{n.message}</p>
                                            <small className="text-[10px] text-[#94a3b8] block mt-2 font-bold">{new Date(n.timestamp).toLocaleString()}</small>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                        <button onClick={() => changeView('list-view')} className="w-full mt-4 p-3.5 rounded-2xl bg-[#f1f5f9] text-[#64748b] font-bold">{t.backBtn}</button>
                    </div>
                )}

                {/* 3. SUPPORT VIEW */}
                {currentView === 'support-view' && (
                    <div className="animate-[viewIn_0.4s_ease-out]">
                        <h3 className="text-base font-extrabold mt-4 mb-2.5 ml-1 text-[#1e293b]">{t.support}</h3>
                        <div className="bg-white/85 backdrop-blur-[20px] rounded-[22px] p-4 border border-white/70 shadow-sm">
                            <div ref={chatBoxRef} className="h-[280px] overflow-y-auto flex flex-col gap-2 p-1 mb-4">
                                {Object.values(chatMessages).map((m, i) => (
                                    <div key={i} className={`px-3.5 py-2.5 rounded-2xl text-xs max-w-[80%] font-medium ${m.role === 'admin' ? 'bg-[#f1f5f9] text-[#0f172a] self-start rounded-bl-sm' : 'bg-gradient-to-br from-[#6366f1] to-[#a855f7] text-white self-end rounded-br-sm'}`}>
                                        {m.text}
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Message..." 
                                    className="flex-1 px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl outline-none text-sm focus:border-[#6366f1] transition-colors"
                                />
                                <button onClick={sendChatMessage} className="w-11 h-11 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#6366f1] to-[#a855f7] text-white shadow-md active:scale-95 transition-transform">
                                    ➤
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. DETAIL VIEW */}
                {currentView === 'detail-view' && selectedTask && (
                    <div className="animate-[viewIn_0.4s_ease-out] mt-6">
                        <div className="bg-white/85 backdrop-blur-[20px] rounded-[22px] p-5 border border-white/70 shadow-sm">
                            <h3 className="font-extrabold mb-2 text-base">{selectedTask.title}</h3>
                            <span className="bg-[#f0fdf4] text-[#10b981] font-extrabold px-2.5 py-1 rounded-lg text-[11px] inline-block mb-4">
                                {t.missionReward} {selectedTask.reward}
                            </span>
                            <p className="text-xs text-[#64748b] mb-4">নির্দেশনা অনুসরণ করে মিশনটি সম্পন্ন করুন।</p>
                            <a href={selectedTask.link} target="_blank" rel="noreferrer" className="block text-center bg-[#f1f5f9] text-[#6366f1] font-bold p-3.5 rounded-xl mb-4 hover:bg-[#e2e8f0] transition-colors">
                                {t.performTask}
                            </a>
                            
                            <div className="mt-5 pt-5 border-t border-[#f1f5f9]">
                                <div className="mb-3">
                                    <label className="block text-[11px] font-extrabold text-[#64748b] mb-1.5 ml-1">{t.proofLabel}</label>
                                    <textarea 
                                        rows="2" 
                                        value={proofText}
                                        onChange={(e) => setProofText(e.target.value)}
                                        placeholder="প্রমাণ হিসেবে আপনার ইউজারনেম বা আইডি দিন"
                                        className="w-full px-4 py-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl outline-none text-sm focus:border-[#6366f1] transition-colors"
                                    ></textarea>
                                </div>
                                <button onClick={submitProof} className="w-full p-3.5 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#a855f7] text-white font-bold shadow-[0_0_20px_rgba(99,102,241,0.4)] active:scale-95 transition-transform">
                                    {t.submitBtn}
                                </button>
                                <button onClick={() => changeView('list-view')} className="w-full p-3.5 rounded-xl bg-[#f1f5f9] text-[#64748b] font-bold mt-2 hover:bg-[#e2e8f0]">
                                    {t.cancelBtn}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 5. SPIN VIEW */}
                {currentView === 'spin-view' && (
                    <div className="animate-[viewIn_0.4s_ease-out]">
                        <h3 className="text-base font-extrabold mt-4 mb-2.5 ml-1 text-[#1e293b]">{t.spin}</h3>
                        <div className="bg-white/85 backdrop-blur-[20px] rounded-[22px] p-6 text-center border border-white/70 shadow-sm relative">
                            <div className="relative w-[260px] h-[260px] mx-auto mb-6 flex justify-center items-center">
                                {/* Wheel Container */}
                                <div ref={wheelRef} className="w-full h-full rounded-full border-[8px] border-[#f1f5f9] shadow-[0_10px_25px_rgba(0,0,0,0.1)] overflow-hidden transition-transform duration-[4000ms] ease-[cubic-bezier(0.1,0,0,1)]">
                                    <canvas id="wheel-canvas" width="260" height="260" className="w-full h-full"></canvas>
                                </div>
                                {/* Pointer Indicator */}
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-r-[15px] border-l-transparent border-r-transparent border-t-[25px] border-t-[#6366f1] z-10"></div>
                                {/* Center Circle */}
                                <div className="absolute w-10 h-10 bg-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.2)] z-0 flex items-center justify-center font-extrabold text-[#6366f1] border-4 border-[#6366f1] text-[10px]">
                                    WIN
                                </div>
                            </div>
                            
                            <button 
                                disabled={isSpinning}
                                onClick={enhancedSpinWheel} 
                                className={`w-full p-3.5 rounded-xl text-white font-bold shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-transform ${isSpinning ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-br from-[#6366f1] to-[#a855f7] active:scale-95'}`}
                            >
                                Spin for 5 Points
                            </button>
                            <button onClick={() => changeView('list-view')} className="w-full p-3.5 rounded-xl bg-[#f1f5f9] text-[#64748b] font-bold mt-2 hover:bg-[#e2e8f0]">
                                {t.backBtn}
                            </button>
                        </div>
                    </div>
                )}

            </div>

            {/* Bottom Navigation Bar */}
            <div className={`fixed bottom-4 left-4 right-4 z-[1000] flex flex-col gap-2 ${isMenuOpen ? 'open' : ''}`}>
                
                {/* Expanded Menu */}
                <div className={`bg-white/95 backdrop-blur-[20px] rounded-[20px] p-3 flex gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-white transition-all duration-300 ${isMenuOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-5 pointer-events-none'}`}>
                    <div onClick={() => console.log('leaderboard')} className="flex flex-col items-center text-[#94a3b8] cursor-pointer">
                        <i className="bg-[#fdf2f8] w-9 h-9 rounded-xl flex items-center justify-center mb-1 not-italic">🏆</i>
                        <span className="text-[10px]">Leaderboard</span>
                    </div>
                    <div onClick={() => changeView('support-view')} className="flex flex-col items-center text-[#94a3b8] cursor-pointer">
                        <i className="bg-[#f1f5f9] w-9 h-9 rounded-xl flex items-center justify-center mb-1 not-italic">🛠️</i>
                        <span className="text-[10px]">Support</span>
                    </div>
                </div>

                {/* Main Nav Bar */}
                <div className="h-[65px] bg-white/95 backdrop-blur-[20px] rounded-[20px] flex items-center justify-around shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-white">
                    <div onClick={() => changeView('list-view')} className={`flex flex-col items-center cursor-pointer transition-transform ${currentView === 'list-view' ? 'text-[#6366f1] -translate-y-0.5' : 'text-[#94a3b8]'}`}>
                        <i className="text-xl mb-0.5 not-italic">🏠</i>
                        <span className="text-[10px] font-bold">{t.navMissions}</span>
                    </div>
                    <div className="flex flex-col items-center cursor-pointer text-[#94a3b8] transition-transform">
                        <i className="text-xl mb-0.5 not-italic">🚀</i>
                        <span className="text-[10px] font-bold">{t.navPromote}</span>
                    </div>
                    <div className="flex flex-col items-center cursor-pointer text-[#94a3b8] transition-transform">
                        <i className="text-xl mb-0.5 not-italic">👤</i>
                        <span className="text-[10px] font-bold">{t.navProfile}</span>
                    </div>
                    <div onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex flex-col items-center cursor-pointer text-[#94a3b8] transition-transform">
                        <i className={`text-[1.3rem] mb-0.5 not-italic transition-transform duration-300 ${isMenuOpen ? 'rotate-45 text-[#6366f1]' : ''}`}>+</i>
                        <span className="text-[10px] font-bold">Menu</span>
                    </div>
                </div>
            </div>

        </div>
    );
}

