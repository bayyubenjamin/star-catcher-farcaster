// src/App.jsx

import React, { useState, useEffect } from 'react';
// PERBAIKAN: Menambahkan ekstensi .jsx pada path import
import HomePage from './components/pages/HomePage.jsx';
import StarCatcherPage from './components/pages/StarCatcherPage.jsx';
import LotteryPage from './components/pages/LotteryPage.jsx';

export default function App() {
    const [route, setRoute] = useState(window.location.pathname);

    useEffect(() => {
        const handlePopState = () => {
            setRoute(window.location.pathname);
        };
        // Listen for browser navigation (back/forward buttons)
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    let Component;
    switch (route) {
        case '/StarCatcher':
            Component = <StarCatcherPage />;
            break;
        case '/lottery':
            Component = <LotteryPage />;
            break;
        case '/':
        default:
            Component = <HomePage />;
            break;
    }

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans p-4 md:p-8 flex items-center justify-center">
            <main className="w-full">
                {Component}
            </main>
        </div>
    );
}
