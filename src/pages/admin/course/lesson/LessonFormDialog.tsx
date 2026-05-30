import React, {useEffect, useState, useRef} from 'react';
import {Lesson, LessonRequest} from '../../../../types/lesson';
import {v4 as uuidv4} from 'uuid';
import {GripVertical, Trash2, Plus, Image as ImageIcon, Clock, X} from 'lucide-react';
import {createPortal} from 'react-dom';
import {
    closestCenter,
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay, DragEndEvent, DragStartEvent, KeyboardSensor,
} from '@dnd-kit/core';

import {
    restrictToVerticalAxis,
    restrictToWindowEdges,
} from '@dnd-kit/modifiers';

import {
    SortableContext,
    arrayMove,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';

function parseYouTubeId(input: string): string {
    const s = input.trim();
    try {
        const url = new URL(s);
        if (url.hostname.includes('youtu.be')) return url.pathname.slice(1).split('?')[0];
        if (url.searchParams.has('v')) return url.searchParams.get('v')!;
        if (url.pathname.startsWith('/embed/')) return url.pathname.split('/embed/')[1].split('?')[0];
    } catch {}
    return s;
}

/** Parse ISO 8601 duration (PT1H2M3S) → seconds */
function parseIsoDuration(iso: string): number {
    const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!m) return 0;
    return (Number(m[1] ?? 0) * 3600) + (Number(m[2] ?? 0) * 60) + Number(m[3] ?? 0);
}

interface YouTubeMeta { title: string; duration: number; thumbnailUrl: string }

async function fetchYouTubeMeta(videoId: string): Promise<YouTubeMeta | null> {
    const key = process.env.REACT_APP_YOUTUBE_API_KEY;
    if (!key || !videoId) return null;
    try {
        const res = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${key}`
        );
        const data = await res.json();
        const item = data?.items?.[0];
        if (!item) return null;
        const title = item.snippet?.title ?? '';
        const duration = parseIsoDuration(item.contentDetails?.duration ?? '');
        const thumbnailUrl = item.snippet?.thumbnails?.high?.url
            ?? item.snippet?.thumbnails?.medium?.url
            ?? item.snippet?.thumbnails?.default?.url
            ?? '';
        return { title, duration, thumbnailUrl };
    } catch {
        return null;
    }
}

interface Props {
    open: boolean;
    onClose: () => void;
    // for create we now accept multiple lessons at once
    onCreate: (payload: LessonRequest[]) => Promise<any>;
    onUpdate: (id: string | number, payload: LessonRequest) => Promise<any>;
    editing?: Lesson | null;
}

type TempLesson = {
    tempId: string;
    title: string;
    videoId: string;
    duration?: number | null; // seconds
    thumbnailUrl?: string | null;
    orderIndex: number;
    isActive?: boolean;
};

const LessonDragOverlay = ({activeItem}: { activeItem: TempLesson }) => {
    return (
        <div className="w-full max-w-[680px] p-3 rounded-xl bg-white shadow-lg border border-ink-200">
            <div className="flex items-center">
                <div className="flex-1">
                    <div className="text-sm font-semibold text-ink-900">
                        {activeItem.title || 'Bài học không có tiêu đề'}
                    </div>

                    <div className="text-xs text-ink-500 mt-1 font-mono flex items-center gap-1">
                        <Clock size={11} />
                        {Math.round((activeItem.duration ?? 0) / 60)} min
                    </div>
                </div>
            </div>
        </div>
    );
};
const emptyTemp = (idx = 1): TempLesson => ({
    tempId: uuidv4(),
    title: '',
    videoId: '',
    duration: null,
    thumbnailUrl: null,
    orderIndex: idx,
    isActive: true,
});


const SortableLesson: React.FC<{
    item: TempLesson;
    errors: Record<string, any>;
    refs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
    updateItemField: (tempId: string, field: keyof TempLesson, value: any) => void;
    deleteItem: (tempId: string) => void;
    onVideoIdChange: (tempId: string, videoId: string) => void;
}> = ({item, errors, refs, updateItemField, deleteItem, onVideoIdChange}) => {
    const [fetchingDuration, setFetchingDuration] = useState(false);
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({id: item.tempId});

    // Auto-fetch title + duration + thumbnail khi videoId thay đổi
    useEffect(() => {
        const id = item.videoId?.trim();
        if (!id || id.length < 6) return;
        let cancelled = false;
        setFetchingDuration(true);
        fetchYouTubeMeta(id).then(meta => {
            if (cancelled || !meta) return;
            if (meta.duration) updateItemField(item.tempId, 'duration', meta.duration);
            if (meta.title && !item.title) updateItemField(item.tempId, 'title', meta.title);
            if (meta.thumbnailUrl && !item.thumbnailUrl) updateItemField(item.tempId, 'thumbnailUrl', meta.thumbnailUrl);
            setFetchingDuration(false);
        });
        return () => { cancelled = true; };
    }, [item.videoId]);
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition: transition || undefined,
        touchAction: 'none',
    };


    return (
        <div
            ref={setNodeRef}
            style={style}
            aria-hidden={isDragging}
            className={`group flex items-start gap-3 p-3 border border-ink-200 rounded-xl bg-white hover:border-primary-300 hover:shadow-soft transition-all ${isDragging ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}
        >
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-ink-300 hover:text-ink-600 transition-colors p-1 -ml-1"
                aria-label="Drag to reorder"
            >
                <GripVertical size={16}/>
            </button>

            <div className="flex-1 grid grid-cols-12 gap-3 items-center">

                <div className="col-span-7 space-y-2">
                    <label className="block text-xs font-semibold text-ink-600">Tiêu đề</label>
                    <input
                        ref={el => {
                            refs.current[`${item.tempId}-title`] = el
                        }}
                        value={item.title}
                        onChange={e => updateItemField(item.tempId, 'title', e.target.value)}
                        className={`w-full border rounded-lg px-3 py-2 text-sm font-semibold text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-300 ${errors[item.tempId]?.title ? 'border-rose-300 ring-rose-100' : 'border-ink-200'}`}
                        placeholder="Tiêu đề bài học"
                    />
                    {errors[item.tempId]?.title &&
                        <p className="text-rose-600 text-xs mt-1">{errors[item.tempId].title}</p>}

                    <label className="block text-xs font-semibold text-ink-600 mt-3">YouTube URL hoặc Video ID</label>
                    <input
                        ref={el => { refs.current[`${item.tempId}-videoId`] = el }}
                        value={item.videoId}
                        onChange={e => onVideoIdChange(item.tempId, parseYouTubeId(e.target.value))}
                        className={`w-full border rounded-lg px-3 py-2 text-sm font-mono text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-300 ${errors[item.tempId]?.videoId ? 'border-rose-300 ring-rose-100' : 'border-ink-200'}`}
                        placeholder="https://youtube.com/watch?v=... hoặc ID"
                    />
                    {errors[item.tempId]?.videoId &&
                        <p className="text-rose-600 text-xs mt-1">{errors[item.tempId].videoId}</p>}
                    {fetchingDuration && (
                        <p className="text-xs text-primary-500 mt-1 flex items-center gap-1">
                            <Clock size={11} className="animate-spin" /> Đang lấy thời lượng...
                        </p>
                    )}
                    {item.videoId && (
                        <div className="mt-2 rounded-lg overflow-hidden border border-ink-200 aspect-video">
                            <iframe
                                src={`https://www.youtube.com/embed/${item.videoId}`}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title="preview"
                            />
                        </div>
                    )}

                    <div className="flex gap-2 mt-3">
                        <div className="flex-1">
                            <label className="flex text-xs font-semibold text-ink-600 mb-1 items-center gap-1">
                                <Clock size={12}/>
                                Thời lượng
                            </label>
                            <div className={`w-full border rounded-lg px-3 py-2 text-sm font-mono text-ink-900 bg-ink-50 ${errors[item.tempId]?.duration ? 'border-rose-300' : 'border-ink-200'}`}>
                                {item.duration
                                    ? `${Math.floor(item.duration / 60)}p ${item.duration % 60}s`
                                    : <span className="text-ink-400 text-xs">Tự động từ video</span>
                                }
                            </div>
                        </div>

                        <div className="flex-1">
                            <label className="flex text-xs font-semibold text-ink-600 mb-1 items-center gap-1">
                                <ImageIcon size={12}/>
                                Thumbnail
                            </label>
                            <input
                                ref={el => {
                                    refs.current[`${item.tempId}-thumbnailUrl`] = el
                                }}
                                value={item.thumbnailUrl ?? ''}
                                onChange={e => updateItemField(item.tempId, 'thumbnailUrl', e.target.value || null)}
                                className={`w-full border rounded-lg px-3 py-2 text-xs font-mono text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-300 ${errors[item.tempId]?.thumbnailUrl ? 'border-rose-300 ring-rose-100' : 'border-ink-200'}`}
                                placeholder="https://..."
                                aria-label="Thumbnail url"
                            />
                        </div>
                    </div>
                </div>

                <div className="col-span-2 flex items-center justify-center">
                    {item.thumbnailUrl ? (
                        <img src={item.thumbnailUrl} alt="thumb" className="w-24 h-14 object-cover rounded-lg border border-ink-200"/>
                    ) : (
                        <div
                            className="w-24 h-14 flex items-center justify-center rounded-lg border border-dashed border-ink-200 text-ink-300">
                            <ImageIcon size={20}/>
                        </div>
                    )}
                </div>

                <div className="col-span-1 flex items-start pt-7 justify-end">
                    <button title="Delete" type="button" onClick={() => deleteItem(item.tempId)}
                            className="p-2 rounded-lg text-ink-500 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                        <Trash2 size={14}/>
                    </button>
                </div>
            </div>
        </div>
    );
};

const LessonFormDialog: React.FC<Props> = ({open, onClose, onCreate, onUpdate, editing}) => {
    // In edit mode we'll reuse the single-form behaviour
    const [singleForm, setSingleForm] = useState<LessonRequest>({
        orderIndex: 0,
        title: '',
        videoId: '',
        duration: 30 * 60,
        thumbnailUrl: null,
        isActive: true,
    } as LessonRequest);

    const [items, setItems] = useState<TempLesson[]>([emptyTemp(1)]);
    const [loading, setLoading] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    // errors: either per-field for single edit or per-item map for multi
    const [errors, setErrors] = useState<Record<string, any>>({});

    // refs map for focusing first error (optional)
    const refs = useRef<Record<string, HTMLInputElement | null>>({});

    useEffect(() => {
        if (editing) {
            setSingleForm({
                orderIndex: editing.orderIndex ?? 0,
                title: editing.title ?? '',
                videoId: editing.videoId ?? '',
                duration: editing.duration ?? 0,
                thumbnailUrl: editing.thumbnailUrl ?? null,
                isActive: editing.isActive ?? true,
            });
        } else {
            // reset to a single empty lesson when opening add dialog
            setItems([emptyTemp(1)]);
        }
    }, [editing, open]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (open) window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    // Auto-fetch title + duration + thumbnail cho single edit khi videoId thay đổi
    useEffect(() => {
        const id = singleForm.videoId?.trim();
        if (!id || id.length < 6) return;
        let cancelled = false;
        fetchYouTubeMeta(id).then(meta => {
            if (cancelled || !meta) return;
            setSingleForm(prev => ({
                ...prev,
                ...(meta.duration ? { duration: meta.duration } : {}),
                ...(meta.title && !prev.title ? { title: meta.title } : {}),
                ...(meta.thumbnailUrl && !prev.thumbnailUrl ? { thumbnailUrl: meta.thumbnailUrl } : {}),
            }));
        });
        return () => { cancelled = true; };
    }, [singleForm.videoId]);

    const recalcOrder = (list: TempLesson[]) => {
        return list.map((it, idx) => ({...it, orderIndex: idx + 1}));
    };

    const addItem = () => {
        setItems(prev => recalcOrder([...prev, emptyTemp(prev.length + 1)]));
    };

    const deleteItem = (tempId: string) => {
        setItems(prev => recalcOrder(prev.filter(i => i.tempId !== tempId)));
        setErrors(prev => {
            const next = {...prev};
            delete next[tempId];
            return next;
        });
    };

    const updateItemField = (tempId: string, field: keyof TempLesson, value: any) => {
        setItems(prev => prev.map(i => i.tempId === tempId ? {...i, [field]: value} : i));
        // clear field error
        setErrors(prev => {
            const next = {...prev};
            if (next[tempId]) {
                delete next[tempId][field];
                // if empty object remove
                if (Object.keys(next[tempId]).length === 0) delete next[tempId];
            }
            return next;
        });
    };

    const validateMulti = () => {
        const next: Record<string, Record<string, string>> = {};
        for (const it of items) {
            const e: Record<string, string> = {};
            if (!it.title || !it.title.trim()) e.title = 'Lesson title is required.';
            else if (it.title.trim().length > 200) e.title = 'Lesson title cannot exceed 200 characters.';

            if (!it.videoId || !it.videoId.trim()) e.videoId = 'VideoId is required.';
            else if (it.videoId.trim().length > 200) e.videoId = 'VideoId cannot exceed 200 characters.';

            if ((it.orderIndex ?? 0) < 0) e.orderIndex = 'OrderIndex must be >= 0.';
            if (it.duration != null && it.duration < 0) e.duration = 'Duration must be >= 0.';
            if (it.thumbnailUrl && it.thumbnailUrl.length > 500) e.thumbnailUrl = 'ThumbnailUrl cannot exceed 500 characters.';

            if (Object.keys(e).length) next[it.tempId] = e;
        }
        return next;
    };

    const validateSingle = () => {
        const next: Record<string, string> = {};
        if (!singleForm.title || !singleForm.title.trim()) next.title = 'Lesson title is required.';
        else if (singleForm.title.trim().length > 200) next.title = 'Lesson title cannot exceed 200 characters.';

        if (!singleForm.videoId || !singleForm.videoId.trim()) next.videoId = 'VideoId is required.';
        else if (singleForm.videoId.trim().length > 200) next.videoId = 'VideoId cannot exceed 200 characters.';

        if ((singleForm.orderIndex ?? 0) < 0) next.orderIndex = 'OrderIndex must be >= 0.';
        if (singleForm.duration != null && singleForm.duration < 0) next.duration = 'Duration must be >= 0.';
        if (singleForm.thumbnailUrl && singleForm.thumbnailUrl.length > 500) next.thumbnailUrl = 'ThumbnailUrl cannot exceed 500 characters.';

        return next;
    };

    const submitMulti = async () => {
        try {
            setLoading(true);
            setErrors({});
            const clientErrors = validateMulti();
            if (Object.keys(clientErrors).length) {
                setErrors(clientErrors);
                // focus first error if possible
                const firstId = Object.keys(clientErrors)[0];
                const fKey = Object.keys(clientErrors[firstId])[0];
                const refKey = `${firstId}-${fKey}`;
                const el = refs.current[refKey];
                if (el && typeof el.focus === 'function') el.focus();
                return;
            }

            const payloads: LessonRequest[] = items.map(i => ({
                orderIndex: i.orderIndex,
                title: i.title.trim(),
                videoId: i.videoId.trim(),
                duration: i.duration ?? undefined,
                thumbnailUrl: i.thumbnailUrl?.trim() ?? null,
                isActive: i.isActive ?? true,
            } as LessonRequest));

            await onCreate(payloads);
            onClose();
        } catch (err) {
            console.error(err);
            alert('Save failed');
        } finally {
            setLoading(false);
        }
    };

    const submitSingle = async () => {
        try {
            setLoading(true);
            setErrors({});
            const clientErrors = validateSingle();
            if (Object.keys(clientErrors).length) {
                setErrors(clientErrors);
                const firstKey = Object.keys(clientErrors)[0];
                const el = refs.current[firstKey];
                if (el && typeof el.focus === 'function') el.focus();
                return;
            }

            const payload: LessonRequest = {
                orderIndex: singleForm.orderIndex ?? 0,
                title: singleForm.title?.trim() ?? '',
                videoId: singleForm.videoId?.trim() ?? '',
                duration: singleForm.duration ?? undefined,
                thumbnailUrl: singleForm.thumbnailUrl?.trim() ?? null,
                isActive: singleForm.isActive ?? true,
            } as LessonRequest;

            if (editing && editing.id) {
                await onUpdate(editing.id, payload);
                onClose();
            }
        } catch (err) {
            console.error(err);
            alert('Save failed');
        } finally {
            setLoading(false);
        }
    };

    // dnd-kit sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {distance: 6}}),
        useSensor(KeyboardSensor)
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(String(event.active.id));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const {active, over} = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            setItems(prev => {
                const oldIndex = prev.findIndex(i => i.tempId === String(active.id));
                const newIndex = prev.findIndex(i => i.tempId === String(over.id));
                if (oldIndex === -1 || newIndex === -1) return prev;
                const next = arrayMove(prev, oldIndex, newIndex);
                return recalcOrder(next);
            });
        }
    };

    const handleDragCancel = () => setActiveId(null);

    if (!open) return null;

    const activeItem = activeId ? items.find(i => i.tempId === activeId) ?? null : null;

    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm"/>

            <div
                className="relative w-[720px] max-w-[95%] p-6 rounded-2xl shadow-lg bg-white border border-ink-200">

                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-ink-900">{editing ? 'Chỉnh sửa bài học' : 'Thêm bài học'}</h2>
                        <div className="h-1 w-20 mt-2 rounded-full"
                             style={{background: 'linear-gradient(90deg, #3b82f6, #06b6d4)'}}/>
                    </div>

                    <button onClick={onClose} aria-label="Close"
                            className="ml-3 p-2 rounded-lg text-ink-500 hover:text-ink-900 hover:bg-ink-100 transition-colors">
                        <X size={18}/>
                    </button>
                </div>

                {editing ? (
                    // single edit UI
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-semibold text-ink-600 mb-1.5">Tiêu đề</label>
                            <input ref={el => {
                                refs.current['title'] = el
                            }} value={singleForm.title ?? ''} onChange={e => {
                                setSingleForm({...singleForm, title: e.target.value});
                                setErrors(prev => {
                                    const next = {...prev};
                                    delete (next as any).title;
                                    return next;
                                });
                            }}
                                   className={`w-full border rounded-lg px-3 py-2 text-sm font-semibold text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-300 ${errors.title ? 'border-rose-300 ring-rose-100' : 'border-ink-200'}`}
                                   placeholder="Tiêu đề bài học"/>
                            {errors.title && <p className="text-rose-600 text-xs mt-1">{errors.title}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-ink-600 mb-1.5">YouTube URL hoặc Video ID</label>
                            <input ref={el => { refs.current['videoId'] = el }}
                                value={singleForm.videoId ?? ''}
                                onChange={e => {
                                    const id = parseYouTubeId(e.target.value);
                                    setSingleForm(prev => ({...prev, videoId: id}));
                                    setErrors(prev => { const next = {...prev}; delete (next as any).videoId; return next; });
                                }}
                                className={`w-full border rounded-lg px-3 py-2 text-sm font-mono text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-300 ${errors.videoId ? 'border-rose-300 ring-rose-100' : 'border-ink-200'}`}
                                placeholder="https://youtube.com/watch?v=... hoặc ID"
                            />
                            {errors.videoId && <p className="text-rose-600 text-xs mt-1">{errors.videoId}</p>}
                            {singleForm.videoId && (
                                <div className="mt-2 rounded-lg overflow-hidden border border-ink-200 aspect-video">
                                    <iframe
                                        src={`https://www.youtube.com/embed/${singleForm.videoId}`}
                                        className="w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        title="preview"
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-ink-600 mb-1.5 flex items-center gap-1">
                                <Clock size={12}/> Thời lượng
                            </label>
                            <div className="w-full border border-ink-200 rounded-lg px-3 py-2 text-sm font-mono text-ink-900 bg-ink-50">
                                {singleForm.duration
                                    ? `${Math.floor(singleForm.duration / 60)}p ${singleForm.duration % 60}s`
                                    : <span className="text-ink-400 text-xs">Tự động từ video</span>
                                }
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-ink-600 mb-1.5 flex items-center gap-1">
                                <ImageIcon size={12}/>
                                Thumbnail URL
                            </label>
                            <input ref={el => {
                                refs.current['thumbnailUrl'] = el
                            }} value={singleForm.thumbnailUrl ?? ''} onChange={e => {
                                setSingleForm({...singleForm, thumbnailUrl: e.target.value || null});
                                setErrors(prev => {
                                    const next = {...prev};
                                    delete (next as any).thumbnailUrl;
                                    return next;
                                });
                            }}
                                   className={`w-full border rounded-lg px-3 py-2 text-xs font-mono text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-300 ${errors.thumbnailUrl ? 'border-rose-300 ring-rose-100' : 'border-ink-200'}`}
                                   placeholder="https://..."/>
                            {errors.thumbnailUrl && <p className="text-rose-600 text-xs mt-1">{errors.thumbnailUrl}</p>}
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <input id="isActive" type="checkbox" checked={singleForm.isActive}
                                   onChange={e => setSingleForm({...singleForm, isActive: e.target.checked})}
                                   className="rounded border-ink-300"/>
                            <label htmlFor="isActive" className="text-sm font-semibold text-ink-700">Kích hoạt</label>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button onClick={onClose}
                                    className="flex-1 px-4 py-2 rounded-lg border border-ink-200 text-ink-700 font-semibold hover:bg-ink-50 transition-colors">Hủy
                            </button>
                            <button onClick={submitSingle} disabled={loading}
                                    className="flex-1 px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{loading ? 'Đang lưu...' : 'Lưu'}</button>
                        </div>
                    </div>
                ) : (
                    // multi-add UI
                    <div className="space-y-4">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onDragCancel={handleDragCancel}
                        >
                            <SortableContext items={items.map(i => i.tempId)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-3 max-h-[60vh] overflow-auto pr-2 touch-none">
                                    {items.map(item => (
                                        <SortableLesson key={item.tempId} item={item} errors={errors} refs={refs}
                                                        updateItemField={updateItemField} deleteItem={deleteItem}
                                                        onVideoIdChange={(tempId, id) => updateItemField(tempId, 'videoId', id)}/>
                                    ))}
                                </div>
                            </SortableContext>

                            {createPortal(
                                <DragOverlay
                                    dropAnimation={null}
                                    style={{
                                        pointerEvents: 'none',
                                    }}
                                    className="!z-[9999]"
                                >
                                    {activeItem ? (
                                        <div className="w-full max-w-[680px] pointer-events-none">
                                            <LessonDragOverlay activeItem={activeItem}/>
                                        </div>
                                    ) : null}
                                </DragOverlay>,
                                document.body
                            )}
                        </DndContext>

                        <div className="flex items-center gap-3 pt-2">
                            <button onClick={addItem} type="button"
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-ink-200 text-ink-700 font-semibold hover:bg-ink-50 transition-colors">
                                <Plus size={16}/>
                                <span>Thêm bài học</span>
                            </button>

                            <div className="flex-1"/>

                            <button onClick={onClose}
                                    className="px-4 py-2 rounded-lg border border-ink-200 text-ink-700 font-semibold hover:bg-ink-50 transition-colors">Hủy
                            </button>
                            <button onClick={submitMulti} disabled={loading}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{loading ? 'Đang lưu...' : 'Lưu tất cả'}</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LessonFormDialog;
