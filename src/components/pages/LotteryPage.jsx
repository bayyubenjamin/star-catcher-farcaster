// src/components/pages/LotteryPage.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged,
} from 'firebase/auth';
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    onSnapshot,
    collection,
    getDocs,
    writeBatch,
    serverTimestamp
} from 'firebase/firestore';
import { ArrowPathIcon, UserGroupIcon, TrophyIcon, TicketIcon } from '@heroicons/react/24/outline';

const firebaseConfig = {
  apiKey: "AIzaSyDnHu1tKy-VEQK0zarGx7MpJFc_tyzbgyw",
  authDomain: "star-40a0b.firebaseapp.com",
  projectId: "star-40a0b",
  storageBucket: "star-40a0b.appspot.com",
  messagingSenderId: "659329766733",
  appId: "1:659329766733:web:1dbd02342f2852329a1304",
  measurementId: "G-YHTYSTXBZ6"
};

// Pindahkan inisialisasi ke luar komponen agar hanya dijalankan sekali
const app = initializeApp(firebaseConfig);
const authInstance = getAuth(app);
const dbInstance = getFirestore(app);

const appId = 'default-crypto-lottery';

const CryptoLotteryApp = () => {
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    const [lottery, setLottery] = useState({
        totalPot: 0,
        entryFee: 0.005,
        participantsCount: 0,
        winner: null,
        lastDrawn: null,
    });
    const [participants, setParticipants] = useState([]);
    const [hasJoined, setHasJoined] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isJoining, setIsJoining] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [error, setError] = useState('');
    const [showWinnerModal, setShowWinnerModal] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                try {
                    await signInAnonymously(authInstance);
                } catch (authError) {
                    console.error("Authentication error:", authError);
                    setError("Failed to authenticate. Please refresh.");
                }
            }
            setIsAuthReady(true);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!isAuthReady || !dbInstance || !userId) return;
        
        const checkUserJoined = async () => {
            const participantDocRef = doc(dbInstance, `artifacts/${appId}/public/data/lottery/current/participants`, userId);
            const docSnap = await getDoc(participantDocRef);
            setHasJoined(docSnap.exists());
        };
        checkUserJoined();
        
        setIsLoading(true);
        const lotteryDocRef = doc(dbInstance, `artifacts/${appId}/public/data/lottery`, "current");
        const unsubscribeLottery = onSnapshot(lotteryDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const prevWinner = lottery.winner;
                setLottery(prev => ({ ...prev, ...data }));
                if (data.winner && !prevWinner) {
                    setShowWinnerModal(true);
                }
            } else {
                setDoc(lotteryDocRef, {
                    totalPot: 0,
                    entryFee: 0.005,
                    participantsCount: 0,
                    winner: null,
                    lastDrawn: null,
                });
            }
            setIsLoading(false);
        }, (err) => {
            console.error("Error fetching lottery data:", err);
            setError("Could not load lottery data.");
            setIsLoading(false);
        });

        const participantsColRef = collection(dbInstance, `artifacts/${appId}/public/data/lottery/current/participants`);
        const unsubscribeParticipants = onSnapshot(participantsColRef, (snapshot) => {
            const participantsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setParticipants(participantsList);
             // Cek ulang jika ada perubahan dari sumber lain
            if (!hasJoined) {
                setHasJoined(participantsList.some(p => p.id === userId));
            }
        }, (err) => {
            console.error("Error fetching participants:", err);
            setError("Could not load participants list.");
        });

        return () => {
            unsubscribeLottery();
            unsubscribeParticipants();
        };
    }, [isAuthReady, userId, hasJoined, lottery.winner]);

    const handleJoinLottery = async () => {
        if (!dbInstance || !userId || hasJoined) return;
        setIsJoining(true);
        setError('');

        try {
            const lotteryDocRef = doc(dbInstance, `artifacts/${appId}/public/data/lottery`, "current");
            const participantDocRef = doc(dbInstance, `artifacts/${appId}/public/data/lottery/current/participants`, userId);

            const lotteryDocSnap = await getDoc(lotteryDocRef);
            if (!lotteryDocSnap.exists()) throw new Error("Lottery not found.");

            const currentData = lotteryDocSnap.data();
            const newPot = (currentData.totalPot || 0) + lottery.entryFee;
            const newCount = (currentData.participantsCount || 0) + 1;

            const batch = writeBatch(dbInstance);
            batch.set(participantDocRef, { joinedAt: serverTimestamp() });
            batch.update(lotteryDocRef, { totalPot: newPot, participantsCount: newCount });
            await batch.commit();
            setHasJoined(true); // Langsung update state setelah berhasil bergabung
        } catch (e) {
            console.error("Error joining lottery:", e);
            setError("Failed to join. Please try again.");
        } finally {
            setIsJoining(false);
        }
    };
    
    const handleDrawWinner = async () => {
        if (participants.length === 0) {
            setError("No participants to draw from.");
            return;
        }
        setIsDrawing(true);
        setError('');
        try {
            const winnerIndex = Math.floor(Math.random() * participants.length);
            const winner = participants[winnerIndex];
            const lotteryDocRef = doc(dbInstance, `artifacts/${appId}/public/data/lottery`, "current");
            await setDoc(lotteryDocRef, { winner: winner.id, lastDrawn: serverTimestamp() }, { merge: true });
        } catch (e) {
            console.error("Error drawing winner:", e);
            setError("Failed to draw a winner. Please try again.");
        } finally {
            setIsDrawing(false);
        }
    };

    const handleResetLottery = async () => {
        if (!dbInstance) return;
        setIsDrawing(true);
        try {
            const batch = writeBatch(dbInstance);
            const participantsColRef = collection(dbInstance, `artifacts/${appId}/public/data/lottery/current/participants`);
            const participantsSnapshot = await getDocs(participantsColRef);
            participantsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

            const lotteryDocRef = doc(dbInstance, `artifacts/${appId}/public/data/lottery`, "current");
            batch.update(lotteryDocRef, {
                totalPot: 0,
                participantsCount: 0,
                winner: null,
                lastDrawn: serverTimestamp()
            });
            await batch.commit();
            setHasJoined(false);
            setShowWinnerModal(false);
        } catch (e) {
            console.error("Error resetting lottery:", e);
            setError("Failed to reset the lottery.");
        } finally {
            setIsDrawing(false);
        }
    };

    const truncatedUserId = useMemo(() => userId ? `${userId.substring(0, 6)}...${userId.substring(userId.length - 4)}` : '', [userId]);

    if (isLoading || !isAuthReady) {
        return (
            <div className="flex items-center justify-center h-full">
                <ArrowPathIcon className="h-8 w-8 animate-spin mr-3" />
                Loading Crypto Lottery...
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
            {showWinnerModal && lottery.winner && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
                    <div className="bg-gradient-to-br from-purple-600 to-blue-500 rounded-2xl shadow-2xl p-8 text-center transform transition-all scale-100 max-w-md w-full">
                        <TrophyIcon className="h-20 w-20 text-yellow-300 mx-auto drop-shadow-lg" />
                        <h2 className="text-3xl font-bold mt-4">We have a winner!</h2>
                        <p className="mt-2 text-gray-200">Congratulations to:</p>
                        <p className="mt-3 text-lg font-mono bg-gray-800 bg-opacity-50 rounded-md p-3 break-all">{lottery.winner}</p>
                        <p className="mt-4 text-2xl font-bold text-yellow-300">Prize: {lottery.totalPot.toFixed(4)} ETH</p>
                        <button onClick={handleResetLottery} disabled={isDrawing} className="mt-6 w-full bg-yellow-400 text-gray-900 font-bold py-3 px-4 rounded-lg hover:bg-yellow-300 transition duration-300 flex items-center justify-center">
                            {isDrawing ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : 'Start New Round'}
                        </button>
                    </div>
                </div>
            )}
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">Farcaster Crypto Lottery</h1>
                <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm">
                    Connected: <span className="font-mono text-purple-400">{truncatedUserId}</span>
                </div>
            </header>
            {error && <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 p-3 rounded-lg mb-6">{error}</div>}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-gray-800/50 border border-gray-700 rounded-2xl p-6 shadow-lg">
                    <h2 className="text-lg font-semibold text-gray-400">Current Prize Pool</h2>
                    <p className="text-5xl md:text-6xl font-bold my-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">{lottery.totalPot.toFixed(4)} ETH</p>
                    <div className="h-px bg-gray-700 my-6"></div>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <p className="text-gray-400">Entry Fee</p>
                            <p className="text-xl font-bold">{lottery.entryFee} ETH</p>
                        </div>
                        <button onClick={handleJoinLottery} disabled={isJoining || hasJoined || lottery.winner} className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-lg shadow-lg transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            <TicketIcon className="h-6 w-6" />
                            {isJoining ? 'Processing...' : (hasJoined ? 'You are in!' : 'Join Lottery')}
                        </button>
                    </div>
                    {lottery.winner && <p className="text-center text-yellow-400 mt-6">Lottery has ended. A winner was drawn.</p>}
                </div>
                <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                        <UserGroupIcon className="h-6 w-6 text-gray-400" />
                        <h3 className="text-xl font-bold">Participants ({lottery.participantsCount})</h3>
                    </div>
                    <div className="h-64 overflow-y-auto pr-2 space-y-2">
                        {participants.length > 0 ? participants.map(p => (
                            <div key={p.id} className="bg-gray-700/50 p-2 rounded-md font-mono text-sm text-gray-300 truncate">{p.id}</div>
                        )) : (
                            <div className="text-gray-500 text-center pt-10">No one has joined yet. Be the first!</div>
                        )}
                    </div>
                </div>
            </div>
            <div className="mt-8 p-4 bg-gray-800/30 border border-dashed border-gray-700 rounded-lg">
                <h4 className="text-center text-sm font-semibold text-gray-500 mb-4">Admin Controls (For Demo)</h4>
                <div className="flex justify-center gap-4">
                    <button onClick={handleDrawWinner} disabled={isDrawing || participants.length === 0 || lottery.winner} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:opacity-50">
                        {isDrawing ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : 'Draw Winner'}
                    </button>
                    <button onClick={handleResetLottery} disabled={isDrawing} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 disabled:opacity-50">
                        {isDrawing ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : 'Reset Lottery'}
                    </button>
                </div>
                <p className="text-center text-xs text-gray-600 mt-3">Your User ID: {userId}</p>
            </div>
        </div>
    );
};

export default CryptoLotteryApp;
