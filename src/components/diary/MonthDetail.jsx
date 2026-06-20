import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { X, Calendar, Plus } from 'lucide-react';
import { useDiary } from '../../context/DiaryContext';
import { DriveImage } from '../common/DriveImage';

export const MonthDetail = ({ year, month, onClose, onEntryClick }) => {
    const { getEntriesByMonth } = useDiary();
    const monthEntries = getEntriesByMonth(year, month);

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white/95 backdrop-blur-3xl shadow-[-20px_0_50px_rgba(0,0,0,0.1)] z-30 flex flex-col border-l border-white/20"
        >
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
                    onClick={onClose}
                    className="p-3 hover:bg-gray-100 rounded-2xl transition-all shadow-sm border border-transparent hover:border-gray-200 group"
                >
                    <X className="w-6 h-6 text-gray-400 group-hover:text-gray-900" />
                </button>
            </header>

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
                            .map((entry) => (
                                <motion.div
                                    key={entry.id}
                                    layoutId={`entry-${entry.id}`}
                                    onClick={() => onEntryClick(entry)}
                                    className="group cursor-pointer"
                                    whileHover={{ y: -4 }}
                                >
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
                                            {(entry.images?.length > 0 || entry.imageUrl) && (
                                                <div className="relative aspect-[16/9] rounded-3xl overflow-hidden premium-shadow group-hover:premium-shadow-hover transition-all duration-500">
                                                    <DriveImage
                                                        src={entry.images?.[0] || entry.imageUrl}
                                                        alt="Entry Cover"
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                                    />
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
                            ))}
                    </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="p-8 bg-gradient-to-t from-white via-white to-transparent">
                <button
                    onClick={() => onEntryClick(null)}
                    className="w-full py-5 bg-black text-white rounded-[24px] font-bold text-lg flex items-center justify-center gap-3 shadow-2xl hover:bg-gray-800 transition-all active:scale-95"
                >
                    <Plus className="w-6 h-6" />
                    Write New Story
                </button>
            </div>
        </motion.div>
    );
};
