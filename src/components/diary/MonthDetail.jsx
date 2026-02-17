import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { X, Calendar, MapPin, Smile, Cloud } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useDiary } from '../../context/DiaryContext';
import { DriveImage } from '../common/DriveImage';

export const MonthDetail = ({ year, month, onClose, onEntryClick }) => {
    const { getEntriesByMonth } = useDiary();
    const entries = getEntriesByMonth(year, month);

    // Group entries by date
    const entriesByDate = entries.reduce((acc, entry) => {
        const dateKey = format(new Date(entry.date), 'yyyy-MM-dd');
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
        acc[dateKey].push(entry);
        return acc;
    }, {});

    // Create array of unique dates, sorted descending
    const sortedDates = Object.keys(entriesByDate).sort((a, b) => new Date(b) - new Date(a));

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-40 bg-gray-50/95 backdrop-blur-sm flex flex-col overflow-hidden"
        >
            {/* Header */}
            <header className="px-6 py-4 flex justify-between items-center bg-white border-b border-gray-200 shadow-sm z-10">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">
                        {format(new Date(year, month), 'MMMM yyyy')}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        {sortedDates.length} days recorded
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                    <X className="w-6 h-6 text-gray-700" />
                </button>
            </header>

            {/* Content Grid */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    {sortedDates.map((dateKey) => {
                        const dateEntries = entriesByDate[dateKey];
                        const count = dateEntries.length;
                        // Use the first entry with an image, or just the first entry for preview
                        // Check both imageUrl (legacy/single) and images array
                        const representativeEntry = dateEntries.find(e => e.imageUrl || (e.images && e.images.length > 0)) || dateEntries[0];
                        const entryDate = new Date(dateKey);

                        // Determine the source for the image
                        let displayImageSrc = null;
                        if (representativeEntry.images && representativeEntry.images.length > 0) {
                            displayImageSrc = representativeEntry.images[0];
                        } else if (representativeEntry.imageUrl) {
                            displayImageSrc = representativeEntry.imageUrl;
                        }

                        return (
                            <motion.div
                                key={dateKey}
                                layoutId={`date-${dateKey}`}
                                onClick={() => onEntryClick(representativeEntry)} // Passing one entry is enough to set the date in App.jsx
                                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer group border border-gray-100 flex flex-col h-[320px]"
                            >
                                {/* Image Section */}
                                <div className="h-48 bg-gray-100 relative overflow-hidden">
                                    {displayImageSrc ? (
                                        <DriveImage
                                            src={displayImageSrc}
                                            alt={representativeEntry.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 text-gray-300">
                                            <Calendar className="w-12 h-12" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold">
                                        {format(entryDate, 'd')}
                                    </div>
                                    {count > 1 && (
                                        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md text-gray-800 px-2 py-1 rounded-full text-xs font-bold shadow-sm">
                                            +{count - 1} more
                                        </div>
                                    )}
                                </div>

                                {/* Content Section */}
                                <div className="p-5 flex flex-col flex-1">
                                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1 mb-1">
                                        {format(entryDate, 'MMMM d')}
                                    </h3>
                                    <p className="text-xs text-gray-400 mb-1">
                                        {format(entryDate, 'EEEE')}
                                    </p>
                                    <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">
                                        {representativeEntry.content || "No content..."}
                                    </p>

                                    <div className="flex items-center gap-2 text-xs text-gray-400 border-t border-gray-50 pt-3">
                                        <span>{count} moments</span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}

                    {/* Empty State */}
                    {sortedDates.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center opacity-60">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Calendar className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-700">No days recorded</h3>
                            <p className="text-gray-500 max-w-xs mx-auto mt-2">
                                Start your journey for this month.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div >
    );
};
