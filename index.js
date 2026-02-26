const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Vercel Environment Variable থেকে সিক্রেট কি নিবে
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// ফায়ারবেস অ্যাডমিন সেটআপ
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://exchange-project-d4028-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();

// ইউজার ভেরিফাই করার মিডলওয়্যার (টোকেন চেকার)
const verifyUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split('Bearer ')[1];
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        req.uid = decodedToken.uid;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid Token' });
    }
};

// স্পিন হুইলের জন্য সুরক্ষিত API
app.post('/api/spin', verifyUser, async (req, res) => {
    const uid = req.uid;
    const userRef = db.ref(`artifacts/exchange-project-d4028/users/${uid}/stats`);
    const historyRef = db.ref(`artifacts/exchange-project-d4028/users/${uid}/transactions`);

    try {
        const snapshot = await userRef.once('value');
        const userData = snapshot.val() || {};
        const currentPoints = userData.points || 0;
        
        // স্পিন করার জন্য পয়েন্ট চেক
        if (currentPoints < 5) {
             return res.status(400).json({ error: 'Not enough points' });
        }

        // ব্যাকএন্ডে স্পিনের রেজাল্ট তৈরি করা (ফ্রন্টএন্ডে নয়)
        const prizes = [0, 2, 5, 10, 20, 0, 50, 5];
        const prizeIndex = Math.floor(Math.random() * prizes.length);
        const winAmount = prizes[prizeIndex];

        // পয়েন্ট আপডেট
        const newPoints = (currentPoints - 5) + winAmount;
        await userRef.update({ points: newPoints });

        // হিস্ট্রি সেভ করা
        await historyRef.push({
            type: 'spin',
            amount: winAmount - 5,
            desc: `Spun the wheel (Won ${winAmount})`,
            timestamp: admin.database.ServerValue.TIMESTAMP
        });

        // ফ্রন্টএন্ডকে রেজাল্ট জানিয়ে দেওয়া
        res.json({ success: true, prizeIndex: prizeIndex, winAmount: winAmount, newPoints });
    } catch (error) {
        res.status(500).json({ error: 'Database error' });
    }
});

// সার্ভার স্ট্যাটাস চেক রুট
app.get('/', (req, res) => {
    res.send('TaskBazar Backend is Running Securely! 🚀');
});

module.exports = app;
