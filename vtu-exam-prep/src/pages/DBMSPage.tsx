import { useState, useEffect } from 'react';
import { AlertCircle, BookOpen, Target } from 'lucide-react';
import StudyLayout from '../components/StudyLayout';
import ADAQuestionList from '../components/ada/ADAQuestionList';
import ExamLeakDashboard from '../components/ExamLeakDashboard';
import { supabase } from '../lib/supabase';
import { useStudyStore } from '../hooks/useStudyStore';
import type { Question } from '../types';

interface ModuleData {
  id: string;
  module_number: number;
  title: string;
  description: string;
}

export default function DBMSPage() {
  const { selectedModuleNumber, setSelectedModule } = useStudyStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [predictionOpen, setPredictionOpen] = useState(false);

  useEffect(() => {
    if (modules.length > 0 && selectedModuleNumber === null) {
      setSelectedModule(1);
    }
  }, [modules, selectedModuleNumber, setSelectedModule]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const [modsRes, qsRes] = await Promise.all([
          supabase.from('modules').select('*').eq('subject_id', 'dbms'),
          supabase.from('questions').select('*').eq('subject_id', 'dbms').order('sort_order'),
        ]);

        if (modsRes.error) throw modsRes.error;
        if (qsRes.error) throw qsRes.error;

        setModules(modsRes.data || []);
        setQuestions(qsRes.data || []);
      } catch (err: any) {
        console.error('Error fetching DBMS data:', err);
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
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Loading DBMS Study Session...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <StudyLayout
        subjectId="dbms"
        subjectName="Database Management Systems"
        courseCode="BCS403"
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
      subjectId="dbms"
      subjectName="Database Management Systems"
      courseCode="BCS403"
    >
      <div className="max-w-4xl mx-auto mb-8">
        {selectedModule ? (
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <BookOpen size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-accent mb-2">
                <BookOpen size={18} />
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
              <BookOpen size={120} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-accent mb-2">
                <BookOpen size={18} />
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

      <div className="flex justify-end mb-4 max-w-4xl mx-auto">
        <button
          onClick={() => setPredictionOpen(true)}
          className="relative group overflow-hidden px-6 py-3 rounded-xl bg-black border border-emerald-500/30 text-emerald-500 font-mono font-bold tracking-widest text-sm flex items-center gap-2 transition-all hover:border-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02]"
        >
          <div className="absolute inset-0 bg-emerald-500/10 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
          <Target size={18} className="relative z-10 group-hover:animate-[spin_3s_linear_infinite]" />
          <span className="relative z-10">PREDICT NEXT EXAM</span>
        </button>
      </div>

      <ADAQuestionList questions={filteredQuestions} loading={loading} />

      <ExamLeakDashboard
        isOpen={predictionOpen}
        onClose={() => setPredictionOpen(false)}
        questions={questions} // Pass all questions to prediction engine
        subjectCode="BCS403"
      />
    </StudyLayout>
  );
}
