import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { AlertCircle, Camera, Check, ChevronLeft, Cloud, Loader, Send, X, Plus, Star } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useDiary } from '../../context/DiaryContext';
import { DriveImage } from '../common/DriveImage';
import { GooglePhotoPicker } from '../common/GooglePhotoPicker';
import { GoogleDrivePicker } from '../common/GoogleDrivePicker';

const MAX_IMAGES_PER_ENTRY = 5;

export const DiaryEditor = ({ initialDate = new Date(), initialEditingEntryId = null, onClose }) => {
    const [date, setDate] = useState(initialDate);
    const dateInputRef = useRef(null);

    const handleDateChange = (e) => {
        const newDate = new Date(e.target.value + 'T12:00:00');
        if (!isNaN(newDate.getTime())) {
            setDate(newDate);
        }
    };

    const { getEntriesByDate, getEntriesByMonth, addEntry, updateEntry, deleteEntry, syncStatus, syncError, lastSavedAt } = useDiary();

    const [newImages, setNewImages] = useState([]);
    const [newContent, setNewContent] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [saveFeedback, setSaveFeedback] = useState('idle');
    const [completionModal, setCompletionModal] = useState(null);
    const saveFeedbackTimeoutRef = useRef(null);
    const completionModalTimeoutRef = useRef(null);

    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [editTitle, setEditTitle] = useState('');
    const [editImages, setEditImages] = useState([]);

    const entries = getEntriesByDate(date).sort((a, b) => new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date));
    const canSaveNewEntry = newTitle.trim() || newContent.trim() || newImages.length > 0;

    React.useEffect(() => {
        return () => {
            if (saveFeedbackTimeoutRef.current) {
                clearTimeout(saveFeedbackTimeoutRef.current);
            }
            if (completionModalTimeoutRef.current) {
                clearTimeout(completionModalTimeoutRef.current);
            }
        };
    }, []);

    React.useEffect(() => {
        if (!initialEditingEntryId || editingId) return;
        const entry = entries.find(item => item.id === initialEditingEntryId);
        if (entry) startEditing(entry);
    }, [initialEditingEntryId, entries, editingId]);

    const appendImages = (incomingImages, isEditing = false) => {
        const setImages = isEditing ? setEditImages : setNewImages;

        setImages(prev => {
            const remainingSlots = MAX_IMAGES_PER_ENTRY - prev.length;
            if (remainingSlots <= 0) return prev;
            return [...prev, ...incomingImages.slice(0, remainingSlots)];
        });
    };

    const handleImageUpload = (e, isEditing = false) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const currentCount = isEditing ? editImages.length : newImages.length;
        const filesToRead = files.slice(0, Math.max(MAX_IMAGES_PER_ENTRY - currentCount, 0));

        filesToRead.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                appendImages([reader.result], isEditing);
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    };

    const removeImage = (index, isEditing = false) => {
        if (isEditing) {
            setEditImages(prev => prev.filter((_, i) => i !== index));
        } else {
            setNewImages(prev => prev.filter((_, i) => i !== index));
        }
    };

    const handleGooglePhotoSelect = (photos, isEditing = false) => {
        appendImages(photos, isEditing);
        if (photos.length > 0) {
            showCompletionModal({
                title: '사진 추가 완료',
                message: `${Math.min(photos.length, MAX_IMAGES_PER_ENTRY)}장의 사진을 다이어리에 담았어요.`,
            });
        }
    };

    const showCompletionModal = ({ title, message }) => {
        setCompletionModal({ title, message });
        if (completionModalTimeoutRef.current) {
            clearTimeout(completionModalTimeoutRef.current);
        }
        completionModalTimeoutRef.current = setTimeout(() => setCompletionModal(null), 1800);
    };

    const showSavedFeedback = () => {
        setSaveFeedback('saved');
        if (saveFeedbackTimeoutRef.current) {
            clearTimeout(saveFeedbackTimeoutRef.current);
        }
        saveFeedbackTimeoutRef.current = setTimeout(() => setSaveFeedback('idle'), 1400);
    };

    const handleSave = () => {
        if (!canSaveNewEntry || saveFeedback === 'saving') return;
        setSaveFeedback('saving');
        const images = newImages.slice(0, MAX_IMAGES_PER_ENTRY);
        addEntry({
            date: date.toISOString(),
            images,
            imageUrl: images.length > 0 ? images[0] : null,
            title: newTitle,
            content: newContent,
            tags: []
        });
        setNewImages([]);
        setNewContent('');
        setNewTitle('');
        showSavedFeedback();
        showCompletionModal({
            title: '저장 완료',
            message: '오늘의 순간이 안전하게 기록되었습니다.',
        });
    };

    const startEditing = (entry) => {
        setEditingId(entry.id);
        setEditTitle(entry.title || '');
        setEditContent(entry.content || '');
        setEditImages((entry.images || (entry.imageUrl ? [entry.imageUrl] : [])).slice(0, MAX_IMAGES_PER_ENTRY));
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditTitle('');
        setEditContent('');
        setEditImages([]);
    };

    const saveEditing = (id) => {
        setSaveFeedback('saving');
        const images = editImages.slice(0, MAX_IMAGES_PER_ENTRY);
        updateEntry(id, {
            title: editTitle,
            content: editContent,
            images,
            imageUrl: images.length > 0 ? images[0] : null
        });
        setEditingId(null);
        setEditImages([]);
        showSavedFeedback();
        showCompletionModal({
            title: '수정 완료',
            message: '변경한 내용이 다이어리에 반영되었습니다.',
        });
    };

    const getSyncLabel = () => {
        if (saveFeedback === 'saving') return { icon: Loader, text: '저장 중', className: 'text-blue-600 bg-blue-50' };
        if (syncStatus === 'pending') return { icon: Loader, text: '저장 준비 중', className: 'text-blue-600 bg-blue-50' };
        if (syncStatus === 'syncing') return { icon: Cloud, text: 'Drive 동기화 중', className: 'text-blue-600 bg-blue-50' };
        if (syncStatus === 'error') return { icon: AlertCircle, text: '저장 실패', className: 'text-red-600 bg-red-50' };
        if (saveFeedback === 'saved' || syncStatus === 'saved') return { icon: Check, text: lastSavedAt ? '저장됨' : '로컬 저장됨', className: 'text-emerald-600 bg-emerald-50' };
        return null;
    };

    const syncLabel = getSyncLabel();
    const SyncIcon = syncLabel?.icon;
    const hasActiveEdit = Boolean(editingId);

    const toggleCover = (entry) => {
        const monthEntries = getEntriesByMonth(new Date(entry.date).getFullYear(), new Date(entry.date).getMonth());
        if (entry.isCover) {
            updateEntry(entry.id, { isCover: false });
        } else {
            monthEntries.forEach(e => e.isCover && updateEntry(e.id, { isCover: false }));
            updateEntry(entry.id, { isCover: true });
        }
    };

    const renderImageCarousel = (images, isEditingMode = false, isInputArea = false) => {
        if (!images || images.length === 0) return null;

        if (isInputArea) {
            return (
                <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
                    {images.map((img, index) => (
                        <div key={index} className="relative group min-w-0">
                            <div className="aspect-square overflow-hidden rounded-xl sm:rounded-2xl border border-gray-100 bg-gray-50 shadow-sm">
                                <DriveImage src={img} alt={`Moment ${index}`} className="w-full h-full object-cover" />
                            </div>
                            <button
                                onClick={() => removeImage(index, false)}
                                className="absolute -top-1.5 -right-1.5 bg-black text-white rounded-full p-1.5 shadow-lg transform hover:scale-110 transition-transform"
                                title="이미지 삭제"
                            >
                                <X className="w-2.5 h-2.5" />
                            </button>
                        </div>
                    ))}
                </div>
            );
        }

        if (isEditingMode && !isInputArea) {
            return (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {images.map((img, index) => (
                        <div key={index} className="relative group">
                            <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 shadow-sm">
                                <DriveImage src={img} alt={`Moment ${index}`} className="w-full h-full object-cover" />
                            </div>
                            <button
                                onClick={() => removeImage(index, true)}
                                className="absolute -top-2 -right-2 bg-black text-white rounded-full p-2 shadow-lg transform hover:scale-110 transition-transform"
                                title="이미지 삭제"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 gap-3 pb-4 pt-2 sm:flex sm:gap-4 sm:overflow-x-auto sm:pb-6 sm:snap-x sm:scrollbar-hide">
                {images.map((img, index) => (
                    <div key={index} className="relative group min-w-0 sm:flex-shrink-0 sm:snap-center">
                        <div className={cn(
                            "overflow-hidden border border-gray-100 shadow-sm",
                            "w-full aspect-[4/3] rounded-2xl sm:w-64 sm:h-64 sm:aspect-auto sm:rounded-3xl md:w-80 md:h-80"
                        )}>
                            <DriveImage src={img} alt={`Moment ${index}`} className="w-full h-full object-cover" />
                        </div>
                        {(isEditingMode || isInputArea) && (
                            <button
                                onClick={() => removeImage(index, isEditingMode)}
                                className="absolute -top-2 -right-2 bg-black text-white rounded-full p-2 shadow-lg transform hover:scale-110 transition-transform"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="fixed inset-0 z-50 bg-[#f8f9fa] flex flex-col overflow-hidden"
        >
            <AnimatePresence>
                {completionModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/20 backdrop-blur-sm px-6"
                        onClick={() => setCompletionModal(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 18, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 12, scale: 0.98 }}
                            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                            className="w-full max-w-sm rounded-[28px] sm:rounded-[32px] bg-white p-6 sm:p-8 text-center shadow-[0_30px_80px_rgba(15,23,42,0.22)] border border-white/70"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="mx-auto mb-5 sm:mb-6 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_18px_35px_rgba(5,150,105,0.28)]">
                                <Check className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={3} />
                            </div>
                            <h3 className="text-2xl sm:text-3xl font-black font-outfit tracking-tight text-gray-900">
                                {completionModal.title}
                            </h3>
                            <p className="mt-3 text-sm sm:text-base font-medium leading-relaxed text-gray-500">
                                {completionModal.message}
                            </p>
                            <button
                                onClick={() => setCompletionModal(null)}
                                className="mt-6 sm:mt-7 h-12 w-full rounded-2xl bg-black text-sm font-black tracking-wider text-white transition-colors hover:bg-gray-800 active:scale-[0.98]"
                            >
                                확인
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="px-4 sm:px-8 py-3 sm:py-6 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between z-10 shrink-0">
                <button
                    onClick={onClose}
                    className="p-2.5 sm:p-3 hover:bg-gray-100 rounded-2xl transition-all shadow-sm border border-transparent hover:border-gray-200 group"
                >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-gray-900" />
                </button>
                <div className="text-center relative cursor-pointer group">
                    <h2 className="text-xl sm:text-2xl font-black font-outfit tracking-tighter text-gray-900 leading-none">
                        {format(date, 'M월 d일')}
                    </h2>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mt-1">
                        {date.getFullYear() === new Date().getFullYear() ? format(date, 'EEEE') : format(date, 'EEEE, yyyy')}
                    </p>
                    <input
                        ref={dateInputRef}
                        type="date"
                        value={format(date, 'yyyy-MM-dd')}
                        onChange={handleDateChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </div>
                <div className="w-12 sm:w-36 flex justify-end">
                    {syncLabel ? (
                        <div
                            className={cn("inline-flex items-center gap-1.5 sm:gap-2 rounded-full px-2.5 sm:px-3 py-2 text-[10px] font-black tracking-wider", syncLabel.className)}
                            title={syncError || undefined}
                        >
                            <SyncIcon className={cn("w-3.5 h-3.5", (saveFeedback === 'saving' || syncStatus === 'pending') && "animate-spin")} />
                            <span className="hidden sm:inline">{syncLabel.text}</span>
                        </div>
                    ) : (
                        <div className="w-12 h-12" />
                    )}
                </div>
            </header>

            {/* Daily Feed */}
            <div className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-12 py-4 sm:py-10 scrollbar-hide">
                <div className="max-w-3xl mx-auto space-y-12 pb-6">
                    {entries.length === 0 ? (
                        <div className="text-center py-32 space-y-6 opacity-30">
                            <div className="w-24 h-24 bg-gray-100 rounded-[40px] flex items-center justify-center mx-auto">
                                <Plus className="w-10 h-10 text-gray-300" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold font-outfit text-gray-400">Capture a moment</h3>
                                <p className="text-sm font-medium">Every day has a story worth telling.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-16">
                            {entries.map((entry, index) => (
                                <motion.div
                                    key={entry.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group relative"
                                >
                                    <div className="flex gap-4 sm:gap-8 items-start">
                                        <div className="hidden sm:flex flex-col items-center pt-2">
                                            <div className="w-3 h-3 rounded-full border-2 border-black bg-white ring-4 ring-gray-100"></div>
                                            <div className="w-[2px] h-full bg-gray-100 mt-2 min-h-[100px] group-last:bg-transparent"></div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-6">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                    {entry.createdAt ? format(new Date(entry.createdAt), 'h:mm a') : format(new Date(entry.date), 'h:mm a')}
                                                </span>
                                                <div className={cn("flex gap-3 sm:gap-4 opacity-100 transition-opacity", editingId === entry.id ? "hidden" : "sm:opacity-0 sm:group-hover:opacity-100")}>
                                                    {editingId === entry.id ? (
                                                        <>
                                                            <button onClick={() => saveEditing(entry.id)} disabled={saveFeedback === 'saving'} className="inline-flex items-center gap-1.5 text-[10px] font-black text-blue-600 tracking-wider disabled:opacity-60">
                                                                {saveFeedback === 'saving' ? <Loader className="w-3 h-3 animate-spin" /> : null}
                                                                SAVE
                                                            </button>
                                                            <button onClick={cancelEditing} className="text-[10px] font-black text-gray-400 tracking-wider">CANCEL</button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => startEditing(entry)} className="text-[10px] font-black text-gray-400 hover:text-gray-900 tracking-wider">EDIT</button>
                                                            <button onClick={() => deleteEntry(entry.id)} className="text-[10px] font-black text-gray-300 hover:text-red-500 tracking-wider">DELETE</button>
                                                            <button onClick={() => toggleCover(entry)} className={cn("transition-colors", entry.isCover ? "text-yellow-500" : "text-gray-200 hover:text-yellow-500")}>
                                                                <Star className="w-4 h-4" fill={entry.isCover ? "currentColor" : "none"} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {editingId === entry.id ? (
                                                <div className="space-y-4 sm:space-y-5 bg-white p-3 sm:p-6 md:p-8 rounded-[24px] sm:rounded-[32px] premium-shadow border border-gray-100">
                                                    <div className="sticky top-0 -mx-3 sm:-mx-6 md:-mx-8 -mt-3 sm:-mt-6 md:-mt-8 px-3 sm:px-6 md:px-8 py-3 sm:py-4 bg-white/95 backdrop-blur-xl border-b border-gray-100 rounded-t-[24px] sm:rounded-t-[32px] z-10 flex items-center justify-between gap-2">
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Editing</p>
                                                            <p className="text-xs sm:text-sm font-bold text-gray-900">사진 {editImages.length}/{MAX_IMAGES_PER_ENTRY}</p>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                                            <button
                                                                onClick={cancelEditing}
                                                                className="h-10 sm:h-11 px-3 sm:px-4 rounded-2xl bg-gray-100 text-[11px] sm:text-xs font-black tracking-wider text-gray-500 hover:bg-gray-200 transition-colors"
                                                            >
                                                                취소
                                                            </button>
                                                            <button
                                                                onClick={() => saveEditing(entry.id)}
                                                                disabled={saveFeedback === 'saving'}
                                                                className="h-10 sm:h-11 px-3 sm:px-5 rounded-2xl bg-black text-[11px] sm:text-xs font-black tracking-wider text-white hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 transition-colors inline-flex items-center gap-1.5 sm:gap-2"
                                                            >
                                                                {saveFeedback === 'saving' ? <Loader className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                                저장
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={editTitle}
                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                        className="w-full text-lg sm:text-2xl font-black font-outfit border-none focus:ring-0 p-0 text-gray-900 placeholder:text-gray-200"
                                                        placeholder="Moment Title"
                                                    />
                                                    <textarea
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        className="w-full text-sm sm:text-lg leading-relaxed text-gray-600 border-none focus:ring-0 p-0 min-h-[72px] sm:min-h-[96px] resize-none placeholder:text-gray-200"
                                                        placeholder="What happened?"
                                                    />
                                                    {renderImageCarousel(editImages, true, false)}
                                                    <div className="flex items-center justify-between gap-2 pt-3 sm:pt-4 border-t border-gray-50">
                                                        <div className="flex flex-wrap gap-1.5 sm:gap-3 min-w-0">
                                                            <label className={cn("p-2.5 sm:p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl cursor-pointer transition-colors text-gray-400", editImages.length >= MAX_IMAGES_PER_ENTRY && "opacity-40 pointer-events-none")}>
                                                                <Camera className="w-5 h-5" />
                                                                <input type="file" accept="image/*" multiple className="hidden" disabled={editImages.length >= MAX_IMAGES_PER_ENTRY} onChange={(e) => handleImageUpload(e, true)} />
                                                            </label>
                                                            <GooglePhotoPicker onSelect={(photos) => handleGooglePhotoSelect(photos, true)} disabled={editImages.length >= MAX_IMAGES_PER_ENTRY} className="bg-gray-50 text-gray-400 disabled:opacity-40 !p-2.5 sm:!p-3" />
                                                            <GoogleDrivePicker onSelect={(photos) => handleGooglePhotoSelect(photos, true)} disabled={editImages.length >= MAX_IMAGES_PER_ENTRY} className="bg-gray-50 text-gray-400 disabled:opacity-40 !p-2.5 sm:!p-3" />
                                                        </div>
                                                        <span className="text-[10px] font-black text-gray-300 tracking-wider">{editImages.length}/{MAX_IMAGES_PER_ENTRY}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-6">
                                                    {entry.title && (
                                                        <h3 className="text-3xl font-black font-outfit text-gray-900 tracking-tight leading-tight">{entry.title}</h3>
                                                    )}
                                                    <p className="text-lg leading-relaxed text-gray-600 whitespace-pre-wrap">{entry.content}</p>
                                                    {renderImageCarousel(entry.images || (entry.imageUrl ? [entry.imageUrl] : []), false, false)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Premium Input Bar */}
            {!hasActiveEdit && (
            <div className="shrink-0 px-3 sm:px-6 pt-2 sm:pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-[calc(1rem+env(safe-area-inset-bottom))] z-20 bg-gradient-to-t from-[#f8f9fa] via-[#f8f9fa]/95 to-[#f8f9fa]/0">
                <div className="max-w-3xl mx-auto">
                    <AnimatePresence>
                        {syncStatus === 'error' && syncError && (
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 12 }}
                                className="mb-3 flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600"
                            >
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{syncError}</span>
                            </motion.div>
                        )}
                        {newImages.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="mb-1.5 sm:mb-2 bg-white/80 backdrop-blur-3xl p-1.5 sm:p-3 rounded-[18px] sm:rounded-[28px] border border-white/20 shadow-2xl"
                            >
                                {renderImageCarousel(newImages, false, true)}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="bg-white rounded-[20px] sm:rounded-[32px] p-1.5 sm:p-2 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col group focus-within:ring-2 ring-black/5 transition-all">
                        <div className="px-3 sm:px-6 pt-2 sm:pt-3 pb-1.5 sm:pb-2">
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                className="w-full border-none focus:ring-0 p-0 text-sm sm:text-lg font-bold font-outfit text-gray-900 placeholder:text-gray-300"
                                placeholder="Give this moment a name..."
                            />
                            <textarea
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                                className="w-full border-none focus:ring-0 p-0 text-sm sm:text-base text-gray-600 mt-1.5 sm:mt-2 min-h-[34px] sm:min-h-[56px] max-h-20 sm:max-h-28 resize-none leading-relaxed placeholder:text-gray-300"
                                placeholder="Describe what's on your mind..."
                            />
                        </div>
                        <div className="flex items-center justify-between gap-2 p-1.5 sm:p-2 mt-1 bg-gray-50/50 rounded-[18px] sm:rounded-[24px]">
                            <div className="flex items-center gap-1 min-w-0">
                                <label className={cn("p-2.5 sm:p-3 hover:bg-white rounded-2xl cursor-pointer transition-all text-gray-400 hover:text-gray-900 flex-shrink-0", newImages.length >= MAX_IMAGES_PER_ENTRY && "opacity-40 pointer-events-none")}>
                                    <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
                                    <input type="file" accept="image/*" multiple className="hidden" disabled={newImages.length >= MAX_IMAGES_PER_ENTRY} onChange={(e) => handleImageUpload(e, false)} />
                                </label>
                                <GooglePhotoPicker onSelect={(photos) => handleGooglePhotoSelect(photos, false)} disabled={newImages.length >= MAX_IMAGES_PER_ENTRY} className="hover:bg-white text-gray-400 hover:text-gray-900 disabled:opacity-40 !p-2.5 sm:!p-3" />
                                <GoogleDrivePicker onSelect={(photos) => handleGooglePhotoSelect(photos, false)} disabled={newImages.length >= MAX_IMAGES_PER_ENTRY} className="hover:bg-white text-gray-400 hover:text-gray-900 disabled:opacity-40 !p-2.5 sm:!p-3" />
                                <span className="text-[10px] font-black text-gray-300 tracking-wider px-1 flex-shrink-0">{newImages.length}/{MAX_IMAGES_PER_ENTRY}</span>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={!canSaveNewEntry || saveFeedback === 'saving'}
                                className="h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 bg-black text-white rounded-[18px] sm:rounded-[20px] flex items-center justify-center hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-300 transition-all shadow-lg active:scale-95"
                                title={saveFeedback === 'saving' ? '저장 중' : saveFeedback === 'saved' ? '저장됨' : '저장'}
                            >
                                {saveFeedback === 'saving' ? (
                                    <Loader className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                                ) : saveFeedback === 'saved' ? (
                                    <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                                ) : (
                                    <Send className="w-5 h-5 sm:w-6 sm:h-6" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            )}
        </motion.div>
    );
};
