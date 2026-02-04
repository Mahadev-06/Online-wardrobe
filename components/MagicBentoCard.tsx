import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface MagicBentoCardProps {
  children: React.ReactNode;
  className?: string;
  to?: string;
  state?: any;
  onClick?: () => void;
  noHover?: boolean;
}

const MagicBentoCard: React.FC<MagicBentoCardProps> = ({ children, className = '', to, state, onClick, noHover = false }) => {
  // Use a union type to allow ref to be assigned to both div and anchor tags
  const cardRef = useRef<HTMLDivElement | HTMLAnchorElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty('--glow-x', `${x}px`);
      card.style.setProperty('--glow-y', `${y}px`);
      card.style.setProperty('--glow-opacity', '1');
    };

    const handleMouseLeave = () => {
      card.style.setProperty('--glow-opacity', '0');
    };

    // Cast as generic EventListener to avoid specific MouseEvent type conflicts during add/remove
    card.addEventListener('mousemove', handleMouseMove as unknown as EventListener);
    card.addEventListener('mouseleave', handleMouseLeave as unknown as EventListener);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove as unknown as EventListener);
      card.removeEventListener('mouseleave', handleMouseLeave as unknown as EventListener);
    };
  }, []);

  const baseClasses = `magic-bento-card rounded-3xl p-6 ${className}`;

  if (to) {
    return (
      <Link 
        ref={cardRef as React.RefObject<HTMLAnchorElement>} 
        to={to} 
        state={state} 
        className={`${baseClasses} block`}
      >
        <div className="magic-bento-content h-full flex flex-col justify-between">
          {children}
        </div>
      </Link>
    );
  }

  return (
    <div 
      ref={cardRef as React.RefObject<HTMLDivElement>} 
      className={baseClasses} 
      onClick={onClick}
    >
      <div className="magic-bento-content h-full flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
};

export default MagicBentoCard;