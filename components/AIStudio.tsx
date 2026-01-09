import React, { useState, useRef } from 'react';
import Button from './ui/Button';
import { generateVideo, editImage, analyzeImage, thinkAndAnswer } from '../services/geminiService';

type ToolMode = 'generate_video' | 'edit_image' | 'analyze' | 'think';

const AIStudio: React.FC = () => {
  const [activeMode, setActiveMode] = useState<ToolMode>('generate_video');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // For Veo aspect ratio
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt && activeMode !== 'analyze') return; // Analyze might just use image
    
    setIsLoading(true);
    setResult(null);

    try {
      if (activeMode === 'generate_video') {
        const imageBytes = selectedImage ? selectedImage.split(',')[1] : undefined;
        const videoUri = await generateVideo(prompt, aspectRatio, imageBytes);
        setResult(videoUri);
      } else if (activeMode === 'edit_image') {
        if (!selectedImage) {
            alert("Please upload an image to edit.");
            setIsLoading(false); 
            return;
        }
        const newImage = await editImage(selectedImage.split(',')[1], prompt);
        setResult(newImage);
      } else if (activeMode === 'analyze') {
        if (selectedImage) {
            const analysis = await analyzeImage(selectedImage.split(',')[1], prompt || "Analyze this image in detail.", true);
            setResult(analysis);
        } else {
            // No image, treat as complex text query (Thinking)
            const answer = await thinkAndAnswer(prompt);
            setResult(answer);
        }
      } else if (activeMode === 'think') {
        const answer = await thinkAndAnswer(prompt);
        setResult(answer);
      }
    } catch (err) {
      console.error(err);
      alert("AI Operation failed. Check console or ensure valid API Key.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-100px)]">
      
      {/* Sidebar Navigation */}
      <div className="lg:col-span-1 bg-zinc-900 rounded-xl border border-zinc-800 p-4 flex flex-col gap-2">
        <h3 className="text-zinc-400 font-bold text-xs uppercase tracking-wider mb-2 px-2">Studio Tools</h3>
        
        <button 
          onClick={() => { setActiveMode('generate_video'); setResult(null); }}
          className={`text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeMode === 'generate_video' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
        >
          <span className="material-icons text-lg">movie</span>
          <div>
            <div className="font-medium">Veo Generator</div>
            <div className="text-xs opacity-60">Text/Image to Video</div>
          </div>
        </button>

        <button 
          onClick={() => { setActiveMode('edit_image'); setResult(null); }}
          className={`text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeMode === 'edit_image' ? 'bg-pink-600/20 text-pink-300 border border-pink-500/30' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
        >
          <span className="material-icons text-lg">image_edit_auto</span>
          <div>
            <div className="font-medium">Nano Edit</div>
            <div className="text-xs opacity-60">Magic Image Editor</div>
          </div>
        </button>

        <button 
          onClick={() => { setActiveMode('analyze'); setResult(null); }}
          className={`text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeMode === 'analyze' ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
        >
          <span className="material-icons text-lg">document_scanner</span>
          <div>
            <div className="font-medium">Deep Analyze</div>
            <div className="text-xs opacity-60">Vision & Understanding</div>
          </div>
        </button>

         <button 
          onClick={() => { setActiveMode('think'); setResult(null); }}
          className={`text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeMode === 'think' ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
        >
          <span className="material-icons text-lg">network_intelligence</span>
          <div>
            <div className="font-medium">Thinking Mode</div>
            <div className="text-xs opacity-60">Complex Reasoning</div>
          </div>
        </button>
      </div>

      {/* Main Workspace */}
      <div className="lg:col-span-3 bg-black rounded-xl border border-zinc-800 flex flex-col overflow-hidden relative">
        
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        </div>

        <div className="p-6 overflow-y-auto flex-1 relative z-10">
          
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {activeMode === 'generate_video' && 'Veo Video Generator'}
                {activeMode === 'edit_image' && 'Nano Image Editor'}
                {activeMode === 'analyze' && 'Content Analysis'}
                {activeMode === 'think' && 'Deep Thinking'}
              </h2>
              <p className="text-zinc-400">
                {activeMode === 'generate_video' && 'Create cinematic b-roll or animate existing photos using Veo 3.'}
                {activeMode === 'edit_image' && 'Describe how you want to change the image (e.g., "add a neon sunset").'}
                {activeMode === 'analyze' && 'Upload an image or ask a complex question about your footage.'}
                {activeMode === 'think' && 'Ask complex production questions requiring deep reasoning.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900/50 p-6 rounded-xl border border-zinc-800/50">
              
              {/* Image Uploader (Shared across modes except purely text thinking) */}
              {activeMode !== 'think' && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Source Image {activeMode === 'generate_video' && '(Optional)'}</label>
                    <div 
                        className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center hover:bg-zinc-800/50 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {selectedImage ? (
                            <img src={selectedImage} alt="Preview" className="max-h-64 mx-auto rounded shadow-lg" />
                        ) : (
                            <div className="text-zinc-500">
                                <span className="block text-2xl mb-2">+</span>
                                <span>Click to upload reference image</span>
                            </div>
                        )}
                        <input 
                            ref={fileInputRef} 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleFileUpload}
                        />
                    </div>
                  </div>
              )}

              {/* Aspect Ratio for Video */}
              {activeMode === 'generate_video' && (
                  <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Aspect Ratio</label>
                      <div className="flex gap-4">
                          <button type="button" onClick={() => setAspectRatio('16:9')} className={`px-4 py-2 rounded border ${aspectRatio === '16:9' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>16:9 Landscape</button>
                          <button type="button" onClick={() => setAspectRatio('9:16')} className={`px-4 py-2 rounded border ${aspectRatio === '9:16' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>9:16 Portrait</button>
                      </div>
                  </div>
              )}

              {/* Prompt Input */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                    {activeMode === 'think' ? 'Your Query' : 'Prompt'}
                </label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                      activeMode === 'generate_video' ? "A cinematic drone shot of a futuristic city..." : 
                      activeMode === 'edit_image' ? "Make it look like a vintage polaroid..." :
                      "Describe what you need..."
                  }
                  className="w-full h-32 bg-black border border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" size="lg" isLoading={isLoading} disabled={isLoading || (!prompt && !selectedImage && activeMode !== 'think')}>
                  {activeMode === 'generate_video' ? 'Generate Video' : 'Run AI Process'}
                </Button>
              </div>
            </form>

            {/* Results Area */}
            {result && (
                <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 animate-fade-in">
                    <h3 className="text-white font-bold mb-4">Result</h3>
                    
                    {activeMode === 'generate_video' ? (
                        <div className="aspect-video bg-black rounded overflow-hidden flex items-center justify-center relative">
                             {/* Note: In a real app we'd need to handle auth token appending for private storage */}
                             <video src={result} controls autoPlay loop className="max-h-full max-w-full" />
                        </div>
                    ) : activeMode === 'edit_image' ? (
                         <div className="flex justify-center">
                             <img src={result} alt="Edited" className="rounded-lg max-h-[500px] shadow-2xl" />
                         </div>
                    ) : (
                        <div className="prose prose-invert max-w-none bg-black p-4 rounded-lg border border-zinc-800 text-zinc-300 whitespace-pre-wrap">
                            {result}
                        </div>
                    )}
                </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIStudio;