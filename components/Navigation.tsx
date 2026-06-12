import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, Shirt, PlusCircle, Settings, Calendar, Sparkles } from 'lucide-react';

interface NavigationProps {
  isExpanded: boolean;
  toggleSidebar: () => void;
}

/** All top-level routes shown in the sidebar/bottom-nav. */
const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutGrid size={22} /> },
  { to: '/closet',    label: 'Closet',    icon: <Shirt size={22} /> },
  { to: '/upload',    label: 'Add Item',  icon: <PlusCircle size={22} /> },

  { to: '/calendar',  label: 'Calendar',  icon: <Calendar size={22} /> },
  { to: '/stylist',   label: 'AI Stylist', icon: <Sparkles size={22} /> },
  { to: '/settings',  label: 'Settings',  icon: <Settings size={22} /> },
] as const;

const Navigation: React.FC<NavigationProps> = ({ isExpanded, toggleSidebar }) => {
  return (
    <>

      {/* ── Desktop Fixed Logo ────────────────────────────────────────────── */}
      <div className="hidden md:flex fixed top-8 left-8 items-center gap-4 z-50 cursor-pointer select-none">
        <div className="w-12 h-12 bg-p_teal/10 border border-p_teal/20 rounded-full flex items-center justify-center font-cotta text-3xl shadow-lg shrink-0 text-p_teal pt-1 transition-transform duration-300 hover:rotate-6 hover:scale-110">
          W
        </div>
      </div>

      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <aside
        className={`
          hidden md:flex fixed top-1/2 -translate-y-1/2 left-8 h-auto
          bg-[#1A2238]/85 backdrop-blur-2xl text-white flex-col z-50 shadow-2xl border border-white/10
          transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] w-[76px] rounded-[2.5rem] py-6
        `}
        aria-label="Main navigation"
      >
        {/* Nav Links */}
        <nav className="flex flex-col items-center space-y-5 w-full relative z-[60]">
          {NAV_LINKS.map((link) => (
            <div key={link.to} className="relative group w-full flex justify-center">
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center justify-center w-[46px] h-[46px] rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] select-none bg-transparent ${
                    isActive
                      ? 'text-p_teal border border-p_teal/30 shadow-[0_0_15px_rgba(255,90,80,0.15)] bg-p_teal/5'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <div className={`transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {link.icon}
                  </div>
                )}
              </NavLink>
              
              {/* Tooltip on Hover */}
              <div className="absolute left-[calc(100%+16px)] top-1/2 -translate-y-1/2 px-4 py-2 bg-[#1A2238] text-white text-xs font-bold rounded-xl opacity-0 -translate-x-2 pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:opacity-100 group-hover:translate-x-0 border border-white/10 whitespace-nowrap shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-[99]">
                {link.label}
              </div>
            </div>
          ))}
        </nav>

      </aside>

      {/* ── Mobile Bottom Navigation ─────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-5 left-4 right-4 bg-[#1A2238]/95 backdrop-blur-2xl border border-white/10 z-50 rounded-[2.5rem] shadow-[0_10px_35px_rgba(0,0,0,0.35)] safe-area-inset-bottom pb-safe p-2"
        aria-label="Mobile navigation"
      >
        <div className="flex justify-between items-center h-12">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center justify-center transition-all duration-300 ease-out ${
                  isActive 
                    ? 'bg-p_teal text-white px-3 py-2 rounded-full shadow-[0_0_15px_rgba(255,90,80,0.4)] scale-105 font-bold' 
                    : 'text-gray-400 hover:text-white px-2 py-2'
                }`
              }
            >
              {({ isActive }) => (
                <div className="flex items-center gap-1.5">
                  <div className="transition-transform duration-300">
                    {React.cloneElement(link.icon as React.ReactElement<{ size?: number }>, { size: isActive ? 16 : 20 })}
                  </div>
                  {isActive && (
                    <span className="text-[9px] font-black tracking-wider uppercase font-mono transition-all duration-300 whitespace-nowrap">
                      {link.label}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ── Mobile Top Header ─────────────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#1A2238]/75 backdrop-blur-md border-b border-white/5 z-50 flex items-center justify-between px-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-p_teal rounded-full flex items-center justify-center font-cotta text-lg shadow-lg shrink-0 text-white pt-0.5">
            W
          </div>
          <span className="font-cotta text-xl font-bold tracking-wide text-white">
            Wardrobe
          </span>
        </div>
      </header>
    </>
  );
};

export default Navigation;
