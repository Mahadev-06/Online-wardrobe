import { create } from 'zustand';
import { CalendarEvent } from '../types';
import { supabase } from '../services/supabase';

interface CalendarState {
  calendarEvents: CalendarEvent[];
  setCalendarEvents: (events: CalendarEvent[]) => void;
  addCalendarEvent: (event: CalendarEvent, userId: string) => Promise<void>;
  deleteCalendarEvent: (id: string) => Promise<void>;
  updateCalendarEvent: (event: CalendarEvent, userId: string) => Promise<void>;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  calendarEvents: [],

  setCalendarEvents: (calendarEvents) => set({ calendarEvents }),

  addCalendarEvent: async (event, userId) => {
    try {
      const { data, error } = await supabase.from('calendar_events').insert({
        user_id: userId,
        date: event.date,
        title: event.title,
        outfit_id: event.outfitId || null
      }).select().single();
      if (error) throw error;

      set(state => ({ calendarEvents: [...state.calendarEvents, { ...event, id: data.id }] }));
      console.log('Event added to calendar!');
    } catch (error: any) {
      console.error('Could not add event: ' + error.message);
      throw error;
    }
  },

  deleteCalendarEvent: async (id) => {
    try {
      const { error } = await supabase.from('calendar_events').delete().eq('id', id);
      if (error) throw error;
      set(state => ({ calendarEvents: state.calendarEvents.filter(e => e.id !== id) }));
      console.log('Event deleted from calendar!');
    } catch (error: any) {
      console.error('Could not delete event: ' + error.message);
      throw error;
    }
  },

  updateCalendarEvent: async (event, userId) => {
    if (!event.id) return;
    try {
      const { error } = await supabase.from('calendar_events').update({
        date: event.date,
        title: event.title,
        outfit_id: event.outfitId || null
      }).eq('id', event.id);
      if (error) throw error;

      set(state => ({ calendarEvents: state.calendarEvents.map(e => e.id === event.id ? event : e) }));
      console.log('Event updated in calendar!');
    } catch (error: any) {
      console.error('Could not update event: ' + error.message);
      throw error;
    }
  }
}));
