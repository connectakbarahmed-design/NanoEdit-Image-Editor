
import React, { useState, useCallback, useRef } from 'react';
import { EditSession, EditStep } from './types';
import { editImageWithGemini } from './geminiService';
import { 
  Plus, 
  Send, 
  Download, 
  History as HistoryIcon, 
  Image as ImageIcon,
  Sparkles,
  RotateCcw,
  Loader2,
  Trash2,
  ChevronRight,
  Monitor
} from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<EditSession | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSession({
        id: Date.now().toString(),
        originalImage: base64,
        currentImage: base64,
        history: []
      });
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleEdit = async () => {
    if (!session || !prompt.trim() || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    const result = await editImageWithGemini(session.currentImage, prompt);

    if (result.error) {
      setError(result.error);
    } else if (result.imageUrl) {
      const newStep: EditStep = {
        id: Date.now().toString(),
        prompt: prompt,
        imageUrl: result.imageUrl,
        timestamp: Date.now()
      };

      setSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          currentImage: result.imageUrl!,
          history: [...prev.history, newStep]
        };
      });
      setPrompt('');
    }
    setIsProcessing(false);
  };

  const resetToOriginal = () => {
    if (!session) return;
    setSession({
      ...session,
      currentImage: session.originalImage,
      history: []
    });
    setError(null);
  };

  const downloadImage = () => {
    if (!session) return;
    const link = document.createElement('a');
    link.href = session.currentImage;
    link.download = `nanoedit-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">NanoEdit</h1>
            <p className="text-xs text-slate-400 font-medium">Gemini 2.5 Flash AI Image Lab</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {session && (
            <>
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className={`p-2 rounded-full transition-colors ${showHistory ? 'bg-indigo-600/20 text-indigo-400' : 'hover:bg-slate-800 text-slate-400'}`}
                title="History"
              >
                <HistoryIcon className="w-5 h-5" />
              </button>
              <button 
                onClick={resetToOriginal}
                className="p-2 rounded-full hover:bg-slate-800 text-slate-400 transition-colors"
                title="Reset to Original"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button 
                onClick={downloadImage}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg font-medium transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </>
          )}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg font-medium transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Edit</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileUpload} 
          />
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {/* Workspace */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
          {!session ? (
            <div className="max-w-md text-center space-y-6">
              <div className="mx-auto w-24 h-24 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center shadow-2xl">
                <ImageIcon className="w-10 h-10 text-slate-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Start your first AI edit</h2>
                <p className="text-slate-400">Upload a photo to begin transforming it using natural language prompts powered by Gemini AI.</p>
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Choose Photo
              </button>
              <div className="grid grid-cols-2 gap-3 pt-4">
                {['"Make it a vintage photo"', '"Add some snow"', '"Remove the background"', '"Add a colorful sunset"'].map((tip, i) => (
                  <div key={i} className="text-[10px] uppercase tracking-wider font-bold text-slate-600 bg-slate-900/50 p-2 rounded border border-slate-800">
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="relative group w-full max-w-4xl h-full flex items-center justify-center">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900 group">
                <img 
                  src={session.currentImage} 
                  alt="Current workspace" 
                  className={`max-w-full max-h-[70vh] object-contain transition-opacity duration-300 ${isProcessing ? 'opacity-40' : 'opacity-100'}`}
                />
                
                {isProcessing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/20 backdrop-blur-sm">
                    <div className="relative">
                      <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                      <Sparkles className="w-4 h-4 text-white absolute top-0 right-0 animate-pulse" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-lg">Gemini is working...</p>
                      <p className="text-sm text-slate-400">Synthesizing your pixels</p>
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="absolute bottom-4 left-4 right-4 bg-red-500/90 backdrop-blur-md text-white px-4 py-3 rounded-xl flex items-center gap-3 shadow-xl">
                    <Trash2 className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                    <button onClick={() => setError(null)} className="ml-auto text-white/70 hover:text-white font-bold">Close</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Side Panel: History */}
        {session && showHistory && (
          <aside className="w-80 border-l border-slate-800 bg-slate-900/50 backdrop-blur-xl flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <HistoryIcon className="w-4 h-4 text-indigo-400" />
                History
              </h3>
              <button onClick={() => setShowHistory(false)} className="text-slate-500 hover:text-slate-300">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Original</p>
                <div 
                  className="relative aspect-square rounded-lg overflow-hidden border border-slate-800 cursor-pointer hover:border-indigo-500/50 transition-colors group"
                  onClick={() => setSession({...session, currentImage: session.originalImage})}
                >
                  <img src={session.originalImage} className="w-full h-full object-cover opacity-60 group-hover:opacity-100" alt="Original" />
                  <div className="absolute inset-0 bg-slate-950/20" />
                </div>
              </div>

              {session.history.slice().reverse().map((step) => (
                <div key={step.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest truncate max-w-[150px]">
                      {step.prompt}
                    </p>
                    <span className="text-[10px] text-slate-600">
                      {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div 
                    className={`relative aspect-square rounded-lg overflow-hidden border cursor-pointer transition-all ${session.currentImage === step.imageUrl ? 'border-indigo-600 shadow-lg shadow-indigo-600/20' : 'border-slate-800 hover:border-slate-700'}`}
                    onClick={() => setSession({...session, currentImage: step.imageUrl})}
                  >
                    <img src={step.imageUrl} className="w-full h-full object-cover" alt={step.prompt} />
                  </div>
                </div>
              ))}

              {session.history.length === 0 && (
                <div className="h-40 flex flex-col items-center justify-center text-slate-600 gap-2 border-2 border-dashed border-slate-800 rounded-xl">
                  <HistoryIcon className="w-8 h-8 opacity-20" />
                  <p className="text-xs font-medium italic">No edits yet</p>
                </div>
              )}
            </div>
          </aside>
        )}
      </main>

      {/* Footer / Prompt Input */}
      <footer className="p-6 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-center">
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
              disabled={!session || isProcessing}
              placeholder={session ? "Ask Gemini to edit this photo... e.g. 'Make it look like a rainy cyberpunk city'" : "Upload an image to start editing..."}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-6 pr-16 focus:outline-none focus:ring-2 focus:ring-indigo-600/50 focus:border-indigo-600 transition-all text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-inner placeholder:text-slate-600"
            />
            <button 
              onClick={handleEdit}
              disabled={!session || !prompt.trim() || isProcessing}
              className="absolute right-2 p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition-all shadow-lg shadow-indigo-600/20 group"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              )}
            </button>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {session && !isProcessing && (
              <>
                <QuickAction text="Add retro filter" onClick={() => setPrompt("Add a 1990s retro film filter with slight grain")} />
                <QuickAction text="Cyberpunk style" onClick={() => setPrompt("Transform into a cyberpunk neon aesthetic night scene")} />
                <QuickAction text="Remove background" onClick={() => setPrompt("Remove the entire background and replace it with a clean minimalist studio gray")} />
                <QuickAction text="Pencil sketch" onClick={() => setPrompt("Turn this image into a detailed pencil sketch on textured paper")} />
                <QuickAction text="Vibrant colors" onClick={() => setPrompt("Boost the saturation and vibrancy of all colors, make it pop")} />
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

const QuickAction: React.FC<{ text: string, onClick: () => void }> = ({ text, onClick }) => (
  <button 
    onClick={onClick}
    className="whitespace-nowrap px-3 py-1.5 bg-slate-800/50 border border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800 text-[11px] font-semibold text-slate-400 hover:text-indigo-400 rounded-full transition-all"
  >
    {text}
  </button>
);

export default App;
