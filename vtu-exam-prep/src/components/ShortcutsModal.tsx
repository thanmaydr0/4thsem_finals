import { X, Keyboard } from 'lucide-react';
import { useStudyStore } from '../hooks/useStudyStore';

export default function ShortcutsModal() {
  const { showShortcutsModal, setShowShortcutsModal } = useStudyStore();

  if (!showShortcutsModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface/50">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Keyboard size={18} className="text-accent" />
            Keyboard Shortcuts
          </div>
          <button
            onClick={() => setShowShortcutsModal(false)}
            className="p-2 -mr-2 rounded-lg text-muted hover:text-foreground hover:bg-card transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <ShortcutRow keys={['j']} description="Scroll questions down" />
          <ShortcutRow keys={['k']} description="Scroll questions up" />
          <div className="h-px bg-border/50 my-2" />
          <ShortcutRow keys={['n']} description="Open Notes sidebar" />
          <ShortcutRow keys={['a']} description="Open AI Assistant sidebar" />
          <div className="h-px bg-border/50 my-2" />
          <ShortcutRow keys={['1', '–', '5']} description="Jump to Module 1-5" />
          <ShortcutRow keys={['0']} description="Show All Modules" />
          <div className="h-px bg-border/50 my-2" />
          <ShortcutRow keys={['?']} description="Show this help menu" />
          <ShortcutRow keys={['Esc']} description="Close modals / expanded views" />
        </div>
      </div>
    </div>
  );
}

function ShortcutRow({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{description}</span>
      <div className="flex items-center gap-1.5">
        {keys.map((k, i) => (
          <kbd
            key={i}
            className="min-w-[24px] h-6 px-1.5 inline-flex items-center justify-center text-[11px] font-mono font-medium rounded bg-surface border border-border shadow-sm text-muted"
          >
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );
}
