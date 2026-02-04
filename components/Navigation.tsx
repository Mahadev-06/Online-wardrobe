
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, Shirt, PlusCircle, Settings, Sparkles } from 'lucide-react';

interface NavigationProps {
    isExpanded: boolean;
    toggleSidebar: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ isExpanded, toggleSidebar }) => {
  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: <LayoutGrid size={24} /> },
    { to: "/closet", label: "Closet", icon: <Shirt size={24} /> },
    { to: "/upload", label: "Add Item", icon: <PlusCircle size={24} /> },
    { to: "/mannequin", label: "AI Stylist", icon: <Sparkles size={24} /> },
    { to: "/settings", label: "Settings", icon: <Settings size={24} /> },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div 
        className={`hidden md:flex fixed top-0 left-0 h-screen bg-p_dark text-white flex-col z-50 shadow-xl transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'w-64' : 'w-20'}`}
      >
        {/* Logo Area */}
        <div 
            className="h-20 flex items-center px-5 gap-4 whitespace-nowrap shrink-0 cursor-pointer group"
            onDoubleClick={toggleSidebar}
        >
            <div className="min-w-[2.5rem] w-10 h-10 bg-p_red rounded-lg flex items-center justify-center font-cotta text-2xl shadow-lg shrink-0 text-white pt-1 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">W</div>
            <span className={`font-cotta text-2xl tracking-wide transition-opacity duration-300 text-white ${isExpanded ? 'opacity-100' : 'opacity-0'} group-hover:text-p_cream transition-colors`}>Wardrobe</span>
        </div>

        {/* Links */}
        <div className="flex-1 px-3 py-4 space-y-2">
            {navLinks.map((link) => (
                <NavLink 
                    key={link.to} 
                    to={link.to}
                    onDoubleClick={(e) => {
                        e.preventDefault(); // Prevent accidental selection
                        toggleSidebar();
                    }}
                    className={({ isActive }) => 
                        `group flex items-center h-12 px-3 rounded-xl transition-all duration-200 font-medium whitespace-nowrap overflow-hidden select-none ${
                            isActive 
                            ? 'bg-p_red text-white shadow-lg translate-x-1' 
                            : 'text-gray-300 hover:bg-white/10 hover:text-white hover:translate-x-1'
                        }`
                    }
                    title={!isExpanded ? link.label : ''}
                >
                    <div className="min-w-[2.5rem] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                        {link.icon}
                    </div>
                    <span className={`transition-opacity duration-300 ml-3 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>{link.label}</span>
                </NavLink>
            ))}
        </div>
        
        {/* Hint text at bottom when collapsed */}
        {!isExpanded && (
             <div className="p-4 text-center text-[10px] text-gray-500 opacity-50 select-none">
                 Double click to expand
             </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-4 pb-safe">
        <div className="flex justify-between items-center h-16">
            {navLinks.map((link) => (
                <NavLink 
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) => 
                        `flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 ${
                            isActive ? 'text-p_red -translate-y-1' : 'text-gray-400 hover:text-p_dark hover:-translate-y-0.5'
                        }`
                    }
                >
                    <div className="transition-transform duration-300 hover:scale-110">
                         {React.cloneElement(link.icon as React.ReactElement<any>, { size: 24 })}
                    </div>
                    <span className="text-[10px] font-bold">{link.label}</span>
                </NavLink>
            ))}
        </div>
      </div>
    </>
  );
};

export default Navigation;
