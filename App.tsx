import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import SessionSetup from './components/SessionSetup';
import CaptureInterface from './components/CaptureInterface';
import AIStudio from './components/AIStudio';
import { SessionProvider } from './context/SessionContext';

const App: React.FC = () => {
  return (
    <SessionProvider>
      <HashRouter>
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center font-bold text-white">
                  W
                </div>
                <span className="font-bold text-xl tracking-tight text-white">Worldview</span>
              </div>
              <nav className="hidden md:flex gap-6 text-sm font-medium text-zinc-400">
                <a href="#/" className="hover:text-white transition-colors">Dashboard</a>
                <a href="#/session" className="hover:text-white transition-colors">New Session</a>
                <a href="#/ai-studio" className="hover:text-white transition-colors">AI Studio</a>
              </nav>
            </div>
          </header>
          
          <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/session" element={<SessionSetup />} />
              <Route path="/capture" element={<CaptureInterface />} />
              <Route path="/ai-studio" element={<AIStudio />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </SessionProvider>
  );
};

export default App;