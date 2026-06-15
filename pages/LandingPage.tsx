import { Button } from "../components/ui/button";

import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView, AnimatePresence } from 'framer-motion';
import { ArrowRight, Shirt, Sparkles, Calendar, CloudSun, Upload, Wand2, Star, Hexagon, Zap, ChevronDown, Layers, Eye, Brain, TrendingUp, Shield, Palette, LayoutGrid, Heart, User } from 'lucide-react';
import Aurora from '../components/Aurora';

interface LandingPageProps {
  onSignup: () => void;
  onLogin: () => void;
}

/* ─── BRUTALIST REVEAL TEXT ─── */
const BrutalReveal: React.FC<{ text: string; className?: string; delay?: number }> = ({ text, className = '', delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <div ref={ref} className={`brutal-reveal-wrapper ${className}`} style={{ overflow: 'hidden' }}>
      <motion.div
        initial={{ y: '110%', rotate: 3, opacity: 0 }}
        animate={isInView ? { y: '0%', rotate: 0, opacity: 1 } : {}}
        transition={{ duration: 0.8, delay, ease: [0.22, 1.0, 0.36, 1.0] }}
      >
        {text}
      </motion.div>
    </div>
  );
};

/* ─── MAGNETIC HOVER BUTTON ─── */
const MagneticButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary';
}> = ({ children, onClick, className = '', variant = 'primary' }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent) => {
    const btn = ref.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setPosition({ x: x * 0.3, y: y * 0.3 });
  };

  const reset = () => setPosition({ x: 0, y: 0 });

  const baseStyle = variant === 'primary'
    ? 'bg-[#FF5A50] text-white border-3 border-[#1A2238] shadow-[4px_4px_0_#1A2238] hover:shadow-[6px_6px_0_#1A2238] hover:translate-x-[-2px] hover:translate-y-[-2px]'
    : 'bg-transparent text-white border-3 border-white/40 hover:bg-white/10';

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15 }}
      className={`relative font-black text-sm md:text-xl px-5 py-3 md:px-8 md:py-4 transition-all duration-300 cursor-pointer ${baseStyle} ${className}`}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.button>
  );
};

/* ─── GEOMETRIC FLOATING SHAPE ─── */
const FloatingShape: React.FC<{
  icon: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}> = ({ icon, className = '', delay = 0, duration = 6 }) => (
  <motion.div
    className={`absolute pointer-events-none ${className}`}
    animate={{
      y: [0, -20, 0, 20, 0],
      rotate: [0, 10, 0, -10, 0],
    }}
    transition={{
      duration,
      repeat: Infinity,
      ease: 'easeInOut',
      delay,
    }}
  >
    {icon}
  </motion.div>
);

/* ─── SCROLL PROGRESS BAR ─── */
const ScrollProgress: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-[#FF5A50] origin-left z-[9999]"
      style={{ scaleX }}
    />
  );
};

/* ─── FEATURE CARD (BRUTALIST STYLE) ─── */
const BrutalFeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  desc: string;
  index: number;
}> = ({ icon, title, desc, index }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60, rotate: index % 2 === 0 ? -2 : 2 }}
      animate={isInView ? { opacity: 1, y: 0, rotate: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="group relative bg-[#1A2238] border-3 border-white/20 p-0 hover:border-[#FF5A50] transition-all duration-500 cursor-default"
      style={{ boxShadow: '6px 6px 0 rgba(255, 90, 80, 0.3)' }}
      whileHover={{ y: -6, boxShadow: '10px 10px 0 rgba(255, 90, 80, 0.5)' }}
    >
      <div className="p-8">
        <div className="w-16 h-16 bg-[#FF5A50]/10 border-2 border-[#FF5A50]/30 flex items-center justify-center mb-6 group-hover:bg-[#FF5A50]/20 transition-colors duration-500">
          {icon}
        </div>
        <h3 className="font-black text-white text-xl md:text-2xl mb-3 tracking-wide uppercase">{title}</h3>
        <p className="text-gray-400 text-sm md:text-base leading-relaxed font-medium">{desc}</p>
      </div>
      {/* Brutalist corner accent */}
      <div className="absolute top-0 right-0 w-8 h-8 bg-[#FF5A50] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
};

/* ─── STATS COUNTER ─── */
const StatCounter: React.FC<{ value: string; label: string; delay?: number }> = ({ value, label, delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className="text-center"
    >
      <div className="font-black text-4xl md:text-6xl text-[#FF5A50] tracking-tighter">{value}</div>
      <div className="text-gray-400 text-sm md:text-base uppercase tracking-[0.15em] mt-2 font-bold">{label}</div>
    </motion.div>
  );
};

/* ─── TESTIMONIAL CARD ─── */
const TestimonialCard: React.FC<{
  quote: string;
  author: string;
  role: string;
  index: number;
}> = ({ quote, author, role, index }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.15 }}
      className="bg-[#1A2238]/80 border-2 border-white/10 p-8 relative"
      style={{ boxShadow: '4px 4px 0 rgba(255, 90, 80, 0.2)' }}
    >
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-[#FF5A50] text-[#FF5A50]" />
        ))}
      </div>
      <p className="text-gray-300 text-base leading-relaxed mb-6 italic">"{quote}"</p>
      <div>
        <div className="font-black text-white">{author}</div>
        <div className="text-gray-500 text-sm">{role}</div>
      </div>
      <div className="absolute top-6 right-6 text-6xl font-black text-[#FF5A50]/10">"</div>
    </motion.div>
  );
};

/* ─── MARQUEE STRIP ─── */
const MarqueeStrip: React.FC<{ texts: string[]; direction?: 'left' | 'right' }> = ({ texts, direction = 'left' }) => (
  <div className="overflow-hidden py-4 border-y-2 border-white/10 bg-[#FF5A50]/5">
    <motion.div
      className="flex gap-12 whitespace-nowrap"
      animate={{ x: direction === 'left' ? [0, -1920] : [-1920, 0] }}
      transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
    >
      {[...texts, ...texts, ...texts].map((text, i) => (
        <span key={i} className="text-white/20 font-black text-2xl md:text-4xl uppercase tracking-wider flex items-center gap-6">
          {text}
          <Hexagon className="w-4 h-4 text-[#FF5A50]/40" />
        </span>
      ))}
    </motion.div>
  </div>
);

/* ─── STEP CARD subcomponent to prevent hook rule violations ─── */
const StepCard: React.FC<{
  step: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  index: number;
  isLast: boolean;
}> = ({ step, title, desc, icon, index, isLast }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.2 }}
      className="text-center relative"
    >
      {/* Step Number */}
      <div className="text-8xl md:text-9xl font-black text-[#FF5A50]/10 absolute -top-4 left-1/2 -translate-x-1/2 select-none">
        {step}
      </div>
      <div className="relative z-10">
        <div className="w-20 h-20 bg-[#FF5A50]/10 border-2 border-[#FF5A50]/30 mx-auto mb-6 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="font-black text-white text-2xl mb-4 tracking-wider">{title}</h3>
        <p className="text-gray-400 leading-relaxed font-medium">{desc}</p>
      </div>

      {/* Connector line (not on last) */}
      {!isLast && (
        <div className="hidden md:block absolute top-1/3 -right-6 w-12 h-0.5 bg-[#FF5A50]/30" />
      )}
    </motion.div>
  );
};


/* ═══════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════════════ */
const LandingPage: React.FC<LandingPageProps> = ({ onSignup, onLogin }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const heroInView = useInView(heroRef, { once: false });

  // Parallax transforms
  const y1 = useTransform(scrollYProgress, [0, 0.3], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 0.3], [0, -50]);
  const opacity1 = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const scale1 = useTransform(scrollYProgress, [0, 0.2], [1, 0.9]);

  // Navbar shrink on scroll
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const features = [
    { icon: <Shirt className="w-8 h-8 text-[#FF5A50]" />, title: 'Digital Closet', desc: 'Upload, categorize, and manage your entire wardrobe digitally. Filter by color, season, or occasion.' },
    { icon: <Wand2 className="w-8 h-8 text-[#FF5A50]" />, title: 'AI Stylist', desc: 'Get AI-powered outfit recommendations based on your body type, height, weight, and personal style.' },
    { icon: <Calendar className="w-8 h-8 text-[#FF5A50]" />, title: 'Outfit Calendar', desc: 'Plan and schedule your outfits for the week. Never repeat outfits or struggle with morning decisions.' },
    { icon: <CloudSun className="w-8 h-8 text-[#FF5A50]" />, title: 'Weather Sync', desc: 'Real-time weather integration that suggests outfits matching today\'s temperature and conditions.' },
    { icon: <Upload className="w-8 h-8 text-[#FF5A50]" />, title: 'Quick Upload', desc: 'Snap a photo or upload from gallery. AI auto-detects clothing type, color, and season compatibility.' },
    { icon: <Brain className="w-8 h-8 text-[#FF5A50]" />, title: 'Smart Combos', desc: 'AI analyzes fit, proportions, and color harmony to create perfectly balanced outfit combinations.' },
  ];

  const testimonials = [
    { quote: 'This app completely transformed how I get dressed. The AI stylist is incredibly accurate with body-type recommendations.', author: 'Priya M.', role: 'Fashion Enthusiast' },
    { quote: 'I used to spend 20 minutes picking outfits. Now the calendar feature plans my entire week in seconds.', author: 'Rohan K.', role: 'Working Professional' },
    { quote: 'The weather sync feature is genius. I never leave the house underdressed or overdressed anymore.', author: 'Ananya S.', role: 'College Student' },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-transparent text-white overflow-x-hidden relative">
      <ScrollProgress />

      {/* ═══ NAVBAR ═══ */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-[#0a0f1a]/95 backdrop-blur-xl border-b border-white/10 py-3'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-2 sm:gap-3 cursor-default group"
            whileHover={{ scale: 1.02 }}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#FF5A50] flex items-center justify-center text-white font-black text-lg sm:text-xl border-2 border-white/20 rotate-3 group-hover:rotate-12 transition-transform duration-500"
                 style={{ boxShadow: '3px 3px 0 rgba(255,255,255,0.2)' }}>
              W
            </div>
            <span className="font-black text-white text-xl sm:text-2xl tracking-tight">
              WARDROBE
              <span className="text-[#FF5A50]">.</span>
            </span>
          </motion.div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {['Home', 'About', 'Contact', 'More'].map((item) => (
              <a
                key={item}
                href={item === 'Home' ? '#' : `#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="text-gray-400 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors duration-300 relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#FF5A50] group-hover:w-full transition-all duration-300" />
              </a>
            ))}

            <span className="w-px h-4 bg-white/20" />

            {/* User Icon (Sign In) */}
            <button
              onClick={onLogin}
              className="text-gray-400 hover:text-[#FF5A50] hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
              title="Sign In"
            >
              <User size={20} className="stroke-[2.5]" />
            </button>
          </div>

          {/* Mobile Auth Icons */}
          <div className="flex md:hidden items-center gap-4">
            <button
              onClick={onLogin}
              className="text-gray-400 hover:text-[#FF5A50] active:scale-95 transition-all cursor-pointer"
              title="Sign In"
            >
              <User size={20} className="stroke-[2.5]" />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ═══ HERO SECTION ═══ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-28 pb-16 overflow-hidden">
        {/* Aurora Background (subtle) */}
        <div className="absolute inset-0 opacity-30">
          <Aurora
            colorStops={['#FF5A50', '#526594', '#F3E8D6']}
            speed={0.3}
            amplitude={0.8}
          />
        </div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Floating Geometric Shapes */}
        <FloatingShape
          icon={<Hexagon className="w-16 h-16 text-[#FF5A50]/15 stroke-1" />}
          className="top-[15%] left-[8%]"
          delay={0}
          duration={7}
        />
        <FloatingShape
          icon={<Star className="w-12 h-12 text-white/10 stroke-1" />}
          className="top-[25%] right-[12%]"
          delay={1.5}
          duration={5}
        />
        <FloatingShape
          icon={<Zap className="w-10 h-10 text-[#FF5A50]/20 stroke-1" />}
          className="bottom-[30%] left-[15%]"
          delay={0.8}
          duration={6}
        />
        <FloatingShape
          icon={<Layers className="w-14 h-14 text-white/8 stroke-1" />}
          className="bottom-[20%] right-[8%]"
          delay={2}
          duration={8}
        />

        {/* Two-column Container */}
        <div className="relative z-10 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-center pt-8">
          {/* Left Column: Heading, CTA Button & Paragraph */}
          <motion.div
            className="lg:col-span-7 flex flex-col justify-center text-left"
            style={{ y: y2, opacity: opacity1 }}
          >
            {/* Title */}
            <h1 className="text-white font-black text-5xl sm:text-6xl md:text-7xl lg:text-8xl lg:text-[5.5rem] leading-[1.0] tracking-tighter mb-10 select-none uppercase">
              Your Closet <br />
              is an Art, <br />
              and you're <br className="hidden sm:inline" />
              the <span className="text-[#FF5A50]">Artist.</span>
            </h1>

            {/* CTA & Subtitle Flex Row */}
            <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center">
              <button
                onClick={onSignup}
                className="w-full sm:w-auto bg-[#FF5A50] text-white hover:bg-white hover:text-black font-black text-sm uppercase tracking-wider px-8 py-5 transition-all duration-300 cursor-pointer shrink-0"
                style={{ boxShadow: '4px 4px 0 rgba(255, 90, 80, 0.4)' }}
              >
                Get Started
              </button>
              
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed font-medium max-w-sm">
                Digitize your wardrobe. Let AI style your outfits based on your body, weather, and mood. Plan your week, and never struggle with morning decisions.
              </p>
            </div>
          </motion.div>

          {/* Right Column: 3x3 Bento Grid */}
          <motion.div
            className="lg:col-span-5 flex justify-center lg:justify-end w-full"
            style={{ y: y1, opacity: opacity1, scale: scale1 }}
          >
            <div className="grid grid-cols-3 gap-4 sm:gap-5 aspect-square w-full max-w-[480px] sm:max-w-[520px] lg:max-w-[540px] xl:max-w-[580px]">
              {/* Card 1: Cream, Closets Digitized */}
              <div className="bg-[#F3E8D6] text-[#0a0f1a] p-4 sm:p-5 flex flex-col justify-between rounded-tr-[50px] sm:rounded-tr-[60px] border-2 border-white/10 shadow-[4px_4px_0_#FF5A50]">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#0a0f1a]/60 leading-tight">Closets Digitized</span>
                <span className="text-xl sm:text-3xl font-black tracking-tight leading-none">1.2M</span>
              </div>
              
              {/* Card 2: Brand Red */}
              <div className="bg-[#FF5A50] text-white flex items-center justify-center rounded-br-[50px] sm:rounded-br-[60px] border-2 border-white/10 shadow-[4px_4px_0_#FF5A50]">
                <Shirt className="w-8 h-8 text-[#0a0f1a]/50" />
              </div>
              
              {/* Card 3: Deep Dark Blue */}
              <div 
                onClick={onSignup}
                className="bg-[#0d1325]/90 border-2 border-white/20 text-white p-3 flex items-center justify-center rounded-tl-[50px] sm:rounded-tl-[60px] shadow-[4px_4px_0_#FF5A50] text-center cursor-pointer hover:bg-[#161f38] transition-colors"
              >
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-300 leading-tight">Try it for free</span>
              </div>
              
              {/* Card 4: Wardrobe Image */}
              <div className="relative overflow-hidden rounded-tl-[50px] sm:rounded-tl-[60px] border-2 border-white/10 shadow-[4px_4px_0_#FF5A50] bg-[#111827]">
                <img 
                  src="https://images.unsplash.com/photo-1540221652346-e5dd6b50f3e7?auto=format&fit=crop&w=400&q=80" 
                  alt="" 
                  className="w-full h-full object-cover grayscale opacity-75 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                />
              </div>
              
              {/* Card 5: Outfit flat lay */}
              <div className="relative overflow-hidden rounded-br-[50px] sm:rounded-br-[60px] border-2 border-white/10 shadow-[4px_4px_0_#FF5A50] bg-[#111827]">
                <img 
                  src="https://images.unsplash.com/photo-1509319117193-57bab727e09d?auto=format&fit=crop&w=400&q=80" 
                  alt="" 
                  className="w-full h-full object-cover grayscale opacity-75 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                />
              </div>
              
              {/* Card 6: Cream Sparkles */}
              <div className="bg-[#F3E8D6] flex items-center justify-center rounded-bl-[50px] sm:rounded-bl-[60px] border-2 border-white/10 shadow-[4px_4px_0_#FF5A50]">
                <Sparkles className="w-8 h-8 text-[#0a0f1a]/50" />
              </div>
              
              {/* Card 7: Garment hangers */}
              <div className="relative overflow-hidden rounded-bl-[50px] sm:rounded-bl-[60px] border-2 border-white/10 shadow-[4px_4px_0_#FF5A50] bg-[#111827]">
                <img 
                  src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=400&q=80" 
                  alt="" 
                  className="w-full h-full object-cover grayscale opacity-75 hover:grayscale-0 hover:opacity-100 transition-all duration-500"
                />
              </div>
              
              {/* Card 8: Red, Outfits Created */}
              <div className="bg-[#FF5A50] text-white p-4 sm:p-5 flex flex-col justify-between rounded-tr-[50px] sm:rounded-tr-[60px] border-2 border-white/10 shadow-[4px_4px_0_#FF5A50]">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white/70 leading-tight">Outfits Styled</span>
                <span className="text-xl sm:text-3xl font-black tracking-tight leading-none">40K+</span>
              </div>
              
              {/* Card 9: Cream Heart */}
              <div className="bg-[#0d1325]/90 flex items-center justify-center rounded-br-[50px] sm:rounded-br-[60px] border-2 border-white/10 shadow-[4px_4px_0_#FF5A50]">
                <Heart className="w-8 h-8 text-[#FF5A50] fill-[#FF5A50]/20" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="hidden lg:flex absolute bottom-6 left-1/2 -translate-x-1/2 flex-col items-center gap-1.5 z-10"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-gray-500 text-[10px] uppercase tracking-[0.2em] font-bold">Scroll</span>
          <ChevronDown className="w-4 h-4 text-[#FF5A50]" />
        </motion.div>
      </section>

      {/* ═══ MARQUEE STRIP ═══ */}
      <MarqueeStrip texts={['DIGITIZE', 'ORGANIZE', 'STYLE', 'AI POWERED', 'WEATHER SYNC', 'SMART COMBOS', 'WARDROBE']} />

      {/* ═══ FEATURES SECTION ═══ */}
      <section id="features" className="py-24 md:py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 md:mb-20">
            <BrutalReveal
              text="FEATURES"
              className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4"
            />
            <motion.div
              className="w-20 h-1 bg-[#FF5A50] mx-auto mb-6"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-gray-400 text-lg max-w-xl mx-auto"
            >
              Everything you need to look your best, powered by artificial intelligence.
            </motion.p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <BrutalFeatureCard key={f.title} icon={f.icon} title={f.title} desc={f.desc} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" className="py-24 md:py-32 px-6 bg-transparent relative">
        {/* Diagonal accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#FF5A50]" />

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <BrutalReveal
              text="HOW IT WORKS"
              className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4"
            />
            <motion.div
              className="w-20 h-1 bg-[#FF5A50] mx-auto"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              { step: '01', title: 'UPLOAD', desc: 'Snap a photo of your clothes or upload from gallery. AI detects type, color, and season.', icon: <Upload className="w-10 h-10 text-[#FF5A50]" /> },
              { step: '02', title: 'ORGANIZE', desc: 'Your wardrobe gets auto-categorized. Filter, sort, and view by any attribute instantly.', icon: <LayoutGrid className="w-10 h-10 text-[#FF5A50]" /> },
              { step: '03', title: 'GET STYLED', desc: 'AI creates combos based on your body type, weather, and preferences. Save & plan your week.', icon: <Wand2 className="w-10 h-10 text-[#FF5A50]" /> },
            ].map((item, i) => (
              <StepCard
                key={item.step}
                step={item.step}
                title={item.title}
                desc={item.desc}
                icon={item.icon}
                index={i}
                isLast={i === 2}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ STATS BAR ═══ */}
      <section className="py-16 px-6 border-y-2 border-white/10 bg-transparent">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCounter value="∞" label="Outfit Combos" delay={0} />
          <StatCounter value="AI" label="Powered Styling" delay={0.1} />
          <StatCounter value="24/7" label="Weather Sync" delay={0.2} />
          <StatCounter value="100%" label="Free to Use" delay={0.3} />
        </div>
      </section>

      {/* ═══ MARQUEE STRIP 2 ═══ */}
      <MarqueeStrip texts={['STYLE', 'CONFIDENCE', 'AI', 'FASHION', 'WARDROBE', 'PLANNING', 'SMART']} direction="right" />

      {/* ═══ TESTIMONIALS ═══ */}
      <section id="reviews" className="py-24 md:py-32 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <BrutalReveal
              text="WHAT USERS SAY"
              className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4"
            />
            <motion.div
              className="w-20 h-1 bg-[#FF5A50] mx-auto"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <TestimonialCard key={i} quote={t.quote} author={t.author} role={t.role} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="py-24 md:py-32 px-6 bg-transparent relative overflow-hidden">
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-[#FF5A50]" />

        {/* Background number */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <span className="text-[20rem] md:text-[30rem] font-black text-white/[0.015] leading-none">W</span>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <BrutalReveal
            text="READY TO"
            className="text-4xl md:text-7xl font-black text-white tracking-tighter"
          />
          <BrutalReveal
            text="TRANSFORM"
            className="text-4xl md:text-7xl font-black text-[#FF5A50] tracking-tighter"
            delay={0.15}
          />
          <BrutalReveal
            text="YOUR STYLE?"
            className="text-4xl md:text-7xl font-black text-white tracking-tighter mb-8"
            delay={0.3}
          />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Join the next generation of smart styling. Your AI-powered wardrobe awaits.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <MagneticButton onClick={onSignup} variant="primary" className="text-xl px-12 py-5">
              <span className="flex items-center gap-3">
                Get Started — It's Free
                <ArrowRight className="w-6 h-6" />
              </span>
            </MagneticButton>
          </motion.div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-transparent border-t-2 border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#FF5A50] flex items-center justify-center text-white font-black text-sm border-2 border-white/10 rotate-3"
                   style={{ boxShadow: '2px 2px 0 rgba(255,255,255,0.1)' }}>
                W
              </div>
              <span className="font-black text-white text-lg tracking-tight">
                WARDROBE<span className="text-[#FF5A50]">.</span>
              </span>
            </div>

            {/* Links */}
            <div className="flex gap-8">
              {['Features', 'How it Works', 'Reviews'].map(item => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-gray-500 hover:text-white text-sm font-bold uppercase tracking-wider transition-colors"
                >
                  {item}
                </a>
              ))}
            </div>

            {/* Copyright */}
            <div className="text-gray-600 text-xs uppercase tracking-wider font-bold">
              © 2026 Online Wardrobe
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
