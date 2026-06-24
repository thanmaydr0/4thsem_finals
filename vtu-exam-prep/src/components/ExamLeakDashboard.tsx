import { useState, useEffect } from 'react';
import { X, Cpu, Terminal, ShieldAlert, Crosshair, Loader2, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import type { Question } from '../types';
import { generateExamPredictions, generatePredictionRationale, type PredictedQuestion } from '../lib/predictions';

interface ExamLeakDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  subjectCode: string;
}

export default function ExamLeakDashboard({ isOpen, onClose, questions, subjectCode }: ExamLeakDashboardProps) {
  const [isHacking, setIsHacking] = useState(true);
  const [predictions, setPredictions] = useState<PredictedQuestion[]>([]);
  const [rationale, setRationale] = useState<string | null>(null);
  const [loadingRationale, setLoadingRationale] = useState(false);

  useEffect(() => {
    if (isOpen && questions.length > 0) {
      // 1. Run local algorithm
      const result = generateExamPredictions(questions);
      setPredictions(result);
      
      // 2. Play intro animation
      setIsHacking(true);
      const timer = setTimeout(() => {
        setIsHacking(false);
        
        // 3. Fetch AI rationale in background after intro
        setLoadingRationale(true);
        generatePredictionRationale(result)
          .then(res => setRationale(res))
          .catch(err => console.error(err))
          .finally(() => setLoadingRationale(false));
          
      }, 3000); // 3 seconds of "hacking"
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, questions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md font-mono">
      {isHacking ? (
        <div className="text-emerald-500 flex flex-col items-center max-w-md text-center">
          <Terminal size={48} className="mb-6 animate-pulse" />
          <h2 className="text-2xl font-bold mb-4 uppercase tracking-[0.2em] glitch-text" data-text="BYPASSING VTU FIREWALLS...">
            BYPASSING VTU FIREWALLS...
          </h2>
          <div className="w-full h-1 bg-emerald-900 rounded-full overflow-hidden mb-4">
            <div className="h-full bg-emerald-500 animate-[pulse_1s_ease-in-out_infinite] w-full" style={{ animation: 'progress 3s ease-out forwards' }}></div>
          </div>
          <div className="text-xs opacity-70 space-y-1 text-left w-full h-32 overflow-hidden">
            <p> {">"} INITIALIZING PREDICTION ENGINE v4.2...</p>
            <p className="animate-pulse delay-75"> {">"} CROSS-REFERENCING {questions.length} HISTORICAL DATA POINTS...</p>
            <p className="animate-pulse delay-150"> {">"} ANALYZING EXAMINER PATTERNS...</p>
            <p className="animate-pulse delay-300"> {">"} COMPUTING PROBABILITY MATRICES...</p>
            <p className="animate-pulse delay-500"> {">"} DECRYPTING PAYLOAD...</p>
          </div>
          <style>{`
            @keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }
            .glitch-text { text-shadow: 2px 0 red, -2px 0 blue; animation: glitch 1s linear infinite; }
            @keyframes glitch { 2%, 64% { transform: translate(2px, 0) skew(0deg); } 4%, 60% { transform: translate(-2px, 0) skew(0deg); } 62% { transform: translate(0, 0) skew(5deg); } }
          `}</style>
        </div>
      ) : (
        <div className="relative w-full max-w-5xl h-[90vh] bg-[#0a0a0a] border border-emerald-500/30 rounded-xl overflow-hidden flex flex-col shadow-[0_0_50px_rgba(16,185,129,0.15)] animate-in fade-in zoom-in-95 duration-500">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-emerald-500/20 bg-emerald-500/5 shrink-0">
            <div className="flex items-center gap-3">
              <ShieldAlert className="text-emerald-500" size={24} />
              <div>
                <h2 className="text-lg font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                  CONFIDENTIAL <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] rounded">TOP SECRET</span>
                </h2>
                <p className="text-xs text-emerald-500/60 uppercase tracking-wider">{subjectCode} EXAM PREDICTION MATRIX</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            
            {/* Left Panel: Analysis */}
            <div className="w-full md:w-1/3 border-r border-emerald-500/20 bg-black/50 p-6 overflow-y-auto custom-scrollbar">
              <div className="mb-8">
                <h3 className="text-emerald-500 text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Cpu size={16} /> Neural Analysis
                </h3>
                {loadingRationale ? (
                  <div className="flex flex-col items-center justify-center py-10 opacity-50">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
                    <p className="text-xs text-emerald-500">Generating rationale...</p>
                  </div>
                ) : (
                  <div className="text-sm text-emerald-100/70 leading-relaxed whitespace-pre-wrap">
                    {rationale || "Analysis failed to generate."}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-emerald-500 text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Crosshair size={16} /> Global Stats
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border border-emerald-500/20 rounded bg-emerald-500/5">
                    <div className="text-2xl font-bold text-emerald-400">{predictions.length}</div>
                    <div className="text-[10px] text-emerald-500/60 uppercase">Predicted Q's</div>
                  </div>
                  <div className="p-3 border border-emerald-500/20 rounded bg-emerald-500/5">
                    <div className="text-2xl font-bold text-red-400">92%</div>
                    <div className="text-[10px] text-emerald-500/60 uppercase">Confidence</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: The Mock Paper */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#050505] custom-scrollbar relative">
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Sparkles size={200} />
              </div>
              
              <h3 className="text-emerald-500 text-sm font-bold uppercase tracking-widest mb-6">Target Mock Paper</h3>
              
              <div className="space-y-4 relative z-10">
                {predictions.map((q, i) => (
                  <div key={q.id} className="p-4 border border-emerald-500/20 rounded-lg bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors group">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <span className="text-emerald-500 font-bold shrink-0 mt-0.5">Q{i + 1}.</span>
                      <p className="text-emerald-100/90 text-sm leading-relaxed flex-1">{q.question_text}</p>
                      <div className="shrink-0 flex flex-col items-end">
                        <span className={clsx(
                          "text-xl font-bold",
                          q.probabilityScore >= 80 ? "text-red-500" : q.probabilityScore >= 60 ? "text-amber-500" : "text-emerald-500"
                        )}>
                          {q.probabilityScore}%
                        </span>
                        <span className="text-[10px] text-emerald-500/50 uppercase">Probability</span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-black rounded-full overflow-hidden mb-3 mt-4">
                      <div 
                        className={clsx(
                          "h-full",
                          q.probabilityScore >= 80 ? "bg-red-500" : q.probabilityScore >= 60 ? "bg-amber-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${q.probabilityScore}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-4 text-[10px] text-emerald-500/60 uppercase tracking-wider">
                      <span>Reasoning: <span className="text-emerald-400">{q.predictionReason}</span></span>
                      {q.frequency && <span>Freq: {q.frequency}x</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.2); border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(16, 185, 129, 0.4); }
          `}</style>
        </div>
      )}
    </div>
  );
}
