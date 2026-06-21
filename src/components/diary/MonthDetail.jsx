import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { X, Plus, Star } from 'lucide-react';
import { useDiary } from '../../context/DiaryContext';
import { DriveImage } from '../common/DriveImage';
import { DiaryDetail } from './DiaryDetail';

export const MonthDetail = ({ year, month, onClose, onCreateEntry, onEditEntry }) => {
    const { getEntriesByMonth, setCoverEntry } = useDiary();
    const monthEntries = getEntriesByMonth(year, month);
    const [selectedEntryId, setSelectedEntryId] = React.useState(null);
    const selectedEntry = monthEntries.find(entry => entry.id === selectedEntryId) || null;

    const coverEntryId = monthEntries.find(e => e.isCover)?.id ?? null;

    const handleSetCover = (e, entryId) => {
        e.stopPropagation(); // prevent opening the detail view
        setCoverEntry(entryId, year, month);
    };

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white/95 backdrop-blur-3xl shadow-[-20px_0_50px_rgba(0,0,0,0.1)] z-30 flex flex-col border-l border-white/20"
        >
            {selectedEntry ? (
                <DiaryDetail
                    key={selectedEntry.id}
                    entry={selectedEntry}
                    month={month}
                    onBack={() => setSelectedEntryId(null)}
                    onEdit={() => onEditEntry(selectedEntry)}
                />
            ) : (
                <>
            {/* Header */}
            <header className="p-8 pb-4 flex justify-between items-start">
                <div>
                    <h2 className="text-5xl font-extrabold font-outfit tracking-tighter text-gray-900 leading-none">
                        {format(new Date(year, month), 'M월')}
                    </h2>
                    <p className="text-gray-500 font-medium mt-2 flex items-center gap-2">
                        <span className="w-8 h-[2px] bg-black"></span>
                        {year}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label={`${month + 1}월 패널 닫기`}
                    className="p-3 hover:bg-gray-100 rounded-2xl transition-all shadow-sm border border-transparent hover:border-gray-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                >
                    <X className="w-6 h-6 text-gray-400 group-hover:text-gray-900" />
                </button>
            </header>

            {/* Cover hint */}
            {monthEntries.length > 0 && (
                <div className="px-8 pb-2">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {coverEntryId
                            ? '대표 이미지가 설정되어 있습니다. ★를 눌러 변경하세요.'
                            : '사진 옆 ★를 눌러 월 대표 이미지를 설정하세요.'}
                    </p>
                </div>
            )}

            {/* Entry List */}
            <div className="flex-1 overflow-y-auto px-8 py-4 scrollbar-hide">
                {monthEntries.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                        <div className="w-20 h-20 bg-gray-100 rounded-[32px] flex items-center justify-center">
                            <Plus className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-lg font-medium text-gray-400">No stories yet for this month.</p>
                    </div>
                ) : (
                    <div className="space-y-8 pb-20">
                        {monthEntries
                            .sort((a, b) => new Date(b.date) - new Date(a.date))
                            .map((entry) => {
                                const isCover = entry.id === coverEntryId;
                                const hasImage = entry.images?.length > 0 || entry.imageUrl;

                                return (
                                    <motion.div
                                        key={entry.id}
                                        layoutId={`entry-${entry.id}`}
                                        onClick={() => setSelectedEntryId(entry.id)}
                                        className="group relative cursor-pointer rounded-3xl"
                                        whileHover={{ y: -4 }}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setSelectedEntryId(entry.id)}
                                            aria-label={`${format(new Date(entry.date), 'M월 d일')} ${entry.title || '제목 없는 일기'} 상세 보기`}
                                            className="absolute inset-0 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-4"
                                        />
                                        <div className="flex gap-6">
                                            <div className="flex-shrink-0 flex flex-col items-center pt-1 w-12">
                                                <span className="text-2xl font-black font-outfit text-gray-900 leading-none">
                                                    {format(new Date(entry.date), 'dd')}
                                                </span>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">
                                                    {format(new Date(entry.date), 'EEE')}
                                                </span>
                                            </div>
                                            <div className="flex-1 space-y-3">
                                                {hasImage && (
                                                    <div className="relative aspect-[16/9] rounded-3xl overflow-hidden premium-shadow group-hover:premium-shadow-hover transition-all duration-500">
                                                        <DriveImage
                                                            src={entry.images?.[0] || entry.imageUrl}
                                                            alt="Entry Cover"
                                                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                                                        />

                                                        {/* Cover Badge / Toggle Button */}
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleSetCover(e, entry.id)}
                                                            title={isCover ? '대표 이미지 해제' : '이 달의 대표 이미지로 설정'}
                                                            aria-label={isCover ? '월 대표 이미지 해제' : '월 대표 이미지로 설정'}
                                                            className={`absolute top-2.5 right-2.5 p-2 rounded-2xl backdrop-blur-md border transition-all duration-200 z-10
                                                                ${isCover
                                                                    ? 'bg-amber-400/90 border-amber-300 text-white shadow-lg scale-110'
                                                                    : 'bg-black/30 border-white/20 text-white/70 hover:bg-amber-400/80 hover:text-white hover:border-amber-300 hover:scale-110'
                                                                }`}
                                                        >
                                                            <Star className={`w-4 h-4 transition-all ${isCover ? 'fill-white' : ''}`} />
                                                        </button>

                                                        {/* Cover Label */}
                                                        {isCover && (
                                                            <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-xl bg-amber-400/90 backdrop-blur-sm text-[10px] font-black uppercase tracking-wider text-white border border-amber-300/50">
                                                                이 달의 대표
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Cover button for entries without image */}
                                                {!hasImage && (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleSetCover(e, entry.id)}
                                                            title={isCover ? '대표 해제' : '대표로 설정 (이미지 없음)'}
                                                            aria-label={isCover ? '월 대표 일기 해제' : '월 대표 일기로 설정'}
                                                            className={`relative z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all
                                                                ${isCover
                                                                    ? 'bg-amber-50 border-amber-300 text-amber-600'
                                                                    : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-amber-300 hover:text-amber-500'
                                                                }`}
                                                        >
                                                            <Star className={`w-3 h-3 ${isCover ? 'fill-amber-400 text-amber-400' : ''}`} />
                                                            {isCover ? '대표 해제' : '대표로 설정'}
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="space-y-1">
                                                    <h3 className="text-xl font-bold font-outfit text-gray-900 group-hover:text-blue-600 transition-colors">
                                                        {entry.title || 'Untitled Entry'}
                                                    </h3>
                                                    <p className="text-gray-500 line-clamp-2 text-sm leading-relaxed">
                                                        {entry.content}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-2 pt-1 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                                    <span>{format(new Date(entry.createdAt || entry.date), 'h:mm a')}</span>
                                                    {entry.location && (
                                                        <span className="flex items-center gap-1">
                                                            • {entry.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-8 h-[1px] w-full bg-gray-100 group-last:hidden"></div>
                                    </motion.div>
                                );
                            })}
                    </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="p-8 bg-gradient-to-t from-white via-white to-transparent">
                <button
                    type="button"
                    onClick={onCreateEntry}
                    className="w-full py-5 bg-black text-white rounded-[24px] font-bold text-lg flex items-center justify-center gap-3 shadow-2xl hover:bg-gray-800 transition-all active:scale-95"
                >
                    <Plus className="w-6 h-6" />
                    Write New Story
                </button>
            </div>
                </>
            )}
        </motion.div>
    );
};
