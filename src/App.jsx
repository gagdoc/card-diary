import React, { useEffect, useRef, useState } from 'react';
import { DiaryProvider, useDiary } from './context/DiaryContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DiaryEditor } from './components/diary/DiaryEditor';
import { MonthCard } from './components/diary/MonthCard';
import { MonthDetail } from './components/diary/MonthDetail';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, Plus, LogIn, LogOut, Download, Upload, RefreshCw } from 'lucide-react';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const MainView = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const importInputRef = useRef(null);
  const currentMonthRef = useRef(null);
  const currentMonth = new Date().getMonth();

  // Scroll to current month when the year matches today's year
  useEffect(() => {
    if (currentMonthRef.current && selectedYear === new Date().getFullYear()) {
      setTimeout(() => {
        currentMonthRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }, 100);
    }
  }, [selectedYear]);

  const { entries, getEntriesByMonth, importEntries } = useDiary();
  const { user, authState, login, mockLogin, logout } = useAuth();

  const months = Array.from({ length: 12 }, (_, i) => i);

  const handleMonthClick = (month) => {
    setSelectedMonth(month);
  };

  const handleCreateEntry = () => {
    const today = new Date();
    const targetMonth = selectedMonth ?? today.getMonth();
    const targetDate = selectedYear === today.getFullYear() && targetMonth === today.getMonth()
      ? today
      : new Date(selectedYear, targetMonth, 1, 12);

    setSelectedDate(targetDate);
    setEditingEntry(null);
    setIsEditorOpen(true);
  }

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setIsEditorOpen(true);
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setEditingEntry(null);
  };

  const handleExport = () => {
    const payload = {
      app: 'Card Diary',
      exportedAt: new Date().toISOString(),
      entries,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `card-diary-backup-${selectedYear}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const incomingEntries = Array.isArray(data) ? data : data.entries;
      const imported = importEntries(incomingEntries);

      if (!imported) {
        alert('가져올 수 없는 백업 파일입니다.');
      }
    } catch (error) {
      console.error('Failed to import diary backup:', error);
      alert('백업 파일을 읽지 못했습니다.');
    } finally {
      event.target.value = '';
    }
  };

  // Calculate year-wide progress
  const totalEntries = entries.length;
  const daysInYear = 365;
  const yearProgress = (totalEntries / daysInYear) * 100;

  return (
    <div className="min-h-screen bg-[#f8f9fa] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] flex flex-col overflow-hidden relative font-inter">
      {/* Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      {/* Top Bar */}
      <header className="px-4 sm:px-8 py-4 sm:py-8 flex justify-between items-center gap-3 z-10">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          <div className="flex items-center bg-white/80 backdrop-blur-xl border border-gray-200 rounded-[20px] sm:rounded-[24px] p-1.5 sm:p-2 shadow-2xl shadow-gray-200/50">
            <button onClick={() => setSelectedYear(prev => prev - 1)} className="p-2.5 sm:p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-gray-900 group">
              <ChevronLeft className="w-5 h-5 group-active:scale-90" />
            </button>
            <h1 className="px-3 sm:px-6 text-xl sm:text-2xl font-black font-outfit tracking-tighter text-gray-900">{selectedYear}</h1>
            <button onClick={() => setSelectedYear(prev => prev + 1)} className="p-2.5 sm:p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-gray-900 group">
              <ChevronRight className="w-5 h-5 group-active:scale-90" />
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-4 bg-white/50 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3 shadow-sm">
            <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-black rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(yearProgress * 10, 100)}%` }}
                transition={{ duration: 2, ease: "easeOut" }}
              />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Year Progress</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="flex items-center gap-1 rounded-[18px] sm:rounded-[22px] bg-white/80 p-1.5 shadow-xl shadow-gray-200/30 border border-gray-100">
            <button
              onClick={handleExport}
              disabled={entries.length === 0}
              className="h-10 px-2.5 sm:px-3 rounded-2xl text-gray-400 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-colors inline-flex items-center gap-2"
              title="백업 내보내기"
            >
              <Download className="w-4 h-4" />
              <span className="hidden xl:inline text-[11px] font-black tracking-wider">BACKUP</span>
            </button>
            <button
              onClick={() => importInputRef.current?.click()}
              className="h-10 px-2.5 sm:px-3 rounded-2xl text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors inline-flex items-center gap-2"
              title="백업 가져오기"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden xl:inline text-[11px] font-black tracking-wider">IMPORT</span>
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={handleImport}
            />
          </div>

          <button className="hidden sm:flex p-4 hover:bg-white rounded-[24px] transition-all shadow-xl shadow-transparent hover:shadow-gray-200/50 border border-transparent hover:border-gray-100 text-gray-400 hover:text-gray-900">
            <Search className="w-6 h-6" />
          </button>

          {/* ── Authenticated ── */}
          {authState === 'authenticated' && user && (
            <div className="flex items-center gap-2 sm:gap-4 bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[20px] sm:rounded-[24px] p-1.5 sm:p-2 sm:pr-5 shadow-2xl shadow-gray-200/50 group min-w-0">
              <img src={user.picture} alt={user.name} className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl border border-gray-100 shadow-sm" title={user.name} />
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-black text-gray-900 leading-none">{user.name}</span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Prime Member</span>
              </div>
              <button onClick={logout} className="sm:ml-2 p-2 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-xl transition-all" title="로그아웃">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Needs re-auth (token expired but user info preserved) ── */}
          {authState === 'needs_reauth' && user && (
            <div className="flex items-center gap-2 sm:gap-2 bg-white/80 backdrop-blur-xl border border-orange-200 rounded-[20px] sm:rounded-[24px] p-1.5 sm:p-2 sm:pr-4 shadow-2xl shadow-orange-100/50 min-w-0">
              <div className="relative flex-shrink-0">
                <img src={user.picture} alt={user.name} className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl border border-orange-200 shadow-sm opacity-80" title={user.name} />
                {/* Reconnecting pulse ring */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-orange-400 rounded-full border-2 border-white animate-pulse" />
              </div>
              <div className="hidden sm:flex flex-col mr-1">
                <span className="text-xs font-black text-gray-900 leading-none">{user.name}</span>
                <span className="text-[9px] font-bold text-orange-400 uppercase tracking-widest mt-1">재연결 중...</span>
              </div>
              <button
                onClick={() => login()}
                title="다시 연결"
                className="p-2 bg-orange-50 hover:bg-orange-100 text-orange-500 rounded-xl transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={logout} className="p-2 hover:bg-red-50 text-gray-300 hover:text-red-400 rounded-xl transition-all" title="로그아웃">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Fully unauthenticated ── */}
          {authState === 'unauthenticated' && (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => mockLogin()}
                className="hidden sm:flex items-center gap-2 px-6 py-4 bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[24px] hover:bg-white text-[13px] font-black text-gray-700 transition-all shadow-xl shadow-gray-200/20 hover:shadow-gray-200/50 hover:-translate-y-0.5"
              >
                <span>GUEST ACCESS</span>
              </button>
              <button
                onClick={() => login()}
                className="flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 bg-black text-white rounded-[20px] sm:rounded-[24px] hover:bg-gray-800 text-[12px] sm:text-[13px] font-black transition-all shadow-2xl shadow-black/20 hover:shadow-black/40 hover:-translate-y-0.5 active:scale-95"
              >
                <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>LOGIN</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Carousel Area */}
      <main className="flex-1 w-full overflow-x-auto overflow-y-hidden flex items-center px-5 sm:px-12 gap-5 sm:gap-10 pb-24 sm:pb-20 scrollbar-hide snap-x snap-mandatory perspective-1000">
        {months.map((month) => {
          const monthEntries = getEntriesByMonth(selectedYear, month);
          return (
            <div
              key={`${selectedYear}-${month}`}
              className="snap-center"
              ref={month === currentMonth ? currentMonthRef : null}
            >
              <MonthCard
                year={selectedYear}
                month={month}
                entries={monthEntries}
                isSelected={false}
                onClick={() => handleMonthClick(month)}
              />
            </div>
          );
        })}
        <div className="w-32 flex-shrink-0" />
      </main>

      {/* Floating Action Button */}
      {selectedMonth === null && (
        <motion.button
          layoutId="fab"
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={handleCreateEntry}
          aria-label="새 일기 작성"
          className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] right-5 sm:bottom-12 sm:right-12 w-16 h-16 sm:w-20 sm:h-20 bg-black text-white rounded-[24px] sm:rounded-[32px] flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-40 cursor-pointer overflow-hidden group focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Plus className="w-8 h-8 sm:w-10 sm:h-10 group-hover:rotate-90 transition-transform duration-500" />
        </motion.button>
      )}

      {/* Month Detail Overlay */}
      <AnimatePresence>
        {selectedMonth !== null && (
          <MonthDetail
            year={selectedYear}
            month={selectedMonth}
            onClose={() => setSelectedMonth(null)}
            onCreateEntry={handleCreateEntry}
            onEditEntry={handleEditEntry}
          />
        )}
      </AnimatePresence>

      {/* Editor Modal */}
      <AnimatePresence>
        {isEditorOpen && (
          <DiaryEditor
            initialDate={editingEntry ? new Date(editingEntry.date) : selectedDate}
            initialEditingEntryId={editingEntry?.id}
            onClose={handleEditorClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DiaryProvider>
          <MainView />
        </DiaryProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
