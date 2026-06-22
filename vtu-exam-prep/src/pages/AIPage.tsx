import { useState, useEffect } from 'react';
import { AlertCircle, BrainCircuit } from 'lucide-react';
import StudyLayout from '../components/StudyLayout';
import AIQuestionList from '../components/ai/AIQuestionList';
import SiteRatingPopup from '../components/SiteRatingPopup';
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

      <AIQuestionList questions={filteredQuestions} loading={loading} />
      <SiteRatingPopup />
    </StudyLayout>
  );
}
