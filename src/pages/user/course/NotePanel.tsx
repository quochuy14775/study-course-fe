import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookMarked, ChevronDown, Clock, StickyNote, PlayCircle, Pencil, Trash2 } from 'lucide-react';
import type { Note } from '../../../types/lessonInteraction';

interface Props {
    notes: Note[];
    noteInput: string;
    currentTimestamp: number;
    onNoteInputChange: (val: string) => void;
    onAddNote: () => void;
    onDeleteNote: (id: number) => void;
    onSeekTo: (timestamp: number) => void;
    onEditNote: (id: number, text: string) => void;
}

const formatTimestamp = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const NotePanel: React.FC<Props> = ({
    notes, noteInput, currentTimestamp,
    onNoteInputChange, onAddNote, onDeleteNote, onSeekTo, onEditNote,
}) => {
    const [expanded, setExpanded] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingText, setEditingText] = useState('');

    const startEdit = (note: Note) => { setEditingId(note.id); setEditingText(note.content); };
    const saveEdit = () => {
        if (editingText.trim()) onEditNote(editingId!, editingText.trim());
        setEditingId(null);
    };

    return (
        <div className="h-full flex flex-col bg-white rounded-2xl border border-ink-200 shadow-soft overflow-hidden">

            {/* Header — same pattern as comment card tabs */}
            <button
                onClick={() => setExpanded(v => !v)}
                className="w-full flex items-center gap-2.5 px-5 py-3.5 border-b border-ink-100 hover:bg-ink-50/60 transition-colors"
            >
                <BookMarked className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="text-sm font-semibold text-ink-900 flex-1 text-left">Ghi chú của tôi</span>
                {notes.length > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600">
                        {notes.length}
                    </span>
                )}
                <motion.div animate={{ rotate: expanded ? 0 : -90 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-4 h-4 text-ink-400" />
                </motion.div>
            </button>

            {/* Body */}
            {expanded && (
                    <div className="flex-1 flex flex-col min-h-0">
                        {/* Input */}
                        <div className="px-5 py-4 border-b border-ink-100 space-y-3 bg-amber-50/30">
                            <textarea
                                value={noteInput}
                                onChange={(e) => onNoteInputChange(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onAddNote(); }}
                                placeholder="Nhập ghi chú... (Ctrl+Enter để lưu)"
                                rows={3}
                                className="w-full resize-none bg-white border border-amber-200 rounded-xl px-3 py-2.5 text-sm text-ink-800 placeholder-ink-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all leading-relaxed"
                            />
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] text-ink-400 flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" />
                                    Sẽ gắn tại <span className="font-mono font-semibold text-ink-600">{formatTimestamp(currentTimestamp)}</span>
                                </span>
                                <button
                                    onClick={onAddNote}
                                    disabled={!noteInput.trim()}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    <StickyNote className="w-3.5 h-3.5" /> Lưu ghi chú
                                </button>
                            </div>
                        </div>

                        {/* Notes list */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
                            {notes.length === 0 ? (
                                <div className="text-center py-10">
                                    <StickyNote className="w-8 h-8 text-ink-200 mx-auto mb-3" />
                                    <p className="text-sm text-ink-400 font-medium">Chưa có ghi chú nào</p>
                                    <p className="text-xs text-ink-300 mt-1">Dừng video và ghi lại điều bạn muốn nhớ</p>
                                </div>
                            ) : notes.map((note) => (
                                <motion.div
                                    key={note.id}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="group bg-amber-50 border border-amber-200 rounded-xl p-3.5 hover:border-amber-300 transition-all"
                                >
                                    {editingId === note.id ? (
                                        <div className="space-y-2">
                                            <textarea
                                                value={editingText}
                                                onChange={(e) => setEditingText(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveEdit();
                                                    if (e.key === 'Escape') setEditingId(null);
                                                }}
                                                autoFocus rows={3}
                                                className="w-full resize-none bg-white border border-amber-300 rounded-lg px-3 py-2 text-sm text-ink-800 focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all"
                                            />
                                            <div className="flex gap-1.5 justify-end">
                                                <button onClick={() => setEditingId(null)} className="px-2.5 py-1 rounded-lg text-xs font-medium text-ink-500 hover:bg-ink-100 transition-colors">Hủy</button>
                                                <button onClick={saveEdit} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-400 transition-colors">Lưu</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-between mb-2">
                                                <button
                                                    onClick={() => onSeekTo(note.videoTimestamp)}
                                                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-200 hover:bg-amber-300 text-amber-800 text-[11px] font-bold font-mono transition-colors"
                                                >
                                                    <PlayCircle className="w-3 h-3" />
                                                    {formatTimestamp(note.videoTimestamp)}
                                                </button>
                                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => startEdit(note)} className="p-1.5 rounded-lg text-ink-400 hover:text-amber-600 hover:bg-amber-100 transition-colors">
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={() => onDeleteNote(note.id)} className="p-1.5 rounded-lg text-ink-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                                        </>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
            )}
        </div>
    );
};

export default NotePanel;
