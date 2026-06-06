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
          hidden md:flex fixed top-0 left-0 h-screen
          bg-p_dark/80 backdrop-blur-2xl text-white flex-col z-50 shadow-2xl border-r border-white/10
          transition-all duration-300 ease-in-out overflow-hidden
          ${isExpanded ? 'w-64' : 'w-20'}
        `}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div
          className="h-20 flex items-center px-5 gap-4 whitespace-nowrap shrink-0 cursor-pointer group"
          onClick={toggleSidebar}
          title="Click to toggle sidebar"
        >
          <div className="min-w-[2.5rem] w-10 h-10 bg-p_teal rounded-lg flex items-center justify-center font-cotta text-2xl shadow-lg shrink-0 text-white pt-1 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
            W
          </div>
          <span
            className={`font-cotta text-2xl tracking-wide text-white transition-opacity duration-300 group-hover:text-gray-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}
          >
            Wardrobe
          </span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              title={!isExpanded ? link.label : undefined}
              className={({ isActive }) =>
                `group flex items-center h-12 px-3 rounded-2xl transition-all duration-300 font-medium whitespace-nowrap overflow-hidden select-none relative ${
                  isActive
                    ? 'text-white shadow-lg translate-x-1'
                    : 'text-gray-400 hover:text-white hover:translate-x-1'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active/Hover Background */}
                  <div className={`absolute inset-0 bg-gradient-to-r from-p_teal/90 to-p_teal/60 rounded-2xl transition-opacity duration-300 -z-10 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-hover:from-white/10 group-hover:to-white/5'}`} />
                  <div className="min-w-[2.5rem] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    {link.icon}
                  </div>
                  <span
                    className={`transition-opacity duration-300 ml-3 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}
                  >
                    {link.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

      </aside>

      {/* ── Mobile Bottom Navigation ─────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-4 left-4 right-4 bg-p_dark/80 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-3xl z-50 safe-area-inset-bottom"
        aria-label="Mobile navigation"
      >
        <div className="flex justify-around items-center h-16 px-2">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-all duration-300 relative group px-0.5 ${
                  isActive ? 'text-p_teal -translate-y-1' : 'text-gray-400 hover:text-white hover:-translate-y-0.5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active Glow */}
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-1 bg-p_teal rounded-full blur-sm transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                  <div className="transition-transform duration-300 hover:scale-110">
                    {React.cloneElement(link.icon as React.ReactElement<{ size?: number }>, { size: 20 })}
                  </div>
                  <span className="text-[8px] sm:text-[9px] font-bold leading-none text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[45px] sm:max-w-none">{link.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ── Mobile Top Header ─────────────────────────────────────────────── */}
      <header className="md:hidden fixed top-4 left-4 right-4 h-16 bg-[#0a0f12]/80 backdrop-blur-2xl border border-white/10 rounded-2xl z-50 flex items-center px-5 shadow-2xl">
        <div className="w-8 h-8 bg-p_teal rounded-lg flex items-center justify-center font-cotta text-xl shadow-lg shrink-0 text-white pt-0.5">
          W
        </div>
        <span className="font-cotta text-xl tracking-wide text-white ml-3">
          Wardrobe
        </span>
      </header>
    </>
  );
};

export default Navigation;
