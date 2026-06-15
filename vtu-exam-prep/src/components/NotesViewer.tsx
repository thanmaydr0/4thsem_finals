import { useState, useEffect, useRef, useCallback } from 'react';
import {
  BookOpen,
  FileText,
  Image as ImageIcon,
  Download,
  X,
  ZoomIn,
  ZoomOut,
  Pen,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';
import { useStudyStore } from '../hooks/useStudyStore';
import type { Note, SubjectId } from '../types';

interface NotesViewerProps {
  subjectId: SubjectId;
  modules: { id: string; module_number: number; title: string }[];
}

export default function NotesViewer({ subjectId, modules }: NotesViewerProps) {
  const { selectedModuleNumber } = useStudyStore();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  const bucketName = `${subjectId}-notes`;

  useEffect(() => {
    async function fetchNotes() {
      setLoading(true);

      let query = supabase
        .from('notes')
        .select('*')
        .eq('subject_id', subjectId)
        .order('sort_order');

      if (selectedModuleNumber !== null) {
        const selectedMod = modules.find(
          (m) => m.module_number === selectedModuleNumber
        );
        if (selectedMod) {
          // Fetch module-specific + general notes (module_id is null)
          query = query.or(`module_id.eq.${selectedMod.id},module_id.is.null`);
        }
      }

      const { data } = await query;
      setNotes(data ?? []);
      setLoading(false);
    }

    fetchNotes();
  }, [subjectId, selectedModuleNumber, modules]);

  function getPublicUrl(filePath: string) {
    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return data.publicUrl;
  }

  // Split into general and module-specific
  const generalNotes = notes.filter((n) => n.module_id === null);
  const moduleNotes = notes.filter((n) => n.module_id !== null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Active note viewer (full panel takeover)
  if (activeNote) {
    return (
      <NoteViewer
        note={activeNote}
        publicUrl={getPublicUrl(activeNote.file_path)}
        bucketName={bucketName}
        onClose={() => setActiveNote(null)}
      />
    );
  }

  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-5 py-12">
        <BookOpen size={28} className="text-muted-foreground mb-3" />
        <p className="text-sm text-muted mb-3">
          {selectedModuleNumber
            ? `No notes uploaded for Module ${selectedModuleNumber} yet.`
            : 'No notes found for this subject.'}
        </p>
        <div className="text-[11px] text-muted-foreground bg-card border border-border rounded-lg p-3 text-left w-full">
          <div className="flex items-center gap-1.5 mb-1.5 text-muted">
            <Terminal size={12} />
            <span className="font-medium">Upload notes via CLI:</span>
          </div>
          <code className="text-accent text-[10px] leading-relaxed block">
            node scripts/upload-notes.mjs<br />
            --subject={subjectId}<br />
            --folder="path/to/notes"
          </code>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-4">
      {/* General Notes Section */}
      {generalNotes.length > 0 && (
        <NoteSection
          title="General"
          notes={generalNotes}
          onSelect={setActiveNote}
        />
      )}

      {/* Module Notes Section */}
      {moduleNotes.length > 0 && (
        <NoteSection
          title={
            selectedModuleNumber
              ? `Module ${selectedModuleNumber}`
              : 'All Modules'
          }
          notes={moduleNotes}
          onSelect={setActiveNote}
          defaultExpanded
        />
      )}
    </div>
  );
}

// ── Note Section (collapsible group) ──

function NoteSection({
  title,
  notes,
  onSelect,
  defaultExpanded = true,
}: {
  title: string;
  notes: Note[];
  onSelect: (note: Note) => void;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full mb-2 group"
      >
        {expanded ? (
          <ChevronDown size={14} className="text-muted" />
        ) : (
          <ChevronRight size={14} className="text-muted" />
        )}
        <span className="text-xs font-semibold text-muted uppercase tracking-wider">
          {title}
        </span>
        <span className="text-[10px] text-muted-foreground">
          ({notes.length})
        </span>
        <div className="flex-1 border-t border-border/30" />
      </button>

      {expanded && (
        <div className="space-y-1.5">
          {notes.map((note) => (
            <button
              key={note.id}
              onClick={() => onSelect(note)}
              className="flex items-center gap-3 w-full p-2.5 rounded-lg bg-card border border-border hover:border-border-hover hover:bg-card-hover transition-colors group text-left"
            >
              <div className="shrink-0 w-8 h-8 rounded flex items-center justify-center bg-accent-subtle/30">
                {note.file_type === 'pdf' ? (
                  <FileText size={15} className="text-accent" />
                ) : (
                  <ImageIcon size={15} className="text-accent" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate group-hover:text-accent transition-colors">
                  {note.title}
                </p>
                <p className="text-[10px] text-muted uppercase">
                  {note.file_type}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Note Viewer (full panel — PDF or Image) ──

function NoteViewer({
  note,
  publicUrl,
  bucketName,
  onClose,
}: {
  note: Note;
  publicUrl: string;
  bucketName: string;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border shrink-0">
        <div className="min-w-0 flex-1 mr-2">
          <p className="text-sm font-medium truncate">{note.title}</p>
          <p className="text-[10px] text-muted uppercase">{note.file_type}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-card transition-colors"
            title="Open in new tab"
          >
            <ExternalLink size={14} />
          </a>
          <a
            href={publicUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-card transition-colors"
            title="Download"
          >
            <Download size={14} />
          </a>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted hover:text-foreground hover:bg-card transition-colors"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {note.file_type === 'pdf' ? (
          <iframe
            src={publicUrl}
            className="w-full h-full border-0"
            title={note.title}
          />
        ) : (
          <ImageViewer
            src={publicUrl}
            title={note.title}
            bucketName={bucketName}
          />
        )}
      </div>
    </div>
  );
}

// ── Image Viewer with Zoom/Pan + Annotation ──

function ImageViewer({
  src,
  title,
  bucketName,
}: {
  src: string;
  title: string;
  bucketName: string;
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Annotation state
  const [annotating, setAnnotating] = useState(false);
  const [paths, setPaths] = useState<{ x: number; y: number }[][]>([]);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [saving, setSaving] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const zoomIn = () => setZoom((z) => Math.min(z + 0.25, 4));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Wheel zoom
  function handleWheel(e: React.WheelEvent) {
    if (annotating) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.max(0.5, Math.min(z + delta, 4)));
  }

  // Pan via mouse drag (when not annotating)
  function handleMouseDown(e: React.MouseEvent) {
    if (annotating) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (annotating) return;
    if (!isPanning) return;
    setPan({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    });
  }

  function handleMouseUp() {
    setIsPanning(false);
  }

  // ── Annotation drawing ──
  function getCanvasPos(e: React.MouseEvent): { x: number; y: number } | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function handleAnnotationMouseDown(e: React.MouseEvent) {
    if (!annotating) return;
    const pos = getCanvasPos(e);
    if (pos) setCurrentPath([pos]);
  }

  function handleAnnotationMouseMove(e: React.MouseEvent) {
    if (!annotating || currentPath.length === 0) return;
    const pos = getCanvasPos(e);
    if (pos) {
      setCurrentPath((prev) => [...prev, pos]);
      drawOnCanvas([...paths, [...currentPath, pos]]);
    }
  }

  function handleAnnotationMouseUp() {
    if (!annotating || currentPath.length === 0) return;
    setPaths((prev) => [...prev, currentPath]);
    setCurrentPath([]);
  }

  function drawOnCanvas(allPaths: { x: number; y: number }[][]) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const path of allPaths) {
      if (path.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.stroke();
    }
  }

  // Resize canvas to match container
  useEffect(() => {
    function resize() {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      drawOnCanvas(paths);
    }

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [paths, annotating]);

  // Save annotation
  const saveAnnotation = useCallback(async () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || paths.length === 0) return;

    setSaving(true);
    try {
      // Create a composite canvas with the image + annotations
      const compositeCanvas = document.createElement('canvas');
      compositeCanvas.width = img.naturalWidth;
      compositeCanvas.height = img.naturalHeight;
      const ctx = compositeCanvas.getContext('2d')!;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Scale annotation paths to match natural image dimensions
      const scaleX = img.naturalWidth / canvas.width;
      const scaleY = img.naturalHeight / canvas.height;

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 4 * Math.max(scaleX, scaleY);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (const path of paths) {
        if (path.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(path[0].x * scaleX, path[0].y * scaleY);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i].x * scaleX, path[i].y * scaleY);
        }
        ctx.stroke();
      }

      // Convert to blob and upload
      const blob = await new Promise<Blob>((resolve) =>
        compositeCanvas.toBlob((b) => resolve(b!), 'image/png')
      );

      const fileName = `annotated_${Date.now()}.png`;
      const storagePath = `annotations/${fileName}`;

      await supabase.storage.from(bucketName).upload(storagePath, blob, {
        contentType: 'image/png',
        upsert: false,
      });

      setPaths([]);
      setAnnotating(false);
      const ctx2 = canvas.getContext('2d');
      ctx2?.clearRect(0, 0, canvas.width, canvas.height);

      alert('Annotation saved to storage!');
    } catch {
      alert('Failed to save annotation. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [paths, bucketName]);

  function clearAnnotations() {
    setPaths([]);
    setCurrentPath([]);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-border shrink-0 bg-surface/50">
        <div className="flex items-center gap-1">
          <button onClick={zoomOut} className="p-1 rounded text-muted hover:text-foreground hover:bg-card transition-colors" title="Zoom out">
            <ZoomOut size={14} />
          </button>
          <span className="text-[11px] text-muted w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button onClick={zoomIn} className="p-1 rounded text-muted hover:text-foreground hover:bg-card transition-colors" title="Zoom in">
            <ZoomIn size={14} />
          </button>
          <button onClick={resetView} className="p-1 rounded text-muted hover:text-foreground hover:bg-card transition-colors ml-1" title="Reset view">
            <RotateCcw size={13} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setAnnotating(!annotating)}
            className={clsx(
              'flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors',
              annotating
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-muted hover:text-foreground hover:bg-card'
            )}
            title="Toggle annotation pen"
          >
            <Pen size={12} />
            {annotating ? 'Drawing' : 'Annotate'}
          </button>

          {paths.length > 0 && (
            <>
              <button
                onClick={clearAnnotations}
                className="p-1 rounded text-muted hover:text-foreground hover:bg-card transition-colors"
                title="Clear annotations"
              >
                <X size={13} />
              </button>
              <button
                onClick={saveAnnotation}
                disabled={saving}
                className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-accent/15 text-accent hover:bg-accent/25 transition-colors"
                title="Save annotated copy"
              >
                <Save size={12} />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Image + Canvas Overlay */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing select-none bg-background"
        onWheel={handleWheel}
        onMouseDown={(e) => {
          handleMouseDown(e);
          handleAnnotationMouseDown(e);
        }}
        onMouseMove={(e) => {
          handleMouseMove(e);
          handleAnnotationMouseMove(e);
        }}
        onMouseUp={() => {
          handleMouseUp();
          handleAnnotationMouseUp();
        }}
        onMouseLeave={() => {
          handleMouseUp();
          handleAnnotationMouseUp();
        }}
        style={annotating ? { cursor: 'crosshair' } : undefined}
      >
        <img
          ref={imgRef}
          src={src}
          alt={title}
          className="absolute top-1/2 left-1/2 max-w-none select-none pointer-events-none"
          style={{
            transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
          draggable={false}
          crossOrigin="anonymous"
        />

        {/* Annotation canvas overlay */}
        {annotating && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ zIndex: 10 }}
          />
        )}
      </div>
    </div>
  );
}
