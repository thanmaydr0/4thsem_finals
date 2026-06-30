import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import StudyLayout from '../components/StudyLayout';
import { BookOpen, PenTool, CheckCircle2, XCircle } from 'lucide-react';
import clsx from 'clsx';

interface UHVQuestion {
  id: string;
  source_type: 'qp' | 'notes';
  source_name: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation_a: string;
  explanation_b: string;
  explanation_c: string;
  explanation_d: string;
  frequency: number;
}

export default function UHVPage() {
  const [activeTab, setActiveTab] = useState<'qp' | 'notes'>('qp');
  const [activeMode, setActiveMode] = useState<'study' | 'practice'>('study');
  const [questions, setQuestions] = useState<UHVQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Practice mode state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuestions() {
      setLoading(true);
      setError('');
      try {
        const { data, error } = await supabase
          .from('uhv_questions')
          .select('*')
          .eq('source_type', activeTab)
          .order('frequency', { ascending: false });

        if (error) throw error;
        setQuestions(data || []);
      } catch (err: any) {
        console.error('Error fetching UHV questions:', err);
        setError('Failed to load questions. Did you run the SQL migration?');
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, [activeTab]);

  // Reset practice mode when switching tabs or modes
  useEffect(() => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
  }, [activeTab, activeMode]);

  const renderOptions = (q: UHVQuestion, isPractice: boolean) => {
    const options = [
      { key: 'A', text: q.option_a, exp: q.explanation_a },
      { key: 'B', text: q.option_b, exp: q.explanation_b },
      { key: 'C', text: q.option_c, exp: q.explanation_c },
      { key: 'D', text: q.option_d, exp: q.explanation_d },
    ];

    if (isPractice) {
      const isAnswered = selectedAnswer !== null;

      return (
        <div className="space-y-4 mt-4">
          <div className="space-y-3">
            {options.map((opt) => {
              let stateClass = 'bg-slate-800 border-slate-700 hover:bg-slate-700';
              if (isAnswered) {
                if (opt.key === selectedAnswer) {
                  stateClass = 'bg-slate-700 border-slate-500 text-white';
                } else {
                  stateClass = 'bg-slate-800 border-slate-700 opacity-50';
                }
              }

              return (
                <button
                  key={opt.key}
                  disabled={isAnswered}
                  onClick={() => setSelectedAnswer(opt.key)}
                  className={clsx(
                    'w-full text-left p-4 rounded-lg border transition-all flex items-center gap-3',
                    stateClass
                  )}
                >
                  <span className="font-bold w-6 h-6 flex items-center justify-center rounded bg-black/20">
                    {opt.key}
                  </span>
                  <span>{opt.text}</span>
                </button>
              );
            })}
          </div>
          {isAnswered && (
            <div className="mt-6 p-5 rounded-xl border border-slate-700 bg-slate-800/50 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 mb-4">
                {selectedAnswer === q.correct_answer ? (
                  <><CheckCircle2 className="w-6 h-6 text-emerald-500" /> <span className="text-lg font-bold text-emerald-400">Correct!</span></>
                ) : (
                  <><XCircle className="w-6 h-6 text-rose-500" /> <span className="text-lg font-bold text-rose-400">Incorrect. The right answer is Option {q.correct_answer}</span></>
                )}
              </div>
              <div className="space-y-3 border-t border-slate-700/50 pt-4">
                {options.map((opt) => opt.exp ? (
                  <div key={opt.key} className="text-sm">
                    <span className={clsx("font-bold", opt.key === q.correct_answer ? "text-emerald-400" : "text-slate-300")}>
                      Option {opt.key}:
                    </span>{' '}
                    <span className="text-slate-400 leading-relaxed">{opt.exp}</span>
                  </div>
                ) : null)}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Study Mode
    return (
      <div className="space-y-4 mt-4">
        {options.map((opt) => (
          <div
            key={opt.key}
            className={clsx(
              'p-4 rounded-lg border',
              opt.key === q.correct_answer
                ? 'bg-emerald-900/20 border-emerald-500/50'
                : 'bg-slate-800/50 border-slate-700'
            )}
          >
            <div className="flex items-start gap-3">
              <span className={clsx(
                'font-bold w-6 h-6 flex items-center justify-center rounded shrink-0',
                opt.key === q.correct_answer ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
              )}>
                {opt.key}
              </span>
              <div>
                <p className={clsx('font-medium mb-1', opt.key === q.correct_answer ? 'text-emerald-300' : 'text-slate-300')}>
                  {opt.text}
                </p>
                {opt.exp && (
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {opt.exp}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <StudyLayout subjectId="uhv" subjectName="Universal Human Values" courseCode="BUHK408">
      <div className="max-w-4xl mx-auto p-6 animate-in fade-in zoom-in duration-500">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
            Universal Human Values (UHV)
          </h1>
          <p className="text-slate-400 text-lg">Master the MCQs through interactive practice and detailed study modes.</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between mb-8">
          <div className="flex p-1 bg-slate-800/50 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('qp')}
              className={clsx(
                'px-6 py-2 rounded-lg font-medium transition-all',
                activeTab === 'qp' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : 'text-slate-400 hover:text-white'
              )}
            >
              Previous Papers
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={clsx(
                'px-6 py-2 rounded-lg font-medium transition-all',
                activeTab === 'notes' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : 'text-slate-400 hover:text-white'
              )}
            >
              Notes MCQs
            </button>
          </div>

          <div className="flex p-1 bg-slate-800/50 rounded-xl w-fit">
            <button
              onClick={() => setActiveMode('study')}
              className={clsx(
                'px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2',
                activeMode === 'study' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-400 hover:text-white'
              )}
            >
              <BookOpen className="w-4 h-4" /> Study
            </button>
            <button
              onClick={() => setActiveMode('practice')}
              className={clsx(
                'px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2',
                activeMode === 'practice' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25' : 'text-slate-400 hover:text-white'
              )}
            >
              <PenTool className="w-4 h-4" /> Practice
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/50 rounded-lg text-rose-400">
            {error}
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-20 text-slate-500 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/20">
            No questions found for {activeTab === 'qp' ? 'Previous Papers' : 'Notes'}. Run the python script to generate them!
          </div>
        ) : activeMode === 'study' ? (
          // Study Mode View
          <div className="space-y-8">
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-sm">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-slate-200">
                    <span className="text-emerald-400 mr-2">Q{idx + 1}.</span>
                    {q.question_text}
                  </h3>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs px-2 py-1 bg-slate-800 rounded-md text-slate-400 border border-slate-700">
                      {q.source_name.toUpperCase()}
                    </span>
                    {q.frequency > 1 && (
                      <span className="text-xs px-2 py-1 bg-amber-500/20 rounded-md text-amber-400 border border-amber-500/30">
                        Repeated {q.frequency}x
                      </span>
                    )}
                  </div>
                </div>
                {renderOptions(q, false)}
              </div>
            ))}
          </div>
        ) : (
          // Practice Mode View
          <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 left-0 h-1 bg-emerald-500 transition-all duration-300" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
            
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm font-medium text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <div className="flex gap-2">
                <span className="text-xs px-2 py-1 bg-slate-800 rounded-md text-slate-400 border border-slate-700">
                  {questions[currentIndex].source_name.toUpperCase()}
                </span>
                {questions[currentIndex].frequency > 1 && (
                  <span className="text-xs px-2 py-1 bg-amber-500/20 rounded-md text-amber-400 border border-amber-500/30">
                    Repeated {questions[currentIndex].frequency}x
                  </span>
                )}
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-6 leading-relaxed">
              {questions[currentIndex].question_text}
            </h2>

            {renderOptions(questions[currentIndex], true)}

            {selectedAnswer !== null && (
              <div className="mt-8 flex justify-end animate-in slide-in-from-bottom-4 duration-300">
                <button
                  onClick={() => {
                    if (currentIndex < questions.length - 1) {
                      setCurrentIndex(i => i + 1);
                      setSelectedAnswer(null);
                    } else {
                      alert('You have completed all questions in this set!');
                    }
                  }}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2"
                >
                  {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish Practice'} 
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </StudyLayout>
  );
}
