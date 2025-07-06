// File: src/App.jsx

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

// --- Dependensi untuk Lotre ---
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInAnonymously, 
    onAuthStateChanged,
    signInWithCustomToken
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    onSnapshot, 
    collection, 
    addDoc, 
    getDocs,
    writeBatch,
    serverTimestamp
} from 'firebase/firestore';
import { ArrowPathIcon, UserGroupIcon, TrophyIcon, TicketIcon, StarIcon, CubeTransparentIcon } from '@heroicons/react/24/outline';

// =================================================================================
// --- KOMPONEN GAME: STAR CATCHER ---
// =================================================================================
const HeartIcon = () => (
    <svg className="w-7 h-7 inline-block fill-rose-400 drop-shadow-[0_0_5px_#fb7185]" viewBox="0 0 24 24">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
    </svg>
);

const StarCatcherGame = () => {
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('starCatcherHighScore')) || 0);
    const [lives, setLives] = useState(3);
    const [isGameOver, setIsGameOver] = useState(true);
    const [modalInfo, setModalInfo] = useState({
        title: 'Welcome!',
        text: "Catch as many stars as you can. Don't let any fall!",
        button: 'Start Game'
    });

    const canvasRef = useRef(null);
    const gameContainerRef = useRef(null);
    const playerRef = useRef(null);
    const starsRef = useRef([]);
    const gameLoopIdRef = useRef(null);
    const starSpawnTimerRef = useRef(0);
    const starSpawnIntervalRef = useRef(90);
    const starSpeedRef = useRef(1);

    const drawPlayer = useCallback((ctx) => {
        if (!playerRef.current) return;
        const player = playerRef.current;
        ctx.fillStyle = 'rgb(165, 180, 252)';
        ctx.strokeStyle = 'rgb(199, 210, 254)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(player.x, player.y, player.width, player.height, [10]);
        ctx.fill();
        ctx.stroke();
    }, []);

    const drawStar = useCallback((ctx, star) => {
        ctx.fillStyle = star.color;
        ctx.shadowColor = star.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y - star.size / 2);
        for (let i = 0; i < 5; i++) {
            ctx.lineTo(
                star.x + Math.cos((18 + i * 72) / 180 * Math.PI) * (star.size / 2),
                star.y - Math.sin((18 + i * 72) / 180 * Math.PI) * (star.size / 2)
            );
            ctx.lineTo(
                star.x + Math.cos((54 + i * 72) / 180 * Math.PI) * (star.size / 4),
                star.y - Math.sin((54 + i * 72) / 180 * Math.PI) * (star.size / 4)
            );
        }
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
    }, []);
    
    const endGame = useCallback(() => {
        setIsGameOver(true);
        cancelAnimationFrame(gameLoopIdRef.current);

        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('starCatcherHighScore', score);
        }

        setModalInfo({
            title: 'Game Over!',
            text: `Your final score is <strong class="text-yellow-300 text-xl">${score}</strong>.<br>Let's try again!`,
            button: 'Play Again'
        });
    }, [score, highScore]);
    
    const gameLoop = useCallback(() => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        starSpawnTimerRef.current++;
        if (starSpawnTimerRef.current >= starSpawnIntervalRef.current) {
            const size = Math.random() * 10 + 10;
            starsRef.current.push({
                x: Math.random() * (canvas.width - size),
                y: -size,
                size: size,
                speed: Math.random() * 1.5 + starSpeedRef.current,
                color: `hsl(${Math.random() * 60 + 40}, 100%, 75%)`
            });
            starSpawnTimerRef.current = 0;
            if (starSpawnIntervalRef.current > 30) starSpawnIntervalRef.current -= 0.5;
            if (starSpeedRef.current < 4) starSpeedRef.current += 0.02;
        }

        drawPlayer(ctx);
        
        for (let i = starsRef.current.length - 1; i >= 0; i--) {
            const star = starsRef.current[i];
            star.y += star.speed;
            drawStar(ctx, star);
            
            if (playerRef.current && star.x < playerRef.current.x + playerRef.current.width &&
                star.x + star.size > playerRef.current.x &&
                star.y < playerRef.current.y + playerRef.current.height &&
                star.y + star.size > playerRef.current.y) {
                
                setScore(prevScore => prevScore + 1);
                starsRef.current.splice(i, 1);
            } 
            else if (star.y > canvas.height) {
                starsRef.current.splice(i, 1);
                setLives(prevLives => {
                    const newLives = prevLives - 1;
                    if (newLives <= 0) {
                        endGame();
                        return 0;
                    }
                    return newLives;
                });
            }
        }
        
        if (!isGameOver) {
            gameLoopIdRef.current = requestAnimationFrame(gameLoop);
        }
    }, [isGameOver, drawPlayer, drawStar, endGame]);

    const startGame = useCallback(() => {
        const canvas = canvasRef.current;
        setIsGameOver(false);
        setScore(0);
        setLives(3);
        starsRef.current = [];
        starSpeedRef.current = 1;
        starSpawnIntervalRef.current = 90;
        
        playerRef.current = {
            width: canvas.width / 8,
            height: canvas.height / 20,
            x: canvas.width / 2 - (canvas.width / 8) / 2,
            y: canvas.height - (canvas.height / 20) - 10,
            speed: 10,
        };
    }, []);

    const movePlayer = useCallback((clientX) => {
        if (!playerRef.current || !canvasRef.current || isGameOver) return;
        const rect = canvasRef.current.getBoundingClientRect();
        let newX = clientX - rect.left - playerRef.current.width / 2;
        if (newX < 0) newX = 0;
        if (newX + playerRef.current.width > canvasRef.current.width) {
            newX = canvasRef.current.width - playerRef.current.width;
        }
        playerRef.current.x = newX;
    }, [isGameOver]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = gameContainerRef.current;
        if (!canvas || !container) return;

        const resizeCanvas = () => {
            const containerWidth = container.clientWidth;
            canvas.width = containerWidth - (window.innerWidth < 640 ? 24 : 48);
            canvas.height = canvas.width * (9 / 16);
            if (playerRef.current) {
                playerRef.current.width = canvas.width / 8;
                playerRef.current.height = canvas.height / 20;
                playerRef.current.y = canvas.height - playerRef.current.height - 10;
            }
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        if (!isGameOver) {
            gameLoopIdRef.current = requestAnimationFrame(gameLoop);
        }

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            cancelAnimationFrame(gameLoopIdRef.current);
        };
    }, [isGameOver, gameLoop]);
    
    useEffect(() => {
        if (!isGameOver) {
            gameLoopIdRef.current = requestAnimationFrame(gameLoop);
        } else {
            cancelAnimationFrame(gameLoopIdRef.current);
        }
    }, [isGameOver, gameLoop]);


    return (
        <div ref={gameContainerRef} className="w-full max-w-2xl mx-auto p-4 sm:p-6 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl shadow-indigo-500/20 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-yellow-300 mb-2">Star Catcher</h1>
            <p className="text-slate-400 mb-4">Move the basket to catch the stars!</p>
            <div className="flex justify-between items-center mb-4 px-2">
                <div className="text-lg">Score: <span className="font-bold text-2xl text-yellow-400">{score}</span></div>
                <div className="flex items-center gap-2">
                    <span className="text-lg">Lives:</span>
                    <div className="flex gap-1">
                        {Array.from({ length: lives }).map((_, i) => <HeartIcon key={i} />)}
                    </div>
                </div>
                <div className="text-lg">High Score: <span className="font-bold text-2xl text-cyan-400">{highScore}</span></div>
            </div>
            <canvas
                ref={canvasRef}
                className="bg-slate-900/50 rounded-xl border-2 border-slate-700 w-full touch-none"
                onMouseMove={(e) => movePlayer(e.clientX)}
                onTouchMove={(e) => movePlayer(e.touches[0].clientX)}
            />
            {isGameOver && (
                <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-20">
                    <div className="bg-slate-800 p-8 rounded-2xl shadow-lg text-center border border-slate-600 max-w-sm mx-4">
                        <h2 className="text-3xl font-bold mb-4 text-yellow-300">{modalInfo.title}</h2>
                        <p className="mb-6 text-slate-300" dangerouslySetInnerHTML={{ __html: modalInfo.text }} />
                        <button
                            onClick={startGame}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-lg text-xl transition-all duration-200 transform hover:scale-105 shadow-lg shadow-indigo-500/50"
                        >
                            {modalInfo.button}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};


// =================================================================================
// --- KOMPONEN LOTRE: CRYPTO LOTTERY ---
// =================================================================================

// --- Firebase Configuration ---
// ❗ PENTING: Ganti konfigurasi di bawah ini dengan konfigurasi Firebase Anda sendiri.
const firebaseConfig = { 
    apiKey: "GANTI_DENGAN_API_KEY_ANDA", 
    authDomain: "GANTI_DENGAN_AUTH_DOMAIN_ANDA", 
    projectId: "GANTI_DENGAN_PROJECT_ID_ANDA", 
    storageBucket: "GANTI_DENGAN_STORAGE_BUCKET_ANDA", 
    messagingSenderId: "GANTI_DENGAN_MESSAGING_SENDER_ID_ANDA", 
    appId: "GANTI_DENGAN_APP_ID_ANDA" 
};

// Anda bisa membuat beberapa lotre berbeda dengan mengubah ID ini
const appId = 'default-crypto-lottery';

const CryptoLotteryApp = () => {
    // --- State Management ---
    const [auth, setAuth] = useState(null);
    const [db, setDb] = useState(null);
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

    // --- Firebase Initialization and Authentication ---
    useEffect(() => {
        const app = initializeApp(firebaseConfig);
        const authInstance = getAuth(app);
        const dbInstance = getFirestore(app);
        
        setAuth(authInstance);
        setDb(dbInstance);

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

    // --- Firestore Real-time Listeners ---
    useEffect(() => {
        if (!isAuthReady || !db || !userId) return;
        setIsLoading(true);
        const lotteryDocRef = doc(db, `artifacts/${appId}/public/data/lottery`, "current");
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

        const participantsColRef = collection(db, `artifacts/${appId}/public/data/lottery/current/participants`);
        const unsubscribeParticipants = onSnapshot(participantsColRef, (snapshot) => {
            const participantsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setParticipants(participantsList);
            setHasJoined(participantsList.some(p => p.id === userId));
        }, (err) => {
            console.error("Error fetching participants:", err);
            setError("Could not load participants list.");
        });

        return () => {
            unsubscribeLottery();
            unsubscribeParticipants();
        };
    }, [isAuthReady, db, userId]);

    // --- Core Functions ---
    const handleJoinLottery = async () => {
        if (!db || !userId || hasJoined) return;
        setIsJoining(true);
        setError('');

        try {
            const lotteryDocRef = doc(db, `artifacts/${appId}/public/data/lottery`, "current");
            const participantDocRef = doc(db, `artifacts/${appId}/public/data/lottery/current/participants`, userId);
            
            const lotteryDocSnap = await getDoc(lotteryDocRef);
            if (!lotteryDocSnap.exists()) throw new Error("Lottery not found.");

            const currentData = lotteryDocSnap.data();
            const newPot = (currentData.totalPot || 0) + lottery.entryFee;
            const newCount = (currentData.participantsCount || 0) + 1;

            const batch = writeBatch(db);
            batch.set(participantDocRef, { joinedAt: serverTimestamp() });
            batch.update(lotteryDocRef, { totalPot: newPot, participantsCount: newCount });
            await batch.commit();
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
            const lotteryDocRef = doc(db, `artifacts/${appId}/public/data/lottery`, "current");
            await setDoc(lotteryDocRef, { winner: winner.id, lastDrawn: serverTimestamp() }, { merge: true });
        } catch (e) {
            console.error("Error drawing winner:", e);
            setError("Failed to draw a winner. Please try again.");
        } finally {
            setIsDrawing(false);
        }
    };

    const handleResetLottery = async () => {
        if (!db) return;
        setIsDrawing(true);
        try {
            const batch = writeBatch(db);
            const participantsColRef = collection(db, `artifacts/${appId}/public/data/lottery/current/participants`);
            const participantsSnapshot = await getDocs(participantsColRef);
            participantsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

            const lotteryDocRef = doc(db, `artifacts/${appId}/public/data/lottery`, "current");
            batch.update(lotteryDocRef, {
                totalPot: 0,
                participantsCount: 0,
                winner: null,
                lastDrawn: serverTimestamp()
            });
            await batch.commit();
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


// =================================================================================
// --- KOMPONEN UTAMA: App (Router) ---
// =================================================================================

export default function App() {
    const [activeApp, setActiveApp] = useState('lottery'); // 'lottery' atau 'star-catcher'

    const NavButton = ({ appName, icon, children }) => (
        <button
            onClick={() => setActiveApp(appName)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-semibold ${
                activeApp === appName 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
        >
            {icon}
            {children}
        </button>
    );

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans p-4 md:p-8">
            {/* Navigasi Utama */}
            <nav className="max-w-4xl mx-auto mb-8 p-3 bg-gray-800/50 border border-gray-700 rounded-xl flex items-center justify-center gap-4">
                <NavButton appName="lottery" icon={<CubeTransparentIcon className="h-5 w-5" />}>
                    Crypto Lottery
                </NavButton>
                <NavButton appName="star-catcher" icon={<StarIcon className="h-5 w-5" />}>
                    Star Catcher
                </NavButton>
            </nav>

            {/* Konten Aplikasi Aktif */}
            <main>
                {activeApp === 'star-catcher' && <StarCatcherGame />}
                {activeApp === 'lottery' && <CryptoLotteryApp />}
            </main>
        </div>
    );
}
