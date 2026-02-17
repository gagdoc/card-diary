import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Camera, MapPin, Cloud, Hash, ChevronLeft, Bold, Italic, Underline, AlignLeft, Send, Trash2, X, Plus, Calendar, Star } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useDiary } from '../../context/DiaryContext';
import { useAuth } from '../../context/AuthContext';
import { DriveImage } from '../common/DriveImage';
import { GooglePhotoPicker } from '../common/GooglePhotoPicker';


export const DiaryEditor = ({ initialDate = new Date(), onClose }) => {
    // This component now acts as a "Daily Feed"
    const [date, setDate] = useState(initialDate);
    const dateInputRef = useRef(null);

    const handleDateChange = (e) => {
        const newDate = new Date(e.target.value + 'T12:00:00');
        if (!isNaN(newDate.getTime())) {
            setDate(newDate);
        }
    };
    const { getEntriesByDate, getEntriesByMonth, addEntry, updateEntry, deleteEntry } = useDiary();

    // State for the NEW entry input
    const [newImages, setNewImages] = useState([]);
    const [newContent, setNewContent] = useState('');
    const [newTitle, setNewTitle] = useState(''); // Optional title for small moments


    // Editing State
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [editTitle, setEditTitle] = useState('');
    const [editImages, setEditImages] = useState([]);

    // Fetch entries for this day
    const entries = getEntriesByDate(date).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

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
        // Clear input value to allow re-uploading the same file if needed (though difficult with multiple)
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

        try {
            addEntry({
                date: date.toISOString(),
                images: newImages,
                imageUrl: newImages.length > 0 ? newImages[0] : null, // Backward compatibility
                title: newTitle,
                content: newContent,
                tags: []
            });

            // Reset input fields
            setNewImages([]);
            setNewContent('');
            setNewTitle('');
        } catch (error) {
            console.error('Error saving entry:', error);
            alert('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
    };

    const startEditing = (entry) => {
        setEditingId(entry.id);
        setEditTitle(entry.title || '');
        setEditContent(entry.content || '');
        // Initialize editImages from entry.images OR entry.imageUrl
        const existingImages = entry.images || (entry.imageUrl ? [entry.imageUrl] : []);
        setEditImages(existingImages);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditTitle('');
        setEditContent('');
        setEditImages([]);
    };

    const toggleCover = (entry) => {
        const entryDate = new Date(entry.date);
        const monthEntries = getEntriesByMonth(entryDate.getFullYear(), entryDate.getMonth());

        // If this entry is already cover, remove it
        if (entry.isCover) {
            updateEntry(entry.id, { isCover: false });
        } else {
            // Remove cover from any other entry in the same month
            monthEntries.forEach(e => {
                if (e.isCover) {
                    updateEntry(e.id, { isCover: false });
                }
            });
            // Set this entry as cover
            updateEntry(entry.id, { isCover: true });
        }
    };

    const saveEditing = (id) => {
        updateEntry(id, {
            title: editTitle,
            content: editContent,
            images: editImages,
            imageUrl: editImages.length > 0 ? editImages[0] : null // Backward compatibility
        });
        setEditingId(null);
        setEditImages([]);
    };

    const renderImageCarousel = (images, isEditingMode = false, isInputArea = false) => {
        if (!images || images.length === 0) return null;

        return (
            <div className="flex gap-3 overflow-x-auto pb-4 snap-x scrollbar-hide py-2">
                {images.map((img, index) => (
                    <div key={index} className="relative flex-shrink-0 snap-center group">
                        <div className={cn(
                            "rounded-xl overflow-hidden border border-gray-200 shadow-sm",
                            isInputArea ? "w-24 h-24" : "w-full max-w-[300px] h-64"
                        )}>
                            <DriveImage
                                src={img}
                                alt={`Slide ${index}`}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {(isEditingMode || isInputArea) && (
                            <button
                                onClick={() => removeImage(index, isEditingMode)}
                                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}

                        {!isInputArea && images.length > 1 && (
                            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                                {index + 1}/{images.length}
                            </div>
                        )}
                    </div>
                ))}

                {/* Add Button in Carousel (Only for editing/input) */}
                {(isEditingMode || isInputArea) && (
                    <label className={cn(
                        "flex-shrink-0 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer snap-center",
                        isInputArea ? "w-24 h-24" : "w-24 h-64"
                    )}>
                        <Plus className="w-6 h-6 text-gray-400 mb-1" />
                        <span className="text-xs text-gray-500 font-medium">Add</span>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, isEditingMode)}
                        />
                    </label>
                )}
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 bg-gray-50 flex flex-col overflow-hidden"
        >
            {/* Header */}
            <header className="px-6 py-4 bg-white border-b border-gray-200 flex items-center justify-between z-10">
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="text-center relative">
                    <div className="flex items-center gap-2 justify-center">
                        <h2 className="text-xl font-bold text-gray-900">{format(date, 'MMMM d, yyyy')}</h2>
                        <Calendar className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 font-medium">{format(date, 'EEEE')}</p>
                    {/* Transparent date input overlay for cross-browser compatibility */}
                    <input
                        ref={dateInputRef}
                        type="date"
                        value={format(date, 'yyyy-MM-dd')}
                        onChange={handleDateChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        style={{ WebkitAppearance: 'none' }}
                    />
                </div>
                <div className="w-10" />
            </header>

            {/* Main Content Area (Scrollable Feed) */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-hide">
                <div className="max-w-2xl mx-auto space-y-8 pb-32">
                    {/* Empty State */}
                    {entries.length === 0 && (
                        <div className="text-center py-20 opacity-50">
                            <p>No moments recorded for this day.</p>
                            <p className="text-sm">Start by writing something below.</p>
                        </div>
                    )}

                    {/* Timeline Entries */}
                    {entries.map((entry, index) => (
                        <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                        >
                            {/* Entry Header */}
                            <div className="px-6 py-4 flex justify-between items-center border-b border-gray-50">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-gray-400">
                                        {entry.createdAt ? format(new Date(entry.createdAt), 'h:mm a') : 'Just now'}
                                    </span>

                                </div>
                                <div className="flex gap-2">
                                    {editingId === entry.id ? (
                                        <>
                                            <button onClick={() => saveEditing(entry.id)} className="text-xs font-bold text-blue-600 hover:text-blue-700">SAVE</button>
                                            <button onClick={cancelEditing} className="text-xs font-bold text-gray-400 hover:text-gray-600">CANCEL</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => startEditing(entry)} className="text-xs font-bold text-gray-400 hover:text-blue-600">EDIT</button>
                                            {(entry.images?.length > 0 || entry.imageUrl) && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleCover(entry); }}
                                                    className={cn(
                                                        "transition-colors",
                                                        entry.isCover ? "text-yellow-500" : "text-gray-300 hover:text-yellow-500"
                                                    )}
                                                    title={entry.isCover ? "대표 이미지 해제" : "대표 이미지로 설정"}
                                                >
                                                    <Star className="w-4 h-4" fill={entry.isCover ? "currentColor" : "none"} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteEntry(entry.id)}
                                                className="text-gray-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Entry Content */}
                            <div className="p-6">
                                {editingId === entry.id ? (
                                    <div className="flex flex-col gap-4">
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            className="font-bold text-lg border-b border-gray-200 focus:border-blue-500 outline-none p-1"
                                            placeholder="Title"
                                        />
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="w-full resize-none border rounded-lg p-3 focus:ring-2 focus:ring-blue-100 outline-none min-h-[100px]"
                                            placeholder="Content"
                                        />

                                        {/* Image Editing Carousel */}
                                        <div className="mt-2">
                                            <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">Photos</p>

                                            {editImages.length === 0 ? (
                                                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer w-32 h-32">
                                                    <Camera className="w-6 h-6 text-gray-400 mb-2" />
                                                    <span className="text-xs text-gray-500 font-medium">Add Photo</span>
                                                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(e, true)} />
                                                </label>
                                            ) : (
                                                renderImageCarousel(editImages, true, false)
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {entry.title && (
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">{entry.title}</h3>
                                        )}
                                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{entry.content}</p>

                                        {/* View Mode Carousel */}
                                        {(entry.images && entry.images.length > 0) ? (
                                            <div className="mt-6">
                                                {renderImageCarousel(entry.images, false, false)}
                                            </div>
                                        ) : (
                                            /* Backward Compatibility for single imageUrl */
                                            entry.imageUrl && (
                                                <div className="mt-6">
                                                    {renderImageCarousel([entry.imageUrl], false, false)}
                                                </div>
                                            )
                                        )}
                                    </>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Input Area (Sticky Bottom) */}
            <div className="bg-white border-t border-gray-200 p-4 md:p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
                <div className="max-w-2xl mx-auto flex flex-col gap-4">


                    {/* Image Preview Carousel in Input */}
                    <AnimatePresence>
                        {newImages.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="w-full overflow-hidden"
                            >
                                {renderImageCarousel(newImages, false, true)}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="flex gap-4 items-end relative">
                        <GooglePhotoPicker
                            onSelect={(photos) => handleGooglePhotoSelect(photos, false)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-600"
                        />
                        <label className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full cursor-pointer transition-colors text-gray-600 flex-shrink-0">
                            <Camera className="w-6 h-6" />
                            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(e, false)} />
                        </label>

                        <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all px-4 py-3 relative">
                            <input
                                type="text"
                                placeholder="Title (optional)"
                                className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-900 mb-1 placeholder-gray-400"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                            />
                            <textarea
                                placeholder="Write your moment..."
                                className="w-full bg-transparent border-none focus:ring-0 resize-none text-gray-700 placeholder-gray-400 min-h-[60px]"
                                value={newContent}
                                onChange={(e) => setNewContent(e.target.value)}
                            />
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={!newContent.trim() && newImages.length === 0}
                            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full transition-all shadow-md hover:shadow-lg flex-shrink-0"
                        >
                            <Send className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
