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
        <div className="flex items-center justify-between p-6 md:p-8 border-b-2 border-[#0a0f1a]">
          <button
            onClick={handlePrevMonth}
            className="p-3 rounded-none btn-glass-secondary border-2 border-[#0a0f1a] text-[#0a0f1a] hover:bg-gray-105 shadow-[2px_2px_0_#0a0f1a] transition-all"
            aria-label="Previous month"
          >
            <ChevronLeft size={22} />
          </button>
          <h2 className="text-xl md:text-2xl font-black text-[#0a0f1a]">{monthLabel}</h2>
          <button
            onClick={handleNextMonth}
            className="p-3 rounded-none btn-glass-secondary border-2 border-[#0a0f1a] text-[#0a0f1a] hover:bg-gray-105 shadow-[2px_2px_0_#0a0f1a] transition-all"
            aria-label="Next month"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b-2 border-[#0a0f1a] bg-gray-100">
          {DAYS_OF_WEEK.map((d) => (
            <div
              key={d}
              className="py-3 md:py-4 text-center text-[10px] md:text-xs font-black text-[#0a0f1a] uppercase tracking-widest"
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
              className="min-h-[80px] md:min-h-[120px] bg-gray-100/40 border-b border-r border-[#0a0f1a]"
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
                className={`min-h-[80px] md:min-h-[120px] p-2 md:p-3 border-b border-r border-[#0a0f1a] cursor-pointer hover:bg-gray-50 transition relative group text-left w-full ${
                  isToday ? 'bg-[#FF5A50]/15' : ''
                }`}
                aria-label={`${monthLabel} ${day}`}
              >
                <span
                  className={`text-xs md:text-sm font-black w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-none border border-[#0a0f1a] shadow-[1.5px_1.5px_0_#0a0f1a] transition ${
                    isToday
                      ? 'bg-[#FF5A50] text-white'
                      : 'text-[#0a0f1a]/70 group-hover:text-[#0a0f1a] group-hover:bg-gray-100'
                  }`}
                >
                  {day}
                </span>

                <div className="mt-1.5 md:mt-3 space-y-1">
                  {events.map((evt, idx) => (
                    <div
                      key={idx}
                      className="text-[9px] md:text-xs font-bold bg-[#FF5A50] border border-[#0a0f1a] text-white px-2 py-1 rounded-none truncate shadow-[1.5px_1.5px_0_#0a0f1a]"
                      title={evt.title}
                    >
                      {evt.title}
                    </div>
                  ))}
                </div>

                {/* Add hint */}
                <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 opacity-0 group-hover:opacity-100 transition text-[#FF5A50]/80">
                  <Plus size={14} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0a0f1a]/85 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel rounded-none w-full max-w-md p-8 shadow-[6px_6px_0_#0a0f1a] relative animate-scale-in border-2 border-[#0a0f1a]">
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-none border-2 border-[#0a0f1a] bg-white text-[#0a0f1a] hover:bg-gray-100 transition-colors shadow-[2px_2px_0_#0a0f1a]"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-[#0a0f1a] mb-6">
              Plan for{' '}
              <span className="text-[#FF5A50]">
                {currentDate.toLocaleDateString('default', { month: 'long' })} {selectedDay}
              </span>
            </h3>

            {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 text-red-750 border-2 border-[#0a0f1a] rounded-none text-sm font-bold flex items-center gap-2 animate-fade-in shadow-[2px_2px_0_#0a0f1a]">
                    <AlertCircle size={16} />
                    {errorMessage}
                </div>
            )}

            <div className="space-y-6">
              {/* Event Title */}
              <div>
                <label
                  htmlFor="event-title"
                  className="block text-[10px] font-black text-[#0a0f1a]/70 uppercase tracking-widest mb-2 font-mono"
                >
                  Occasion / Title
                </label>
                <input
                  id="event-title"
                  type="text"
                  maxLength={80}
                  className="w-full bg-gray-50 border-2 border-[#0a0f1a] focus:bg-white focus:border-[#FF5A50] focus:outline-none px-4 py-3 font-mono text-sm font-bold text-[#0a0f1a] placeholder:text-gray-400 transition-all rounded-none shadow-[2px_2px_0_#0a0f1a] focus:shadow-[3px_3px_0_#FF5A50]"
                  placeholder="e.g. Dinner Date"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                />
              </div>

              {/* Outfit Selector */}
              <div>
                <label className="block text-[10px] font-black text-[#0a0f1a]/70 uppercase tracking-widest mb-2 font-mono">
                  Select Saved Look
                </label>
                <div className="grid grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                  {savedOutfits.map((outfit) => (
                    <button
                      key={outfit.id}
                      type="button"
                      onClick={() => setSelectedOutfitId(outfit.id)}
                      className={`border-2 rounded-none p-3 cursor-pointer transition flex flex-col items-center gap-2 ${
                        selectedOutfitId === outfit.id
                          ? 'border-[#FF5A50] bg-red-50 shadow-[3px_3px_0_#0a0f1a] translate-x-[-1px] translate-y-[-1px]'
                          : 'border-[#0a0f1a] bg-white shadow-[2px_2px_0_#0a0f1a] hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex -space-x-2 justify-center">
                        {outfit.items.slice(0, 3).map((item, idx) => (
                          <img
                            key={idx}
                            src={item.image}
                            className="w-10 h-10 rounded-none border border-[#0a0f1a] object-cover shadow-[1px_1px_0_#0a0f1a]"
                            alt={item.category}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] font-bold text-[#0a0f1a]/60 uppercase tracking-wide">
                        {outfit.items.length} Item{outfit.items.length !== 1 ? 's' : ''}
                      </p>
                    </button>
                  ))}
                  {savedOutfits.length === 0 && (
                    <p className="text-sm text-[#0a0f1a]/60 col-span-2 text-center py-6 border-2 border-dashed border-[#0a0f1a] rounded-none font-bold bg-gray-50">
                      No saved looks yet.{' '}
                      <span className="text-[#FF5A50]">Go to Closet to create one!</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 text-[#0a0f1a] font-bold bg-gray-100 border-2 border-[#0a0f1a] rounded-none shadow-[3px_3px_0_#0a0f1a] hover:bg-gray-200 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#0a0f1a] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEvent}
                  className="flex-1 py-3 bg-[#FF5A50] border-2 border-[#0a0f1a] text-white font-bold rounded-none shadow-[3px_3px_0_#0a0f1a] hover:bg-[#E04B42] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#0a0f1a] transition-all"
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
