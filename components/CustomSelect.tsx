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
            {label && <label className="block text-xs font-bold text-[#0a0f1a] uppercase tracking-widest mb-3">{label}</label>}
            <div 
                className="w-full p-4 rounded-none bg-gray-50 border-2 border-[#0a0f1a] font-bold text-[#0a0f1a] shadow-[2px_2px_0_#0a0f1a] cursor-pointer flex justify-between items-center transition-all hover:bg-white focus-within:border-[#FF5A50]"
                onClick={() => setIsOpen(!isOpen)}
            >
                {value || <span className="text-gray-400">{placeholder || 'Select an option'}</span>}
                <ChevronDown className={`w-5 h-5 text-[#0a0f1a] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute z-50 w-full mt-2 bg-white border-2 border-[#0a0f1a] rounded-none shadow-[4px_4px_0_#0a0f1a] overflow-hidden animate-scale-in max-h-60 overflow-y-auto p-1.5 scrollbar-hide">
                        {options.map(opt => (
                            <div 
                                key={opt}
                                className={`p-3 md:p-3.5 font-bold cursor-pointer transition-all duration-200 rounded-none mb-1 last:mb-0 ${value === opt ? 'bg-[#FF5A50] text-white shadow-sm' : 'text-[#0a0f1a]/85 hover:bg-gray-100 hover:text-[#0a0f1a]'}`}
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
