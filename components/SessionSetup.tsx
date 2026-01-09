import React from 'react';
import { useSession } from '../context/SessionContext';
import { useNavigate } from 'react-router-dom';
import Button from './ui/Button';

const SessionSetup: React.FC = () => {
  const { createSession, joinSession } = useSession();
  const navigate = useNavigate();
  const [joinId, setJoinId] = React.useState('');

  const handleCreate = () => {
    createSession();
    navigate('/capture');
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinId.trim().length > 0) {
      joinSession(joinId);
      navigate('/capture');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">Start Worldview</h2>
      
      <div className="space-y-8">
        <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            </div>
          <h3 className="text-lg font-semibold text-white mb-2">New Shoot</h3>
          <p className="text-sm text-zinc-400 mb-4">Create a session and invite other phones as cameras.</p>
          <Button onClick={handleCreate} size="lg" className="w-full">
            Create Session
          </Button>
          <p className="text-xs text-zinc-600 mt-2">Open a new tab to simulate a second device.</p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-zinc-900 text-zinc-500">Or join existing</span>
          </div>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label htmlFor="sessionId" className="block text-sm font-medium text-zinc-400 mb-1">Session ID</label>
              <input
                type="text"
                id="sessionId"
                value={joinId}
                onChange={(e) => setJoinId(e.target.value.toUpperCase())}
                placeholder="e.g. A7X9P2"
                className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all uppercase tracking-widest placeholder-zinc-600"
              />
            </div>
            <Button type="submit" variant="secondary" className="w-full" disabled={!joinId}>
              Join Camera Array
            </Button>
        </form>
      </div>
    </div>
  );
};

export default SessionSetup;