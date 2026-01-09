import React, { useEffect, useRef, useState } from 'react';
import { useSession } from '../context/SessionContext';
import Button from './ui/Button';
import { useNavigate } from 'react-router-dom';

const CaptureInterface: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { session, currentDevice, startRecording, stopRecording, addRecording } = useSession();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const navigate = useNavigate();

  // "Real" recording state (local to this component's MediaRecorder)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, 
          audio: true 
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        setError('Camera access denied or unavailable.');
        console.error(err);
      }
    };

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle global session recording state changes
  useEffect(() => {
      if (!session || !stream) return;

      const isRecording = session.status === 'Active';
      const isRecorderActive = mediaRecorderRef.current?.state === 'recording';

      if (isRecording && !isRecorderActive) {
          // START RECORDING
          console.log("Starting local recording...");
          chunksRef.current = [];
          const recorder = new MediaRecorder(stream);
          
          recorder.ondataavailable = (e) => {
              if (e.data.size > 0) chunksRef.current.push(e.data);
          };

          recorder.onstop = () => {
              const blob = new Blob(chunksRef.current, { type: 'video/mp4' });
              const rec = {
                  id: Math.random().toString(36).substring(7),
                  timestamp: Date.now(),
                  duration: 0, 
                  thumbnailUrl: 'https://picsum.photos/300/500?random=' + Math.random() 
              };
              // Only Director needs to officially "add" it to the session list in this simplified demo,
              // or we allow everyone to add their local clip to the list.
              // For sync demo purposes, we'll let everyone add it so we see it in the list.
              addRecording(rec);
              console.log("Local recording saved", blob.size);
          };

          recorder.start();
          mediaRecorderRef.current = recorder;

      } else if (!isRecording && isRecorderActive) {
          // STOP RECORDING
          console.log("Stopping local recording...");
          mediaRecorderRef.current?.stop();
      }
  }, [session?.status, stream]);


  const copySessionId = () => {
      if (session?.id) {
          navigator.clipboard.writeText(session.id);
          setCopyFeedback(true);
          setTimeout(() => setCopyFeedback(false), 2000);
      }
  };


  if (!session) {
      return (
          <div className="text-center mt-20">
              <p className="text-zinc-400 mb-4">No active session.</p>
              <Button onClick={() => navigate('/session')}>Go to Setup</Button>
          </div>
      )
  }

  const isDirector = currentDevice?.role === 'Director';
  const isRecording = session.status === 'Active';

  return (
    <div className="relative h-[calc(100vh-80px)] bg-black rounded-xl overflow-hidden border border-zinc-800">
      {/* Viewfinder */}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center text-red-500 bg-zinc-900">
          {error}
        </div>
      ) : (
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Overlay UI */}
      <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
        
        {/* Top Bar: Session Info */}
        <div className="flex justify-between items-start pointer-events-auto">
            <button 
                onClick={copySessionId}
                className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-xs font-mono text-zinc-300 border border-white/10 hover:bg-black/80 transition-all flex items-center gap-2 group"
            >
                <span>ID: <span className="text-white font-bold tracking-widest">{session.id}</span></span>
                <span className="material-icons text-[10px] opacity-50 group-hover:opacity-100">
                    {copyFeedback ? 'check' : 'content_copy'}
                </span>
            </button>
            <div className="flex gap-2">
                 <div className={`px-2 py-1 rounded text-xs font-bold uppercase flex items-center ${isDirector ? 'bg-purple-600 text-white' : 'bg-zinc-700 text-zinc-300'}`}>
                    {currentDevice?.role}
                 </div>
                 <div className={`border px-2 py-1 rounded text-xs font-bold uppercase flex items-center transition-all ${isRecording ? 'bg-red-500/20 text-red-100 border-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-black/40 text-zinc-400 border-white/10'}`}>
                    {isRecording ? 'REC ●' : 'STBY'}
                 </div>
            </div>
        </div>

        {/* Center Overlay Text for Camera Role */}
        {!isDirector && !isRecording && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <div className="bg-black/50 backdrop-blur px-6 py-4 rounded-xl border border-white/10">
                    <p className="text-zinc-400 text-sm font-medium uppercase tracking-widest mb-1">Status</p>
                    <h2 className="text-xl font-bold text-white">Linked to Director</h2>
                    <p className="text-xs text-zinc-500 mt-2">Recording will start automatically</p>
                </div>
            </div>
        )}

        {/* Bottom Bar: Controls */}
        <div className="pointer-events-auto flex flex-col gap-4">
            
            {/* Device List (Visible to everyone, but managed by Director) */}
            <div className="bg-black/60 backdrop-blur-md rounded-xl p-3 border border-white/10 mb-4 max-h-40 overflow-y-auto">
                <h4 className="text-xs text-zinc-400 font-bold mb-2 uppercase tracking-wider flex justify-between">
                    <span>Array Status</span>
                    <span>{session.devices.length} Connected</span>
                </h4>
                <div className="space-y-2">
                    {session.devices.map(dev => (
                        <div key={dev.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                                <span className={dev.id === currentDevice?.id ? 'text-white font-bold' : 'text-zinc-300'}>
                                    {dev.name} {dev.id === currentDevice?.id && '(You)'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] uppercase font-bold px-1.5 rounded ${dev.role === 'Director' ? 'bg-purple-900/50 text-purple-300' : 'bg-zinc-800 text-zinc-500'}`}>
                                    {dev.role === 'Director' ? 'DIR' : 'CAM'}
                                </span>
                                <span className={`w-2 h-2 rounded-full ${dev.status === 'Recording' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Action Button */}
            <div className="flex justify-center pb-4">
                {isDirector ? (
                    <button 
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all duration-300 shadow-2xl ${isRecording ? 'border-red-500 bg-red-500/20 scale-95' : 'border-white bg-white/10 hover:bg-white/20 hover:scale-105'}`}
                    >
                        <div className={`transition-all duration-300 ${isRecording ? 'w-8 h-8 bg-red-500 rounded-sm' : 'w-16 h-16 bg-red-600 rounded-full'}`}></div>
                    </button>
                ) : (
                    <div className="text-center">
                        {isRecording ? (
                            <div className="animate-pulse text-red-500 font-bold tracking-widest text-sm bg-black/80 px-4 py-2 rounded-full border border-red-500/30">
                                RECORDING IN PROGRESS
                            </div>
                        ) : (
                            <div className="text-zinc-500 text-xs">Waiting for start command...</div>
                        )}
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default CaptureInterface;