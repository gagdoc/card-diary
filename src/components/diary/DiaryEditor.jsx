import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Camera, ChevronLeft, Send, X, Plus, Star } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useDiary } from '../../context/DiaryContext';
import { DriveImage } from '../common/DriveImage';
import { GooglePhotoPicker } from '../common/GooglePhotoPicker';

export const DiaryEditor = ({ initialDate = new Date(), onClose }) => {
    const [date, setDate] = useState(initialDate);
    const dateInputRef = useRef(null);

    const handleDateChange = (e) => {
        const newDate = new Date(e.target.value + 'T12:00:00');
        if (!isNaN(newDate.getTime())) {
            setDate(newDate);
        }
    };

    const { getEntriesByDate, getEntriesByMonth, addEntry, updateEntry, deleteEntry } = useDiary();

    const [newImages, setNewImages] = useState([]);
    const [newContent, setNewContent] = useState('');
    const [newTitle, setNewTitle] = useState('');

    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [editTitle, setEditTitle] = useState('');
    const [editImages, setEditImages] = useState([]);

    const entries = getEntriesByDate(date).sort((a, b) => new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date));

    const handleImageUpload = (e, isEditing = false) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (isEditing) {
                    setEditImages(prev => [...prev, reader.result]);
                } else {
                    setNewImages(prev => [...prev, reader.result]);
                }
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
        if (isEditing) {
            setEditImages(prev => [...prev, ...photos]);
        } else {
            setNewImages(prev => [...prev, ...photos]);
        }
    };

    const handleSave = () => {
        if (!newContent.trim() && newImages.length === 0) return;
        addEntry({
            date: date.toISOString(),
            images: newImages,
            imageUrl: newImages.length > 0 ? newImages[0] : null,
            title: newTitle,
            content: newContent,
            tags: []
        });
        setNewImages([]);
        setNewContent('');
        setNewTitle('');
    };

    const startEditing = (entry) => {
        setEditingId(entry.id);
        setEditTitle(entry.title || '');
        setEditContent(entry.content || '');
        setEditImages(entry.images || (entry.imageUrl ? [entry.imageUrl] : []));
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditTitle('');
        setEditContent('');
        setEditImages([]);
    };

    const saveEditing = (id) => {
        updateEntry(id, {
            title: editTitle,
            content: editContent,
            images: editImages,
            imageUrl: editImages.length > 0 ? editImages[0] : null
        });
        setEditingId(null);
        setEditImages([]);
    };

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
        return (
            <div className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x scrollbar-hide">
                {images.map((img, index) => (
                    <div key={index} className="relative group flex-shrink-0 snap-center">
                        <div className={cn(
                            "rounded-3xl overflow-hidden border border-gray-100 shadow-sm",
                            isInputArea ? "w-28 h-28" : "w-64 h-64 sm:w-80 sm:h-80"
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
            {/* Header */}
            <header className="px-8 py-6 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between z-10">
                <button
                    onClick={onClose}
                    className="p-3 hover:bg-gray-100 rounded-2xl transition-all shadow-sm border border-transparent hover:border-gray-200 group"
                >
                    <ChevronLeft className="w-6 h-6 text-gray-400 group-hover:text-gray-900" />
                </button>
                <div className="text-center relative cursor-pointer group">
                    <h2 className="text-2xl font-black font-outfit tracking-tighter text-gray-900 leading-none">
                        {format(date, 'MMMM d')}
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
                <div className="w-12 h-12" />
            </header>

            {/* Daily Feed */}
            <div className="flex-1 overflow-y-auto px-6 md:px-12 py-10 scrollbar-hide">
                <div className="max-w-3xl mx-auto space-y-12 pb-40">
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
                                    <div className="flex gap-8 items-start">
                                        <div className="hidden sm:flex flex-col items-center pt-2">
                                            <div className="w-3 h-3 rounded-full border-2 border-black bg-white ring-4 ring-gray-100"></div>
                                            <div className="w-[2px] h-full bg-gray-100 mt-2 min-h-[100px] group-last:bg-transparent"></div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-6">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                    {entry.createdAt ? format(new Date(entry.createdAt), 'h:mm a') : format(new Date(entry.date), 'h:mm a')}
                                                </span>
                                                <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {editingId === entry.id ? (
                                                        <>
                                                            <button onClick={() => saveEditing(entry.id)} className="text-[10px] font-black text-blue-600 tracking-wider">SAVE</button>
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
                                                <div className="space-y-4 bg-white p-8 rounded-[32px] premium-shadow border border-gray-100">
                                                    <input
                                                        type="text"
                                                        value={editTitle}
                                                        onChange={(e) => setEditTitle(e.target.value)}
                                                        className="w-full text-2xl font-black font-outfit border-none focus:ring-0 p-0 text-gray-900 placeholder:text-gray-200"
                                                        placeholder="Moment Title"
                                                    />
                                                    <textarea
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        className="w-full text-lg leading-relaxed text-gray-600 border-none focus:ring-0 p-0 min-h-[120px] resize-none placeholder:text-gray-200"
                                                        placeholder="What happened?"
                                                    />
                                                    {renderImageCarousel(editImages, true, false)}
                                                    <div className="flex gap-3 pt-4 border-t border-gray-50">
                                                        <label className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl cursor-pointer transition-colors text-gray-400">
                                                            <Camera className="w-5 h-5" />
                                                            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(e, true)} />
                                                        </label>
                                                        <GooglePhotoPicker onSelect={(photos) => handleGooglePhotoSelect(photos, true)} className="bg-gray-50 text-gray-400" />
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
            <div className="absolute bottom-10 inset-x-0 px-6 z-20">
                <div className="max-w-3xl mx-auto">
                    <AnimatePresence>
                        {newImages.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="mb-4 bg-white/80 backdrop-blur-3xl p-4 rounded-[32px] border border-white/20 shadow-2xl"
                            >
                                {renderImageCarousel(newImages, false, true)}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="bg-white rounded-[32px] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col group focus-within:ring-2 ring-black/5 transition-all">
                        <div className="px-6 pt-4 pb-2">
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                className="w-full border-none focus:ring-0 p-0 text-lg font-bold font-outfit text-gray-900 placeholder:text-gray-300"
                                placeholder="Give this moment a name..."
                            />
                            <textarea
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                                className="w-full border-none focus:ring-0 p-0 text-gray-600 mt-2 min-h-[80px] resize-none leading-relaxed placeholder:text-gray-300"
                                placeholder="Describe what's on your mind..."
                            />
                        </div>
                        <div className="flex items-center justify-between p-2 mt-2 bg-gray-50/50 rounded-[24px]">
                            <div className="flex items-center gap-1 pl-2">
                                <label className="p-3 hover:bg-white rounded-2xl cursor-pointer transition-all text-gray-400 hover:text-gray-900">
                                    <Camera className="w-6 h-6" />
                                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(e, false)} />
                                </label>
                                <GooglePhotoPicker onSelect={(photos) => handleGooglePhotoSelect(photos, false)} className="hover:bg-white text-gray-400 hover:text-gray-900" />
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={!newContent.trim() && newImages.length === 0}
                                className="h-14 w-14 bg-black text-white rounded-[20px] flex items-center justify-center hover:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-300 transition-all shadow-lg active:scale-95"
                            >
                                <Send className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
