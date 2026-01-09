export interface Device {
  id: string;
  name: string;
  role: 'Director' | 'Camera';
  status: 'Ready' | 'Recording' | 'Syncing' | 'Uploading' | 'Error';
  battery: number;
  storage: number; // GB free
}

export interface Session {
  id: string;
  createdAt: number;
  devices: Device[];
  status: 'Idle' | 'Active' | 'Processing' | 'Complete';
  recordingStartTime?: number;
  recordings: Recording[];
}

export interface Recording {
  id: string;
  timestamp: number;
  duration: number;
  thumbnailUrl?: string;
}

export enum ProcessingMode {
  ViralReframe = 'Viral Reframe (Fast)',
  ThreeDPop = '3D Pop (Best)',
  FreeCamPro = 'Free-Cam 3D (Pro)',
}

// AI Service Types

export interface AnalysisResult {
  text: string;
  thinking?: string;
}

export interface VeoGeneration {
  videoUri?: string;
  status: 'generating' | 'complete' | 'failed';
  progress?: number;
}