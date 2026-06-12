import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    label?: string;
    placeholder?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, label, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative mb-6">
            {label && <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{label}</label>}
            <div 
                className="w-full p-4 rounded-[2rem] glass-input border border-white/10 font-bold text-white shadow-sm cursor-pointer flex justify-between items-center transition-all hover:bg-white/5 hover:shadow-md"
                onClick={() => setIsOpen(!isOpen)}
            >
                {value || <span className="text-gray-500">{placeholder || 'Select an option'}</span>}
                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute z-50 w-full mt-2 bg-[#0a0f12]/95 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.5)] overflow-hidden animate-scale-in max-h-60 overflow-y-auto p-1.5 scrollbar-hide">
                        {options.map(opt => (
                            <div 
                                key={opt}
                                className={`p-3 md:p-3.5 font-bold cursor-pointer transition-all duration-300 rounded-[2.5rem] mb-1 last:mb-0 ${value === opt ? 'bg-p_teal/20 text-p_teal shadow-sm' : 'text-gray-400 hover:bg-white/5 hover:text-white hover:pl-5'}`}
                                onClick={() => { onChange(opt); setIsOpen(false); }}
                            >
                                {opt}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default CustomSelect;
