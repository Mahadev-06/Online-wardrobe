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
        <div className="flex items-center justify-between p-6 md:p-8 border-b border-p_dark/10">
          <button
            onClick={handlePrevMonth}
            className="p-3 rounded-full btn-glass-secondary border border-p_dark/15 text-p_dark hover:text-p_dark/80"
            aria-label="Previous month"
          >
            <ChevronLeft size={22} />
          </button>
          <h2 className="text-xl md:text-2xl font-black text-p_dark">{monthLabel}</h2>
          <button
            onClick={handleNextMonth}
            className="p-3 rounded-full btn-glass-secondary border border-p_dark/15 text-p_dark hover:text-p_dark/80"
            aria-label="Next month"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-p_dark/10 bg-p_dark/5">
          {DAYS_OF_WEEK.map((d) => (
            <div
              key={d}
              className="py-3 md:py-4 text-center text-[10px] md:text-xs font-black text-p_dark/60 uppercase tracking-widest"
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
              className="min-h-[80px] md:min-h-[120px] bg-p_dark/5 border-b border-r border-p_dark/10"
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
                className={`min-h-[80px] md:min-h-[120px] p-2 md:p-3 border-b border-r border-p_dark/10 cursor-pointer hover:bg-p_dark/5 transition relative group text-left w-full ${
                  isToday ? 'bg-p_teal/10' : ''
                }`}
                aria-label={`${monthLabel} ${day}`}
              >
                <span
                  className={`text-xs md:text-sm font-bold w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full transition ${
                    isToday
                      ? 'bg-p_teal/90 text-white shadow-sm shadow-p_teal/30 border border-p_dark/10'
                      : 'text-p_dark/60 group-hover:text-p_dark group-hover:bg-p_dark/5'
                  }`}
                >
                  {day}
                </span>

                <div className="mt-1.5 md:mt-3 space-y-1">
                  {events.map((evt, idx) => (
                    <div
                      key={idx}
                      className="text-[9px] md:text-xs font-bold bg-p_teal/10 border border-p_teal/35 text-p_dark px-2 py-1 rounded-[2.5rem] truncate shadow-sm"
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
        <div className="fixed inset-0 bg-p_dark/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel rounded-[2rem] w-full max-w-md p-8 shadow-2xl relative animate-scale-in border border-p_dark/10">
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-p_dark/5 text-p_dark/60 hover:text-p_dark transition-colors shadow-sm"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-p_dark mb-6">
              Plan for{' '}
              <span className="text-p_teal">
                {currentDate.toLocaleDateString('default', { month: 'long' })} {selectedDay}
              </span>
            </h3>

            {errorMessage && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-450 rounded-[2.5rem] text-sm font-bold flex items-center gap-2 animate-fade-in">
                    <AlertCircle size={16} />
                    {errorMessage}
                </div>
            )}

            <div className="space-y-6">
              {/* Event Title */}
              <div>
                <label
                  htmlFor="event-title"
                  className="block text-[10px] font-black text-p_dark/60 uppercase tracking-widest mb-2"
                >
                  Occasion / Title
                </label>
                <input
                  id="event-title"
                  type="text"
                  maxLength={80}
                  className="w-full glass-input rounded-[2.5rem] p-3 focus:border-p_teal focus:outline-none font-medium text-p_dark border border-p_dark/15 transition placeholder:text-p_dark/45 bg-white/40"
                  placeholder="e.g. Dinner Date"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                />
              </div>

              {/* Outfit Selector */}
              <div>
                <label className="block text-[10px] font-black text-p_dark/60 uppercase tracking-widest mb-2">
                  Select Saved Look
                </label>
                <div className="grid grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                  {savedOutfits.map((outfit) => (
                    <button
                      key={outfit.id}
                      type="button"
                      onClick={() => setSelectedOutfitId(outfit.id)}
                      className={`border rounded-[2.5rem] p-3 cursor-pointer transition flex flex-col items-center gap-2 ${
                        selectedOutfitId === outfit.id
                          ? 'border-p_teal/50 bg-p_teal/10 shadow-sm'
                          : 'border-p_dark/10 bg-white/50 hover:border-p_teal/40 hover:bg-white/80'
                      }`}
                    >
                      <div className="flex -space-x-2 justify-center">
                        {outfit.items.slice(0, 3).map((item, idx) => (
                          <img
                            key={idx}
                            src={item.image}
                            className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm"
                            alt={item.category}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] font-bold text-p_dark/60 uppercase tracking-wide">
                        {outfit.items.length} Item{outfit.items.length !== 1 ? 's' : ''}
                      </p>
                    </button>
                  ))}
                  {savedOutfits.length === 0 && (
                    <p className="text-sm text-p_dark/50 col-span-2 text-center py-6 border-2 border-dashed border-p_dark/15 rounded-[2.5rem] font-medium">
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
                  className="flex-1 py-3 text-p_dark font-bold btn-glass-secondary border border-p_dark/15 rounded-[2.5rem] hover:text-p_dark/80"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEvent}
                  className="flex-1 py-3 btn-glass-primary text-white font-bold rounded-[2.5rem]"
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
