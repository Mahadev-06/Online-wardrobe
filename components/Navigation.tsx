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
      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <aside
        className={`
          hidden md:flex fixed top-4 bottom-4 left-4
          bg-[#0d1325] text-white flex-col z-50 border-2 border-white/10 shadow-[4px_4px_0_rgba(255,90,80,0.15)]
          transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] w-[60px] rounded-none
        `}
        aria-label="Main navigation"
      >
        {/* Logo at Top */}
        <div className="flex items-center justify-center py-4 border-b border-white/10">
          <div className="w-9 h-9 bg-[#FF5A50] border-2 border-white/20 flex items-center justify-center font-mono text-lg shadow-[2px_2px_0_rgba(255,90,80,0.3)] shrink-0 text-white font-black transition-transform duration-300 hover:rotate-6 hover:scale-110 cursor-pointer">
            W
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex flex-col items-center space-y-1.5 w-full relative z-[60] flex-1 py-3">
          {NAV_LINKS.map((link) => (
            <div key={link.to} className="relative group w-full flex justify-center">
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center justify-center w-[40px] h-[40px] rounded-none transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] select-none bg-transparent ${
                    isActive
                      ? 'text-white border-2 border-[#FF5A50] shadow-[2px_2px_0_rgba(255,90,80,0.3)] bg-[#FF5A50]/10'
                      : 'text-gray-400 hover:text-white border border-transparent hover:border-white/10 hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <div className={`transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {React.cloneElement(link.icon as React.ReactElement<{ size?: number }>, { size: 18 })}
                  </div>
                )}
              </NavLink>

              {/* Tooltip on Hover */}
              <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-[#0d1325] text-white text-[10px] font-mono font-bold rounded-none opacity-0 -translate-x-2 pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:opacity-100 group-hover:translate-x-0 border-2 border-white/10 whitespace-nowrap shadow-[2px_2px_0_rgba(255,90,80,0.2)] z-[99] uppercase tracking-wider">
                {link.label}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom accent line */}
        <div className="h-1 bg-[#FF5A50] w-full" />
      </aside>

      {/* ── Mobile Bottom Navigation ─────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-5 left-4 right-4 bg-[#0d1325] border-2 border-white/10 z-50 rounded-none shadow-[4px_4px_0_rgba(255,90,80,0.15)] safe-area-inset-bottom pb-safe p-2"
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
                    ? 'bg-[#FF5A50] text-white px-3 py-2 rounded-none border border-white/20 shadow-[2px_2px_0_rgba(255,255,255,0.2)] scale-105 font-bold'
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
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0f1a] border-b-2 border-white/10 z-50 flex items-center justify-between px-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#FF5A50] border border-white/15 flex items-center justify-center font-mono text-lg shadow-[2px_2px_0_rgba(255,90,80,0.3)] shrink-0 text-white font-black pt-0.5">
            W
          </div>
          <span className="font-mono text-xl font-black tracking-wide text-white uppercase">
            Wardrobe
          </span>
        </div>
      </header>
    </>
  );
};

export default Navigation;
