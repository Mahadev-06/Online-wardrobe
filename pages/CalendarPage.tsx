
import React, { useState } from 'react';
import { useWardrobe } from '../context/WardrobeContext';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const CalendarPage: React.FC = () => {
  const { savedOutfits, calendarEvents, addCalendarEvent } = useWardrobe();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [selectedOutfitId, setSelectedOutfitId] = useState('');

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const eventsForDay = (day: number) => {
      const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
      return calendarEvents.filter(e => new Date(e.date).toDateString() === dateStr);
  };

  const handleAddEvent = () => {
    if (!selectedDay || !selectedOutfitId || !eventTitle) return;
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay);
    
    addCalendarEvent({
        date: date.toISOString(),
        title: eventTitle,
        outfitId: selectedOutfitId
    });
    
    setShowModal(false);
    setEventTitle('');
    setSelectedOutfitId('');
  };

  return (
    <div className="px-6 py-10 md:px-12 md:py-14 pb-32 max-w-6xl mx-auto page-enter">
        <h1 className="text-3xl font-black text-slate-800 mb-10">Plan Your Looks</h1>
        
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-slate-100">
                <button onClick={handlePrevMonth} className="p-3 hover:bg-slate-100 rounded-full transition"><ChevronLeft size={24} /></button>
                <h2 className="text-2xl font-bold text-slate-800">
                    {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <button onClick={handleNextMonth} className="p-3 hover:bg-slate-100 rounded-full transition"><ChevronRight size={24} /></button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 auto-rows-fr">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="min-h-[140px] bg-slate-50/30 border-b border-r border-slate-100" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const events = eventsForDay(day);
                    const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                    
                    return (
                        <div 
                            key={day} 
                            onClick={() => { setSelectedDay(day); setShowModal(true); }}
                            className={`min-h-[140px] p-3 border-b border-r border-slate-100 cursor-pointer hover:bg-slate-50 transition relative group ${isToday ? 'bg-indigo-50/30' : ''}`}
                        >
                            <span className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full transition ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-700 group-hover:bg-white group-hover:shadow-sm'}`}>
                                {day}
                            </span>
                            
                            <div className="mt-3 space-y-1.5">
                                {events.map((evt, idx) => (
                                    <div key={idx} className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2.5 py-1.5 rounded-lg truncate shadow-sm">
                                        {evt.title}
                                    </div>
                                ))}
                            </div>
                            
                            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition text-slate-400">
                                <Plus size={16} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Modal */}
        {showModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-[2rem] w-full max-w-md p-8 shadow-2xl animate-scale-in">
                    <h3 className="text-xl font-black text-slate-800 mb-6">Plan for {currentDate.toLocaleDateString('default', {month:'long'})} {selectedDay}</h3>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Occasion / Title</label>
                            <input 
                                type="text" 
                                className="w-full border-2 border-slate-100 rounded-xl p-3 focus:border-indigo-500 focus:outline-none font-medium"
                                placeholder="e.g. Dinner Date" 
                                value={eventTitle}
                                onChange={(e) => setEventTitle(e.target.value)}
                            />
                        </div>

                        <div>
                             <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Select Saved Look</label>
                             <div className="grid grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                                 {savedOutfits.map(outfit => (
                                     <div 
                                        key={outfit.id} 
                                        onClick={() => setSelectedOutfitId(outfit.id)}
                                        className={`border-2 rounded-xl p-3 cursor-pointer transition flex flex-col items-center gap-2 ${selectedOutfitId === outfit.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-slate-300'}`}
                                     >
                                         <div className="flex -space-x-2 justify-center">
                                             {outfit.items.slice(0, 3).map((item, idx) => (
                                                 <img key={idx} src={item.image} className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm" />
                                             ))}
                                         </div>
                                         <p className="text-[10px] font-bold text-slate-500 uppercase">{outfit.items.length} Items</p>
                                     </div>
                                 ))}
                                 {savedOutfits.length === 0 && <p className="text-sm text-slate-400 col-span-2 text-center py-6 border-2 border-dashed border-slate-100 rounded-xl">No saved looks yet. Go to AI Stylist to create one!</p>}
                             </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition">Cancel</button>
                            <button onClick={handleAddEvent} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg transition transform hover:-translate-y-0.5">Save Plan</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default CalendarPage;
