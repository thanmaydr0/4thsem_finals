import { useState, useRef } from 'react';
import { X, Upload, Camera, FileText, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { evaluateHandwrittenAnswer, type EvaluationResult } from '../lib/vision';
import type { Question } from '../types';

interface TestMeModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question;
  subjectName: string;
}

export default function TestMeModal({ isOpen, onClose, question, subjectName }: TestMeModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
      setError(null);
      setResult(null);
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleEvaluate = async () => {
    if (!selectedImage) return;

    setIsEvaluating(true);
    setError(null);

    try {
      const evaluation = await evaluateHandwrittenAnswer(selectedImage, question.question_text, subjectName);
      setResult(evaluation);
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate answer.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getScoreColor = (score: number, max: number) => {
    const percentage = score / max;
    if (percentage >= 0.8) return 'text-emerald-500 border-emerald-500';
    if (percentage >= 0.5) return 'text-amber-500 border-amber-500';
    return 'text-red-500 border-red-500';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-surface border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <Camera size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Strict Examiner</h2>
              <p className="text-xs text-muted-foreground">Upload your handwritten answer for grading</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mb-6 p-4 rounded-xl bg-accent/5 border border-accent/20">
            <h3 className="text-sm font-medium text-accent mb-1">Evaluating Question:</h3>
            <p className="text-sm text-foreground/90 font-medium">{question.question_text}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
              <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {!selectedImage ? (
            <div 
              className="border-2 border-dashed border-border hover:border-accent/50 rounded-2xl p-8 transition-colors flex flex-col items-center justify-center text-center cursor-pointer group bg-card hover:bg-accent/5"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
                <Upload size={28} />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">Upload Handwritten Answer</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                Take a clear photo of your written answer and upload it here. The AI will evaluate it against the VTU rubric.
              </p>
              <button className="px-6 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors">
                Select Image
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
            </div>
          ) : !result ? (
            <div className="space-y-6">
              <div className="relative rounded-2xl overflow-hidden border border-border bg-black/5 flex items-center justify-center aspect-video sm:aspect-auto sm:max-h-80">
                <img 
                  src={selectedImage} 
                  alt="Student Answer" 
                  className="max-w-full max-h-full object-contain"
                />
                {isEvaluating && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="flex flex-col items-center p-6 bg-surface border border-border rounded-2xl shadow-xl">
                      <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
                      <p className="text-sm font-medium text-foreground">GPT-4o Vision is analyzing...</p>
                      <p className="text-xs text-muted-foreground mt-1">Reading handwriting & evaluating rubric</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleReset}
                  disabled={isEvaluating}
                  className="px-4 py-2 bg-surface border border-border text-foreground rounded-lg text-sm font-medium hover:bg-card transition-colors disabled:opacity-50"
                >
                  Choose Different Image
                </button>
                <button
                  onClick={handleEvaluate}
                  disabled={isEvaluating}
                  className="px-6 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isEvaluating ? 'Evaluating...' : 'Grade My Answer'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Score Circular Display */}
                <div className="shrink-0 flex flex-col items-center justify-center p-6 bg-card border border-border rounded-2xl">
                  <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center mb-3 ${getScoreColor(result.score, result.maxScore)}`}>
                    <span className="text-3xl font-bold">{result.score}</span>
                    <span className="text-sm opacity-50 mt-2">/{result.maxScore}</span>
                  </div>
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">VTU Marks</h4>
                </div>

                {/* Feedback */}
                <div className="flex-1 bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <FileText size={16} className="text-accent" />
                    Evaluator Feedback
                  </h3>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {result.feedback}
                  </p>
                </div>
              </div>

              {/* Missing Points */}
              {result.missingPoints && result.missingPoints.length > 0 && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-red-500 mb-4 flex items-center gap-2">
                    <XCircle size={16} />
                    Missing Key Points
                  </h3>
                  <ul className="space-y-3">
                    {result.missingPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm text-foreground/80">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                        <span className="leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.missingPoints && result.missingPoints.length === 0 && (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 flex items-center gap-3">
                  <CheckCircle2 className="text-emerald-500" size={24} />
                  <div>
                    <h3 className="text-sm font-semibold text-emerald-500">Perfect Coverage</h3>
                    <p className="text-xs text-emerald-500/80 mt-0.5">No critical points were missed in your answer.</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-border mt-6">
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 bg-surface border border-border text-foreground rounded-lg text-sm font-medium hover:bg-card transition-colors"
                >
                  Evaluate Another Answer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
