import { useState, useEffect } from 'react';
import { AlertCircle, BrainCircuit, BookOpen, ArrowRight } from 'lucide-react';
import StudyLayout from '../components/StudyLayout';
import AIQuestionList from '../components/ai/AIQuestionList';
import { supabase } from '../lib/supabase';
import { useStudyStore } from '../hooks/useStudyStore';
import type { Question } from '../types';

interface ModuleData {
  id: string;
  module_number: number;
  title: string;
  description: string;
}

export default function AIPage() {
  const { selectedModuleNumber } = useStudyStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const [modsRes, qsRes] = await Promise.all([
          supabase.from('modules').select('*').eq('subject_id', 'ai'),
          supabase.from('questions').select('*').eq('subject_id', 'ai').order('sort_order'),
        ]);

        if (modsRes.error) throw modsRes.error;
        if (qsRes.error) throw qsRes.error;

        setModules(modsRes.data || []);
        setQuestions(qsRes.data || []);
      } catch (err: any) {
        console.error('Error fetching AI data:', err);
        setError(err.message || 'Failed to connect to the database. Please check your Supabase configuration.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const selectedModule = selectedModuleNumber !== null
    ? modules.find((m) => m.module_number === selectedModuleNumber)
    : null;

  const filteredQuestions = selectedModule
    ? questions.filter((q) => q.module_id === selectedModule.id)
    : questions;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Loading AI Study Session...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <StudyLayout
        subjectId="ai"
        subjectName="Artificial Intelligence"
        courseCode="BAD402"
      >
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <AlertCircle className="text-red-500" size={32} />
          </div>
          <h2 className="text-xl font-bold mb-2">Connection Error</h2>
          <p className="text-muted-foreground max-w-md">{error}</p>
        </div>
      </StudyLayout>
    );
  }

  return (
    <StudyLayout
      subjectId="ai"
      subjectName="Artificial Intelligence"
      courseCode="BAD402"
    >
      <div className="max-w-4xl mx-auto mb-8">
        {selectedModule ? (
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <BrainCircuit size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-purple-400 mb-2">
                <BrainCircuit size={18} />
                <span className="font-semibold text-sm uppercase tracking-wider">
                  Module {selectedModule.module_number}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-3">{selectedModule.title}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {selectedModule.description}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <BrainCircuit size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-purple-400 mb-2">
                <BrainCircuit size={18} />
                <span className="font-semibold text-sm uppercase tracking-wider">
                  Course Overview
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-3">All Modules</h2>
              <p className="text-muted-foreground leading-relaxed">
                You are viewing questions from all modules. Select a specific module from the sidebar to focus your study session.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Prominent Notebook Banner */}
      <div className="max-w-4xl mx-auto mb-8">
        <a 
          href="/notes/ai/BAD402-AI-Notebook.html" 
          target="_blank" 
          rel="noopener noreferrer"
          className="group relative block w-full overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/20 via-blue-500/10 to-background border-2 border-purple-500/50 hover:border-purple-400 transition-all duration-500 shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:shadow-[0_0_50px_rgba(168,85,247,0.3)] p-6 sm:p-8"
        >
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] bg-[position:-100%_0,0_0] bg-no-repeat group-hover:animate-[shimmer_2s_infinite]" />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex gap-5 items-center">
              <div className="p-4 bg-purple-500/20 rounded-xl text-purple-400 shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.3)] group-hover:scale-110 transition-transform duration-500">
                <BookOpen size={32} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-wider border border-purple-500/30">
                    Master Document
                  </span>
                  <span className="animate-pulse w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-purple-300 transition-colors">
                  Interactive AI Notebook
                </h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-lg">
                  Access the complete, interactive HTML notebook containing comprehensive notes, code cells, and outputs for all 5 modules.
                </p>
              </div>
            </div>
            
            <div className="w-full sm:w-auto flex items-center justify-center gap-2 bg-purple-500 text-white px-6 py-3 rounded-xl font-semibold uppercase tracking-wider text-sm shadow-[0_0_20px_rgba(168,85,247,0.4)] group-hover:bg-purple-400 transition-colors shrink-0">
              Open Notebook
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </a>
      </div>

      <AIQuestionList questions={filteredQuestions} loading={loading} />
    </StudyLayout>
  );
}
