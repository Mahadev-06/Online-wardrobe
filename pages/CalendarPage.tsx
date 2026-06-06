import React, { useState } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import { ChevronLeft, ChevronRight, Plus, X, AlertCircle } from 'lucide-react';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const CalendarPage: React.FC = () => {
  const { savedOutfits, calendarEvents, addCalendarEvent } = useWardrobe();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [selectedOutfitId, setSelectedOutfitId] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
  ).getDate();
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  ).getDay();

  const handlePrevMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const eventsForDay = (day: number) => {
    const dateStr = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day,
    ).toDateString();
    return calendarEvents.filter((e) => new Date(e.date).toDateString() === dateStr);
  };

  const openModal = (day: number) => {
    setSelectedDay(day);
    setEventTitle('');
    setSelectedOutfitId('');
    setErrorMessage(null);
    setShowModal(true);
  };

  const handleAddEvent = () => {
    if (!selectedDay || !selectedOutfitId || !eventTitle.trim()) {
      setErrorMessage('Please add a title and select an outfit.');
      return;
    }

    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      selectedDay,
    );

    addCalendarEvent({
      date: date.toISOString(),
      title: eventTitle.trim(),
      outfitId: selectedOutfitId,
    });

    setShowModal(false);
  };

  const monthLabel = currentDate.toLocaleDateString('default', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="px-6 py-10 md:px-12 md:py-14 pb-8 md:pb-14 max-w-6xl mx-auto page-enter">
      <h1 className="text-3xl font-black text-white mb-10">Plan Your Looks</h1>

      <div className="glass-panel overflow-hidden shadow-xl">

        {/* Month Navigation Header */}
        <div className="flex items-center justify-between p-6 md:p-8 border-b border-white/10">
          <button
            onClick={handlePrevMonth}
            className="p-3 rounded-full btn-glass-secondary border border-white/10 shadow-sm text-gray-300 hover:text-white"
            aria-label="Previous month"
          >
            <ChevronLeft size={22} />
          </button>
          <h2 className="text-xl md:text-2xl font-black text-white">{monthLabel}</h2>
          <button
            onClick={handleNextMonth}
            className="p-3 rounded-full btn-glass-secondary border border-white/10 shadow-sm text-gray-300 hover:text-white"
            aria-label="Next month"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-white/10 bg-gray-800/30">
          {DAYS_OF_WEEK.map((d) => (
            <div
              key={d}
              className="py-3 md:py-4 text-center text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 auto-rows-fr">
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="min-h-[80px] md:min-h-[120px] bg-gray-900/30 border-b border-r border-white/5"
            />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const events = eventsForDay(day);
            const isToday =
              new Date().toDateString() ===
              new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

            return (
              <button
                key={day}
                onClick={() => openModal(day)}
                className={`min-h-[80px] md:min-h-[120px] p-2 md:p-3 border-b border-r border-white/5 cursor-pointer hover:bg-gray-800/50 transition relative group text-left w-full ${
                  isToday ? 'bg-p_teal/10' : ''
                }`}
                aria-label={`${monthLabel} ${day}`}
              >
                <span
                  className={`text-xs md:text-sm font-bold w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full transition ${
                    isToday
                      ? 'bg-p_teal/90 text-white shadow-sm shadow-p_teal/30 border border-white/10'
                      : 'text-gray-400 group-hover:text-white group-hover:bg-gray-800'
                  }`}
                >
                  {day}
                </span>

                <div className="mt-1.5 md:mt-3 space-y-1">
                  {events.map((evt, idx) => (
                    <div
                      key={idx}
                      className="text-[9px] md:text-xs font-bold bg-gray-800/80 backdrop-blur-md border border-white/10 text-gray-300 px-2 py-1 rounded-lg truncate shadow-sm"
                      title={evt.title}
                    >
                      {evt.title}
                    </div>
                  ))}
                </div>

                {/* Add hint */}
                <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 opacity-0 group-hover:opacity-100 transition text-p_teal/50">
                  <Plus size={14} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel bg-gray-900/95 backdrop-blur-2xl rounded-[2rem] w-full max-w-md p-8 shadow-2xl relative animate-scale-in border border-white/10">
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors shadow-sm"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-white mb-6">
              Plan for{' '}
              <span className="text-p_teal">
                {currentDate.toLocaleDateString('default', { month: 'long' })} {selectedDay}
              </span>
            </h3>

            {errorMessage && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-sm font-bold flex items-center gap-2 animate-fade-in">
                    <AlertCircle size={16} />
                    {errorMessage}
                </div>
            )}

            <div className="space-y-6">
              {/* Event Title */}
              <div>
                <label
                  htmlFor="event-title"
                  className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2"
                >
                  Occasion / Title
                </label>
                <input
                  id="event-title"
                  type="text"
                  maxLength={80}
                  className="w-full glass-input rounded-xl p-3 focus:border-p_teal focus:outline-none font-medium text-white border border-white/10 transition placeholder:text-gray-500 bg-gray-800/30"
                  placeholder="e.g. Dinner Date"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                />
              </div>

              {/* Outfit Selector */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  Select Saved Look
                </label>
                <div className="grid grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                  {savedOutfits.map((outfit) => (
                    <button
                      key={outfit.id}
                      type="button"
                      onClick={() => setSelectedOutfitId(outfit.id)}
                      className={`border rounded-xl p-3 cursor-pointer transition flex flex-col items-center gap-2 ${
                        selectedOutfitId === outfit.id
                          ? 'border-p_teal/50 bg-p_teal/10 shadow-sm'
                          : 'border-white/10 bg-gray-800/30 hover:border-p_teal/40 hover:bg-gray-800/60'
                      }`}
                    >
                      <div className="flex -space-x-2 justify-center">
                        {outfit.items.slice(0, 3).map((item, idx) => (
                          <img
                            key={idx}
                            src={item.image}
                            className="w-10 h-10 rounded-full border-2 border-gray-800 object-cover shadow-sm"
                            alt={item.category}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                        {outfit.items.length} Item{outfit.items.length !== 1 ? 's' : ''}
                      </p>
                    </button>
                  ))}
                  {savedOutfits.length === 0 && (
                    <p className="text-sm text-gray-500 col-span-2 text-center py-6 border-2 border-dashed border-white/10 rounded-xl font-medium">
                      No saved looks yet.{' '}
                      <span className="text-p_teal">Go to Closet to create one!</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 text-gray-300 font-bold btn-glass-secondary border border-white/10 rounded-xl transition-all shadow-sm hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEvent}
                  className="flex-1 py-3 btn-glass-primary text-white font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 active:scale-95"
                >
                  Save Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
