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
                "relative flex-shrink-0 w-72 h-[450px] rounded-[32px] overflow-hidden cursor-pointer premium-shadow transition-all duration-500",
                isSelected ? "scale-105 ring-4 ring-white shadow-2xl" : "hover:scale-[1.02] hover:premium-shadow-hover"
            )}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            {/* Background */}
            <div className="absolute inset-0 bg-[#e5e7eb]">
                {bgImage ? (
                    <DriveImage
                        src={bgImage}
                        alt="Month Background"
                        className="absolute inset-0 w-full h-full object-cover object-top"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-blue-100" />
                )}
                {/* Overlay for better text readability */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500" />
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-x-4 bottom-4 glass-dark p-6 rounded-[24px] flex flex-col justify-between border border-white/20 z-10">
                <div className="text-white">
                    <h2 className="text-6xl font-extrabold font-outfit tracking-tight">{format(new Date(year, month), 'M')}</h2>
                    <p className="text-white/70 font-medium text-sm mt-1">{year}</p>
                </div>

                {/* Progress Bar */}
                <div className="mt-6 space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-white/60">
                        <span>Progress</span>
                        <span>{filledDays} / {daysInMonth} days</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                        />
                    </div>
                </div>
            </div>

            {/* Decoration */}
            <div className="absolute top-6 right-6 p-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/30 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Calendar className="w-4 h-4" />
            </div>
        </motion.div>
    );
};
