import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Session, Device, Recording } from '../types';

interface SessionContextType {
  session: Session | null;
  currentDevice: Device | null;
  createSession: () => void;
  joinSession: (sessionId: string) => void;
  addDevice: (device: Device) => void;
  updateDeviceStatus: (deviceId: string, status: Device['status']) => void;
  startRecording: () => void;
  stopRecording: () => void;
  addRecording: (rec: Recording) => void;
}

type BroadcastMessage = 
  | { type: 'JOIN_REQUEST'; device: Device }
  | { type: 'SESSION_UPDATE'; session: Session }
  | { type: 'HEARTBEAT_REQUEST' };

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentDevice, setCurrentDevice] = useState<Device | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // 1. Initialize Device Identity (Persist across refreshes)
  useEffect(() => {
    let savedId = localStorage.getItem('worldview_device_id');
    if (!savedId) {
        savedId = Math.random().toString(36).substring(7);
        localStorage.setItem('worldview_device_id', savedId);
    }

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const device: Device = {
      id: savedId,
      name: isMobile ? `Mobile-${savedId}` : `Web-${savedId}`,
      role: 'Director', // Default, might change if we restore a session
      status: 'Ready',
      battery: 100,
      storage: 64,
    };
    setCurrentDevice(device);

    // 2. Try to restore Director session if it existed
    const savedSession = localStorage.getItem('worldview_active_session');
    if (savedSession) {
        try {
            const parsed = JSON.parse(savedSession) as Session;
            // Only restore if we were the creator (Director) logic-wise, 
            // or just restore it and let the channel setup handle roles.
            // For simplicity, we restore.
            console.log("Restoring previous session:", parsed.id);
            setSession(parsed);
            setupDirectorChannel(parsed.id);
        } catch (e) {
            console.error("Failed to restore session", e);
            localStorage.removeItem('worldview_active_session');
        }
    }

    return () => {
      channelRef.current?.close();
    };
  }, []);

  // 3. Persist Director Session changes & Broadcast
  useEffect(() => {
    if (!session || !currentDevice) return;

    // If we are Director, we own the state of truth
    if (currentDevice.role === 'Director') {
        localStorage.setItem('worldview_active_session', JSON.stringify(session));
        
        // Broadcast update
        if (channelRef.current) {
             channelRef.current.postMessage({ type: 'SESSION_UPDATE', session });
        }
    } else {
        // If we are Camera, we don't save to local storage as "active session" 
        // in the same way (or we could, but we don't want to become Director on refresh).
        // For V1, Cameras don't persist session on refresh to avoid role confusion.
    }
  }, [session, currentDevice?.role]);


  // --- Channel Logic Handlers ---

  const setupDirectorChannel = (sessionId: string) => {
      if (channelRef.current) channelRef.current.close();

      const channel = new BroadcastChannel(`worldview_${sessionId}`);
      channel.onmessage = (event) => {
          const msg = event.data as BroadcastMessage;
          
          if (msg.type === 'JOIN_REQUEST') {
              setSession(prev => {
                  if (!prev) return null;
                  
                  // Even if device exists, we MUST broadcast to ensure they get the state.
                  // But we only update state if it's actually new to avoid render loops if we didn't check.
                  const exists = prev.devices.find(d => d.id === msg.device.id);
                  
                  if (exists) {
                      // CRITICAL FIX: If device exists, 'setSession' won't trigger a change if we return 'prev'.
                      // So the useEffect broadcast won't fire.
                      // We must manually broadcast here for the "re-join" case.
                      channel.postMessage({ type: 'SESSION_UPDATE', session: prev });
                      return prev; 
                  }
                  
                  return { ...prev, devices: [...prev.devices, msg.device] };
              });
          } else if (msg.type === 'HEARTBEAT_REQUEST') {
             // Someone wants the state
             setSession(prev => {
                 if (prev) channel.postMessage({ type: 'SESSION_UPDATE', session: prev });
                 return prev;
             });
          }
      };
      channelRef.current = channel;
  };

  const setupCameraChannel = (sessionId: string) => {
      if (channelRef.current) channelRef.current.close();

      const channel = new BroadcastChannel(`worldview_${sessionId}`);
      channel.onmessage = (event) => {
          const msg = event.data as BroadcastMessage;
          if (msg.type === 'SESSION_UPDATE') {
              setSession(msg.session);
          }
      };
      channelRef.current = channel;
  };


  // --- Actions ---

  const createSession = () => {
    if (!currentDevice) return;
    
    const sessionId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newSession: Session = {
      id: sessionId,
      createdAt: Date.now(),
      devices: [currentDevice], // Director is first device
      status: 'Idle',
      recordings: [],
    };
    
    setSession(newSession);
    setupDirectorChannel(sessionId);
  };

  const joinSession = (sessionId: string) => {
    if (!currentDevice) return;

    // Switch role to Camera immediately
    const cameraDevice = { ...currentDevice, role: 'Camera' as const };
    setCurrentDevice(cameraDevice);

    // Temp session state
    const tempSession: Session = {
      id: sessionId,
      createdAt: Date.now(),
      devices: [cameraDevice],
      status: 'Idle',
      recordings: []
    };
    setSession(tempSession);

    // Setup listener
    setupCameraChannel(sessionId);

    // Send Join Request with a slight delay to ensure channel is open
    // and retry a few times to be robust
    const attemptJoin = () => {
        if (channelRef.current) {
            console.log("Sending JOIN_REQUEST...");
            channelRef.current.postMessage({ type: 'JOIN_REQUEST', device: cameraDevice });
        }
    };

    setTimeout(attemptJoin, 100);
    setTimeout(attemptJoin, 1000); // Retry
    setTimeout(attemptJoin, 3000); // Retry
  };

  const addDevice = (device: Device) => {
    if (!session) return;
    setSession((prev) => prev ? { ...prev, devices: [...prev.devices, device] } : null);
  };

  const updateDeviceStatus = (deviceId: string, status: Device['status']) => {
    if (!session) return;
    setSession((prev) => {
        if (!prev) return null;
        return {
            ...prev,
            devices: prev.devices.map(d => d.id === deviceId ? { ...d, status } : d)
        };
    });
  };

  const startRecording = () => {
    if (!session) return;
    // Director update triggers broadcast
    const now = Date.now();
    setSession(prev => prev ? { 
        ...prev, 
        status: 'Active', 
        recordingStartTime: now,
        devices: prev.devices.map(d => ({...d, status: 'Recording'}))
    } : null);
  };

  const stopRecording = () => {
    if (!session) return;
    // Director update triggers broadcast
    setSession(prev => prev ? { 
        ...prev, 
        status: 'Idle', 
        recordingStartTime: undefined,
        devices: prev.devices.map(d => ({...d, status: 'Ready'}))
    } : null);
  };

  const addRecording = (rec: Recording) => {
      setSession(prev => prev ? { ...prev, recordings: [rec, ...prev.recordings] } : null);
  }

  return (
    <SessionContext.Provider value={{
      session,
      currentDevice,
      createSession,
      joinSession,
      addDevice,
      updateDeviceStatus,
      startRecording,
      stopRecording,
      addRecording
    }}>
      {children}
    </SessionContext.Provider>
  );
};