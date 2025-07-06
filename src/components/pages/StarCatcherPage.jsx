// src/components/pages/StarCatcherPage.jsx

import React, { useState, useRef, useEffect, useCallback } from 'react';

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

export default StarCatcherGame;
