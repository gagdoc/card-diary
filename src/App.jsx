import React, { useState } from 'react';
import { DiaryProvider, useDiary } from './context/DiaryContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DiaryEditor } from './components/diary/DiaryEditor';
import { MonthCard } from './components/diary/MonthCard';
import { MonthDetail } from './components/diary/MonthDetail';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './lib/utils';
import { Search, ChevronLeft, ChevronRight, Plus, LogIn, LogOut } from 'lucide-react';

const MainView = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null); // Track entry being edited

  const { entries, getEntriesByMonth } = useDiary();
  const { user, login, logout } = useAuth();

  // Dummy data for months initialization
  const months = Array.from({ length: 12 }, (_, i) => i);

  const handleMonthClick = (month) => {
    setSelectedMonth(month);
  };

  const handleFabClick = () => {
    setSelectedDate(new Date());
    setEditingEntry(null); // Ensure we are in "create" mode
    setIsEditorOpen(true);
  }

  const handleEntryClick = (entry) => {
    setEditingEntry(entry);
    setIsEditorOpen(true);
    // We might want to keep MonthDetail open behind it, or close it. 
    // Keeping it open feels more natural for "back" navigation.
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setEditingEntry(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden relative">
      {/* Top Bar */}
      <header className="px-6 py-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedYear(prev => prev - 1)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">{selectedYear}</h1>
          <button onClick={() => setSelectedYear(prev => prev + 1)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <Search className="w-6 h-6" />
          </button>

          {user ? (
            <div className="flex items-center gap-2 ml-2">
              <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border border-gray-200" title={user.name} />
              <button onClick={logout} className="p-2 hover:bg-gray-200 rounded-full transition-colors" title="Logout">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button onClick={() => login()} className="flex items-center gap-2 ml-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full hover:bg-gray-50 text-sm font-medium transition-colors">
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Carousel Area */}
      <main className="flex-1 w-full overflow-x-auto overflow-y-hidden flex items-center px-10 gap-8 pb-10 scrollbar-hide snap-x snap-mandatory">
        {months.map((month) => {
          const monthEntries = getEntriesByMonth(selectedYear, month);
          return (
            <div key={month} className="snap-center">
              <MonthCard
                year={selectedYear}
                month={month}
                entries={monthEntries}
                isSelected={false} // Could add selection logic
                onClick={() => handleMonthClick(month)}
              />
            </div>
          );
        })}
      </main>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleFabClick}
        className="absolute bottom-8 right-8 w-16 h-16 bg-black text-white rounded-full flex items-center justify-center shadow-2xl z-20 cursor-pointer"
      >
        <Plus className="w-8 h-8" />
      </motion.button>

      {/* Month Detail Overlay */}
      <AnimatePresence>
        {selectedMonth !== null && (
          <MonthDetail
            year={selectedYear}
            month={selectedMonth}
            onClose={() => setSelectedMonth(null)}
            onEntryClick={handleEntryClick}
          />
        )}
      </AnimatePresence>

      {/* Editor Modal */}
      <AnimatePresence>
        {isEditorOpen && (
          <DiaryEditor
            initialDate={editingEntry ? new Date(editingEntry.date) : selectedDate}
            existingEntry={editingEntry}
            onClose={handleEditorClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <DiaryProvider>
        <MainView />
      </DiaryProvider>
    </AuthProvider>
  );
}

export default App;
