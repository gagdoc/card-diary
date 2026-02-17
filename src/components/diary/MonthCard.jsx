import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { Calendar } from 'lucide-react';
import { DriveImage } from '../common/DriveImage';

export const MonthCard = ({ year, month, entries, isSelected, onClick }) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Calculate unique filled days
    const uniqueDays = new Set(entries.map(entry => new Date(entry.date).getDate()));
    const filledDays = uniqueDays.size;

    const progress = (filledDays / daysInMonth) * 100;

    // Prioritize entry marked as cover, then fallback to first entry with an image
    const coverEntry = entries.find(e => e.isCover && (e.images?.length > 0 || e.imageUrl));
    const fallbackEntry = entries.find(e => e.images?.length > 0 || e.imageUrl);
    const bgEntry = coverEntry || fallbackEntry;

    let bgImage = null;
    if (bgEntry) {
        if (bgEntry.images && bgEntry.images.length > 0) {
            bgImage = bgEntry.images[0];
        } else if (bgEntry.imageUrl) {
            bgImage = bgEntry.imageUrl;
        }
    }

    return (
        <motion.div
            layout
            onClick={onClick}
            className={cn(
                "relative flex-shrink-0 w-64 h-96 rounded-3xl overflow-hidden cursor-pointer shadow-lg transition-all duration-300",
                isSelected ? "scale-105 ring-4 ring-blue-300 shadow-2xl" : "hover:scale-102 opacity-80 hover:opacity-100"
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
        >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-sky-gradient-start to-sky-gradient-end">
                {bgImage ? (
                    <DriveImage
                        src={bgImage}
                        alt="Month Background"
                        className="absolute inset-0 w-full h-full object-cover opacity-90"
                    />
                ) : (
                    <div className="absolute inset-0 bg-blue-100/30 backdrop-blur-sm" />
                )}
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 p-6 flex flex-col justify-between bg-black/10 hover:bg-black/20 transition-colors z-10">
                <div className="text-white drop-shadow-md">
                    <h2 className="text-4xl font-bold">{format(new Date(year, month), 'MMM')}</h2>
                    <p className="text-lg opacity-90">{year}</p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium text-white drop-shadow-sm">
                        <span>Writing Progress</span>
                        <span>{filledDays}/{daysInMonth}</span>
                    </div>
                    <div className="h-2 w-full bg-white/30 rounded-full overflow-hidden backdrop-blur-md">
                        <motion.div
                            className="h-full bg-white shadow-sm"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
