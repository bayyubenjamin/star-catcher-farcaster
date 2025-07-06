// src/components/pages/HomePage.jsx

import React from 'react';
import { StarIcon, CubeTransparentIcon } from '@heroicons/react/24/outline';

const HomePage = () => (
    <div className="text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-yellow-400 mb-6">Welcome to Farcaster Games!</h1>
        <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto">
            Choose a game to play. Both are built as Farcaster mini-apps. Have fun!
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Star Catcher Card */}
            <a href="/StarCatcher" className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-lg hover:shadow-yellow-400/20 hover:border-yellow-400 transition-all duration-300 transform hover:-translate-y-1 block">
                <div className="flex flex-col items-center">
                    <StarIcon className="h-16 w-16 text-yellow-300 mb-4" />
                    <h2 className="text-2xl font-bold text-yellow-300 mb-2">Star Catcher</h2>
                    <p className="text-slate-400">A classic arcade game. Catch the falling stars and get the highest score!</p>
                </div>
            </a>
            {/* Crypto Lottery Card */}
            <a href="/lottery" className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-lg hover:shadow-purple-400/20 hover:border-purple-400 transition-all duration-300 transform hover:-translate-y-1 block">
                <div className="flex flex-col items-center">
                    <CubeTransparentIcon className="h-16 w-16 text-purple-400 mb-4" />
                    <h2 className="text-2xl font-bold text-purple-400 mb-2">Crypto Lottery</h2>
                    <p className="text-slate-400">Join the lottery with a small fee and get a chance to win the entire pot!</p>
                </div>
            </a>
        </div>
    </div>
);

export default HomePage;
