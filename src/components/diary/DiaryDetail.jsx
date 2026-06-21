import React, { useState } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, MapPin, Pencil } from 'lucide-react';
import { DriveImage } from '../common/DriveImage';
import { cn } from '../../lib/utils';
import { getEntryImages, getEntryText, moveImageIndex } from './diaryDetailState';

export const DiaryDetail = ({ entry, month, onBack, onEdit }) => {
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const images = getEntryImages(entry);
    const { title, content } = getEntryText(entry);
    const entryDate = new Date(entry.date);
    const createdDate = new Date(entry.createdAt || entry.date);
    const hasMultipleImages = images.length > 1;
    const activeImageIndex = Math.min(selectedImageIndex, Math.max(images.length - 1, 0));

    const moveImage = (direction) => {
        setSelectedImageIndex(current => moveImageIndex(current, direction, images.length));
    };

    const handleDragEnd = (_, info) => {
        if (!hasMultipleImages || Math.abs(info.offset.x) < 45) return;
        moveImage(info.offset.x < 0 ? 1 : -1);
    };

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <header className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-5 sm:px-8">
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex min-w-0 items-center gap-2 rounded-2xl px-3 py-2 text-sm font-black text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                    <ArrowLeft className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{month + 1}월 목록</span>
                </button>
                <button
                    type="button"
                    onClick={onEdit}
                    className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-3 text-xs font-black text-white shadow-lg transition-all hover:bg-gray-800 active:scale-95"
                >
                    <Pencil className="h-4 w-4" />
                    수정
                </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-6 scrollbar-hide sm:px-8 sm:py-8">
                <div className="space-y-6 pb-12">
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
                            {format(entryDate, 'yyyy년 M월 d일')}
                        </p>
                        <h2 className="mt-2 break-words text-3xl font-black tracking-tight text-gray-900 font-outfit">
                            {title}
                        </h2>
                    </div>

                    {images.length > 0 && (
                        <section aria-label="일기 사진" className="space-y-3">
                            <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] bg-gray-100 premium-shadow">
                                <motion.div
                                    key={`${entry.id}-${activeImageIndex}`}
                                    drag={hasMultipleImages ? 'x' : false}
                                    dragConstraints={{ left: 0, right: 0 }}
                                    dragElastic={0.16}
                                    onDragEnd={handleDragEnd}
                                    className="h-full w-full cursor-grab active:cursor-grabbing"
                                >
                                    <DriveImage
                                        src={images[activeImageIndex]}
                                        alt={`${title} 사진 ${activeImageIndex + 1}`}
                                        className="h-full w-full object-cover object-top"
                                    />
                                </motion.div>

                                {hasMultipleImages && (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => moveImage(-1)}
                                            aria-label="이전 사진"
                                            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-2.5 text-white backdrop-blur-md transition-colors hover:bg-black/65"
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => moveImage(1)}
                                            aria-label="다음 사진"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/45 p-2.5 text-white backdrop-blur-md transition-colors hover:bg-black/65"
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                        <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1 text-[10px] font-black text-white backdrop-blur-md">
                                            {activeImageIndex + 1} / {images.length}
                                        </span>
                                    </>
                                )}
                            </div>

                            {hasMultipleImages && (
                                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" aria-label="사진 썸네일">
                                    {images.map((image, index) => (
                                        <button
                                            type="button"
                                            key={`${entry.id}-thumbnail-${index}`}
                                            onClick={() => setSelectedImageIndex(index)}
                                            aria-label={`${index + 1}번째 사진 보기`}
                                            className={cn(
                                                'h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl border-2 bg-gray-100 transition-all',
                                                activeImageIndex === index
                                                    ? 'border-black opacity-100'
                                                    : 'border-transparent opacity-55 hover:opacity-90',
                                            )}
                                        >
                                            <DriveImage src={image} alt="" className="h-full w-full object-cover object-top" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}

                    <p className="whitespace-pre-wrap break-words text-[15px] leading-8 text-gray-700">
                        {content}
                    </p>

                    <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-5 text-[11px] font-bold text-gray-400">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-2">
                            <Clock className="h-3.5 w-3.5" />
                            {format(createdDate, 'h:mm a')}
                        </span>
                        {entry.location && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-2">
                                <MapPin className="h-3.5 w-3.5" />
                                {entry.location}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
