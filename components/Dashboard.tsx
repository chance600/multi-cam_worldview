import React from 'react';
import { useSession } from '../context/SessionContext';
import Button from './ui/Button';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { session, createSession } = useSession();
  const navigate = useNavigate();

  // Mock past gallery
  const galleryItems = [
    { id: 1, title: 'Downtown Skate Sesh', date: '2 hours ago', mode: '3D Pop', thumbnail: 'https://picsum.photos/400/225?random=1' },
    { id: 2, title: 'Studio Interview', date: 'Yesterday', mode: 'Viral Reframe', thumbnail: 'https://picsum.photos/400/225?random=2' },
    { id: 3, title: 'Concert Array', date: '3 days ago', mode: 'Free-Cam Pro', thumbnail: 'https://picsum.photos/400/225?random=3' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero / Active Session Card */}
      <section>
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Active Session</h2>
            {!session && (
                 <Button onClick={() => { createSession(); navigate('/capture'); }} size="sm">Start New</Button>
            )}
        </div>
        
        {session ? (
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-900 border border-zinc-800 rounded-xl p-6 relative overflow-hidden group hover:border-zinc-700 transition-all cursor-pointer" onClick={() => navigate('/capture')}>
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="w-32 h-32 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                        <h3 className="text-xl font-bold text-white">Session {session.id}</h3>
                    </div>
                    <p className="text-zinc-400 text-sm mb-6">{session.devices.length} Devices Connected • {session.recordings.length} Takes</p>
                    <div className="flex gap-3">
                        <Button onClick={(e) => { e.stopPropagation(); navigate('/capture'); }}>Resume Capture</Button>
                        <Button variant="secondary" onClick={(e) => { e.stopPropagation(); navigate('/ai-studio'); }}>AI Studio</Button>
                    </div>
                </div>
            </div>
        ) : (
            <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-xl p-8 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                </div>
                <h3 className="text-zinc-300 font-medium mb-1">No Active Session</h3>
                <p className="text-zinc-500 text-sm mb-4">Start a new phone array session or join one.</p>
                <Button onClick={() => { createSession(); navigate('/capture'); }}>Create Session</Button>
            </div>
        )}
      </section>

      {/* Library */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4">Recent Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {galleryItems.map(item => (
                <div key={item.id} className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-zinc-600 transition-all group">
                    <div className="aspect-video relative bg-zinc-800">
                        <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs font-medium text-white">
                            {item.mode}
                        </div>
                    </div>
                    <div className="p-4">
                        <h3 className="font-bold text-zinc-100 mb-1">{item.title}</h3>
                        <p className="text-xs text-zinc-500">{item.date}</p>
                    </div>
                </div>
            ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;