import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWardrobe } from '../context/WardrobeContext';
import { ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import { Button } from './ui/button';

interface TourStep {
  title: string;
  description: string;
  targetId: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  route: string;
  hideNext?: boolean;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to Wardrobe! 👋",
    description: "Let's take a quick 1-minute tour to see how to digitize your closet, style outfits with AI, and plan your weekly calendar. Press Next to begin!",
    targetId: "",
    position: "center",
    route: "/dashboard"
  },
  {
    title: "Local Weather & Advice ☀️",
    description: "This widget displays your local weather conditions in real-time, along with intelligent, automatic styling recommendations tailored to today's temperature.",
    targetId: "onboarding-weather",
    position: "bottom",
    route: "/dashboard"
  },
  {
    title: "Daily Curated Outfit 🧥",
    description: "Each day, the stylist automatically pairs items from your digitized closet to recommend a complete look matching the local weather and your profile.",
    targetId: "onboarding-rec",
    position: "left",
    route: "/dashboard"
  },
  {
    title: "Total Closet Items 📊",
    description: "This counter tracks the total number of shirts, pants, outerwear, shoes, and accessories currently digitized in your wardrobe.",
    targetId: "onboarding-stats",
    position: "bottom",
    route: "/dashboard"
  },
  {
    title: "Your Saved Looks 💾",
    description: "Keep track of your favorite hand-crafted outfit combinations. You can save, edit, and access them anytime in the Outfits tab of your Closet.",
    targetId: "onboarding-saved-looks",
    position: "bottom",
    route: "/dashboard"
  },
  {
    title: "AI Quick Add 📸",
    description: "Quickly upload a photo of any garment directly from the dashboard to add it to your wardrobe.",
    targetId: "onboarding-quick-add",
    position: "left",
    route: "/dashboard"
  },
  {
    title: "Browse Closet Shortcut 👕",
    description: "Click here to jump straight to your closet page and see your full digitized catalog of garments.",
    targetId: "onboarding-quick-browse",
    position: "bottom",
    route: "/dashboard"
  },
  {
    title: "Request AI Stylist Shortcut 🪄",
    description: "Instantly launch the custom styling board to generate outfits matching your specific occasion or request.",
    targetId: "onboarding-quick-stylist",
    position: "bottom",
    route: "/dashboard"
  },
  {
    title: "Navigation Control Bar 🧭",
    description: "Quickly navigate between the Dashboard, Closet, Upload Area, AI Stylist, and Calendar Planning boards using the navigation bar.",
    targetId: "onboarding-main-nav",
    position: "right",
    route: "/dashboard"
  },
  {
    title: "Your Digitized Closet 👕",
    description: "Here, all your clothing items, footwear, and accessories are organized. During the tour, we have preloaded 6 mock items (a leather jacket, denim jeans, silk dress, and more) so you can test things out.",
    targetId: "onboarding-closet-page",
    position: "bottom",
    route: "/closet"
  },
  {
    title: "Add Items via AI 📸",
    description: "Snap or drop a photo here to add a new garment. Our fashion AI will automatically categorize, identify colors, determine fabrics, and write descriptions for your clothes completely locally!",
    targetId: "onboarding-upload-dropzone",
    position: "bottom",
    route: "/upload"
  },
  {
    title: "Select Occasion 🌤️",
    description: "First, click the Occasion selector dropdown and choose 'Date Night' (or any style vibe). The Next button is hidden because you must perform this action to continue!",
    targetId: "onboarding-stylist-occasion",
    position: "right",
    route: "/stylist",
    hideNext: true
  },
  {
    title: "Select Weather 🌤️",
    description: "Now click the Weather dropdown and choose 'Sunny and Mild' (or any weather) to set the condition.",
    targetId: "onboarding-stylist-weather",
    position: "right",
    route: "/stylist",
    hideNext: true
  },
  {
    title: "AI Stylist 🪄",
    description: "Click the 'AI Stylist' button to automatically generate a complete outfit recommendation matched to your settings.",
    targetId: "onboarding-stylist-generate-btn",
    position: "bottom",
    route: "/stylist",
    hideNext: true
  },
  {
    title: "AI Curated Outfit ✨",
    description: "The AI has compiled a premium matched outfit on your Style Board! Check it out, then click Next.",
    targetId: "onboarding-stylist-board",
    position: "right",
    route: "/stylist"
  },
  {
    title: "Save the Look 💾",
    description: "Click 'SAVE TO CLOSET' to save this outfit to your closet.",
    targetId: "onboarding-stylist-save-btn",
    position: "bottom",
    route: "/stylist",
    hideNext: true
  },
  {
    title: "View Saved Outfits 📂",
    description: "Here is your saved outfit! You can access all your custom looks, edit them, or add them to your calendar. Let's learn manual styling next—click Next to return to the Style Board.",
    targetId: "onboarding-closet-outfits-tab",
    position: "bottom",
    route: "/closet"
  },
  {
    title: "Manual Styling Concept 🎨",
    description: "Now, let's learn how to style outfits manually. We've reset the canvas so you can add clothes yourself. Click Next to continue.",
    targetId: "onboarding-stylist-board",
    position: "right",
    route: "/stylist"
  },
  {
    title: "Add Clothes Manually 👕",
    description: "Click on the mock clothes in the Wardrobe sidebar (e.g. click the top/dress and shoes) to add them to your active style board.",
    targetId: "onboarding-stylist-wardrobe",
    position: "left",
    route: "/stylist",
    hideNext: true
  },
  {
    title: "Ask AI for Review 📊",
    description: "Perfect! Now, click the 'Ask AI for Review' button to get a fashion score and detailed design critique from our local AI.",
    targetId: "onboarding-stylist-review-btn",
    position: "top",
    route: "/stylist",
    hideNext: true
  },
  {
    title: "AI Style Critique 📊",
    description: "Our local AI has analyzed your manual combination, assigned a fashion score, and provided styling advice! Review the critique, then click Next to continue.",
    targetId: "onboarding-stylist-critique-panel",
    position: "top",
    route: "/stylist"
  },
  {
    title: "Suggest Alternatives 💡",
    description: "Don't like the critique or want other options? Click 'Suggest Alternative' to have the local AI recommend a different match using items in your closet.",
    targetId: "onboarding-stylist-suggest-alt-btn",
    position: "top",
    route: "/stylist"
  },
  {
    title: "Plan Your Looks 📅",
    description: "Schedule outfits for upcoming dates, meetings, or casual office days. The calendar keeps your style plan organized and ready.",
    targetId: "onboarding-calendar-page",
    position: "bottom",
    route: "/calendar"
  },
  {
    title: "Tour Completed! 🎉",
    description: "You are all set! Now you can start digitizing your real closet. All mock clothes will be removed, and you will enter live database mode. Happy styling!",
    targetId: "",
    position: "center",
    route: "/dashboard"
  }
];

export const OnboardingTour: React.FC = () => {
  const { isOnboardingTour, onboardingStep, setOnboardingStep, completeOnboardingTour, profile } = useWardrobe();
  const navigate = useNavigate();
  const location = useLocation();
  const [rect, setRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [measuredCardHeight, setMeasuredCardHeight] = useState(280);
  const [showCelebration, setShowCelebration] = useState(false);

  const currentStepIndex = onboardingStep;
  const currentStep = TOUR_STEPS[currentStepIndex];

  // Dynamic description matching profile gender
  const isMale = profile?.gender === 'Male';
  let stepDescription = currentStep?.description || '';
  if (currentStepIndex === 11) { // Select Occasion
    stepDescription = `First, click the Occasion selector dropdown and choose '${isMale ? 'Casual' : 'Date Night'}' (or any style vibe). The Next button is hidden because you must perform this action to continue!`;
  } else if (currentStepIndex === 18) { // Add Clothes Manually
    stepDescription = `Click on the mock clothes in the Wardrobe sidebar (highlighted in red) to add a top, bottoms, shoes, and accessory to your active style board.`;
  }

  // Prevent body scroll when tour is active
  useEffect(() => {
    if (isOnboardingTour) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOnboardingTour]);

  // Screen width detector
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Measure card height dynamically to prevent overlaps
  useEffect(() => {
    if (!cardRef.current) return;
    
    setMeasuredCardHeight(cardRef.current.getBoundingClientRect().height);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setMeasuredCardHeight(entry.target.getBoundingClientRect().height);
      }
    });
    
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [currentStepIndex, isOnboardingTour]);

  // Handle route auto-navigation
  useEffect(() => {
    if (!isOnboardingTour || !currentStep) return;
    
    // Check if the current route matches the step's expected route
    if (location.pathname !== currentStep.route) {
      navigate(currentStep.route);
    }
  }, [currentStepIndex, isOnboardingTour, navigate, location.pathname]);

  // Track and calculate bounding box of highlighted element
  useEffect(() => {
    if (!isOnboardingTour || !currentStep || !currentStep.targetId) {
      setRect(null);
      return;
    }

    let attempts = 0;
    let timer: any;

    const calculateBoundingBox = () => {
      const id = currentStep.targetId;
      let el = document.getElementById(id);

      // Special handling for navigation bar since it has desktop and mobile elements
      if (id === 'onboarding-main-nav') {
        const navs = document.querySelectorAll('[id="onboarding-main-nav"]');
        el = Array.from(navs).find(n => {
          const r = n.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        }) as HTMLElement || navs[0] as HTMLElement || null;
      }

      if (el) {
        let r = el.getBoundingClientRect();

        // If the occasion dropdown menu is open, expand the bounding box to include it
        if (id === 'onboarding-stylist-occasion') {
          const menuEl = document.getElementById('onboarding-stylist-occasion-menu');
          if (menuEl) {
            const menuRect = menuEl.getBoundingClientRect();
            if (menuRect.width > 0 && menuRect.height > 0) {
              r = {
                left: Math.min(r.left, menuRect.left),
                top: Math.min(r.top, menuRect.top),
                right: Math.max(r.right, menuRect.right),
                bottom: Math.max(r.bottom, menuRect.bottom),
                width: Math.max(r.right, menuRect.right) - Math.min(r.left, menuRect.left),
                height: Math.max(r.bottom, menuRect.bottom) - Math.min(r.top, menuRect.top)
              } as DOMRect;
            }
          }
        }

        // If the weather dropdown menu is open, expand the bounding box to include it
        if (id === 'onboarding-stylist-weather') {
          const menuEl = document.getElementById('onboarding-stylist-weather-menu');
          if (menuEl) {
            const menuRect = menuEl.getBoundingClientRect();
            if (menuRect.width > 0 && menuRect.height > 0) {
              r = {
                left: Math.min(r.left, menuRect.left),
                top: Math.min(r.top, menuRect.top),
                right: Math.max(r.right, menuRect.right),
                bottom: Math.max(r.bottom, menuRect.bottom),
                width: Math.max(r.right, menuRect.right) - Math.min(r.left, menuRect.left),
                height: Math.max(r.bottom, menuRect.bottom) - Math.min(r.top, menuRect.top)
              } as DOMRect;
            }
          }
        }

        const padding = 10;
        setRect({
          x: r.left - padding,
          y: r.top - padding,
          width: r.width + padding * 2,
          height: r.height + padding * 2
        });

        // Ensure we scroll the element into view if not visible
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (attempts < 15) {
        attempts++;
        timer = setTimeout(calculateBoundingBox, 100);
      }
    };

    // Delay slightly to let the page component mount and render
    timer = setTimeout(calculateBoundingBox, 150);

    const handleWindowClick = () => {
      setTimeout(calculateBoundingBox, 60);
    };

    window.addEventListener('resize', calculateBoundingBox);
    window.addEventListener('scroll', calculateBoundingBox);
    window.addEventListener('click', handleWindowClick);

    // Periodically update coordinates to handle transition scale and dynamic menus smoothly
    const intervalId = setInterval(calculateBoundingBox, 100);

    return () => {
      clearTimeout(timer);
      clearInterval(intervalId);
      window.removeEventListener('resize', calculateBoundingBox);
      window.removeEventListener('scroll', calculateBoundingBox);
      window.removeEventListener('click', handleWindowClick);
    };
  }, [currentStepIndex, currentStep?.targetId, location.pathname, isOnboardingTour]);

  if (showCelebration) {
    return (
      <CelebrationModal
        onClose={() => {
          setShowCelebration(false);
          completeOnboardingTour();
        }}
      />
    );
  }

  if (!isOnboardingTour || !currentStep) return null;

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setOnboardingStep(currentStepIndex + 1);
    } else {
      setShowCelebration(true);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setOnboardingStep(currentStepIndex - 1);
    }
  };

  // Get inline placement styles for the floating card on desktop & mobile
  const getCardStyle = (): React.CSSProperties => {
    const cardWidth = 448;
    const cardHeight = measuredCardHeight; // dynamically measured height
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (!rect || currentStep.position === 'center' || isMobile) {
      if (isMobile && currentStep.position !== 'center') {
        // Dynamic positioning for mobile: if target is in bottom half of viewport, put card at top
        const isTargetInBottomHalf = rect ? (rect.y + rect.height / 2 > viewportHeight / 2) : false;
        
        if (isTargetInBottomHalf) {
          return {
            position: 'fixed',
            left: '16px',
            right: '16px',
            top: '72px', // Pinned near top, below header
            zIndex: 101,
            transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
          };
        } else {
          return {
            position: 'fixed',
            left: '16px',
            right: '16px',
            bottom: '96px', // Pinned above bottom navigation bar
            zIndex: 101,
            transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
          };
        }
      }
      if (isMobile) {
        return {
          position: 'fixed',
          top: `${viewportHeight / 2 - cardHeight / 2}px`,
          left: '16px',
          right: '16px',
          zIndex: 101,
          transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
        };
      }
      return {
        position: 'fixed',
        top: `${viewportHeight / 2 - cardHeight / 2}px`,
        left: `${viewportWidth / 2 - cardWidth / 2}px`,
        width: `${cardWidth}px`,
        zIndex: 101,
        transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
      };
    }

    const gap = 16;
    const padding = 20; // safe padding from viewport edges

    // Define positions in preference order
    const preferredPos = currentStep.position;
    const getOppositePos = (pos: 'top' | 'bottom' | 'left' | 'right'): 'top' | 'bottom' | 'left' | 'right' => {
      if (pos === 'top') return 'bottom';
      if (pos === 'bottom') return 'top';
      if (pos === 'left') return 'right';
      return 'left';
    };
    
    const oppositePos = getOppositePos(preferredPos);
    const allPositions: ('top' | 'bottom' | 'left' | 'right')[] = [
      preferredPos,
      oppositePos,
      ...(preferredPos === 'top' || preferredPos === 'bottom' ? ['right', 'left'] : ['bottom', 'top']) as ('top' | 'bottom' | 'left' | 'right')[]
    ];

    let bestLeft = 0;
    let bestTop = 0;
    let foundValid = false;

    for (const pos of allPositions) {
      let targetLeft = rect.x + rect.width / 2 - cardWidth / 2;
      let targetTop = rect.y + rect.height / 2 - cardHeight / 2;

      if (pos === 'bottom') {
        targetTop = rect.y + rect.height + gap;
      } else if (pos === 'top') {
        targetTop = rect.y - gap - cardHeight;
      } else if (pos === 'left') {
        targetLeft = rect.x - gap - cardWidth;
      } else if (pos === 'right') {
        targetLeft = rect.x + rect.width + gap;
      }

      // Clamp to viewport
      const clampedLeft = Math.max(padding, Math.min(targetLeft, viewportWidth - cardWidth - padding));
      const clampedTop = Math.max(padding, Math.min(targetTop, viewportHeight - cardHeight - padding));

      // Check for overlap with highlighted element rect
      const overlaps = !(
        clampedLeft + cardWidth <= rect.x ||
        clampedLeft >= rect.x + rect.width ||
        clampedTop + cardHeight <= rect.y ||
        clampedTop >= rect.y + rect.height
      );

      if (!overlaps) {
        bestLeft = clampedLeft;
        bestTop = clampedTop;
        foundValid = true;
        break;
      }
    }

    // Fallback if no non-overlapping position is found: use preferred position's clamped coordinates
    if (!foundValid) {
      let targetLeft = rect.x + rect.width / 2 - cardWidth / 2;
      let targetTop = rect.y + rect.height / 2 - cardHeight / 2;

      if (preferredPos === 'bottom') {
        targetTop = rect.y + rect.height + gap;
      } else if (preferredPos === 'top') {
        targetTop = rect.y - gap - cardHeight;
      } else if (preferredPos === 'left') {
        targetLeft = rect.x - gap - cardWidth;
      } else if (preferredPos === 'right') {
        targetLeft = rect.x + rect.width + gap;
      }

      bestLeft = Math.max(padding, Math.min(targetLeft, viewportWidth - cardWidth - padding));
      bestTop = Math.max(padding, Math.min(targetTop, viewportHeight - cardHeight - padding));
    }

    return {
      position: 'fixed',
      top: `${bestTop}px`,
      left: `${bestLeft}px`,
      width: `${cardWidth}px`,
      zIndex: 101,
      transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
    };
  };

  return (
    <>
      {/* ── Click Blocking Divs (Pointer lock outside spotlight) ──────── */}
      {rect ? (
        <div className="fixed inset-0 pointer-events-none z-[99]">
          {/* Top Blocker */}
          <div
            className="fixed bg-transparent pointer-events-auto transition-all duration-400 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{
              left: 0,
              top: 0,
              width: '100vw',
              height: `${Math.max(0, rect.y)}px`,
            }}
          />
          {/* Bottom Blocker */}
          <div
            className="fixed bg-transparent pointer-events-auto transition-all duration-400 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{
              left: 0,
              top: `${rect.y + rect.height}px`,
              width: '100vw',
              height: `calc(100vh - ${rect.y + rect.height}px)`,
            }}
          />
          {/* Left Blocker */}
          <div
            className="fixed bg-transparent pointer-events-auto transition-all duration-400 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{
              left: 0,
              top: `${rect.y}px`,
              width: `${Math.max(0, rect.x)}px`,
              height: `${rect.height}px`,
            }}
          />
          {/* Right Blocker */}
          <div
            className="fixed bg-transparent pointer-events-auto transition-all duration-400 ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{
              left: `${rect.x + rect.width}px`,
              top: `${rect.y}px`,
              width: `calc(100vw - ${rect.x + rect.width}px)`,
              height: `${rect.height}px`,
            }}
          />
        </div>
      ) : (
        /* Full-screen click blocker for centered guide card */
        <div className="fixed inset-0 bg-transparent pointer-events-auto z-[99]" />
      )}

      {/* ── CSS Box-Shadow Spotlight Mask ─────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          left: rect ? `${rect.x}px` : '50%',
          top: rect ? `${rect.y}px` : '50%',
          width: rect ? `${rect.width}px` : '0px',
          height: rect ? `${rect.height}px` : '0px',
          boxShadow: '0 0 0 9999px rgba(10, 15, 26, 0.78)',
          borderRadius: rect ? '12px' : '50%',
          transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
          pointerEvents: 'none',
          zIndex: 100,
          opacity: rect ? 1 : 0.85,
        }}
      />

      {/* ── Spotlight Border Outline ───────────────────────────────────── */}
      {rect && !isMobile && (
        <div
          className="fixed border-2 border-dashed border-[#FF5A50] rounded-xl pointer-events-none z-[100] animate-pulse"
          style={{
            left: `${rect.x}px`,
            top: `${rect.y}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
        />
      )}

      {/* ── Floating Tour Onboarding Card ─────────────────────────────── */}
      <div
        ref={cardRef}
        style={getCardStyle()}
        className="max-w-md bg-white text-[#0a0f1a] border-2 md:border-3 border-[#0a0f1a] p-3 md:p-6 shadow-[3px_3px_0_#FF5A50] md:shadow-[6px_6px_0_#FF5A50] rounded-none z-[101] flex flex-col gap-2.5 md:gap-5 animate-scale-in"
      >
        {/* Card Header */}
        <div className="flex justify-between items-center border-b border-[#0a0f1a]/10 pb-1.5 md:pb-3 mb-0.5 md:mb-1.5">
          <div className="flex items-center gap-1 md:gap-2">
            <Sparkles size={12} className="text-[#FF5A50] animate-spin-slow md:size-4" />
            <h4 className="font-mono text-[9px] md:text-xs font-black tracking-widest uppercase text-p_dark">
              Stylist Guide
            </h4>
          </div>
          <button
            onClick={completeOnboardingTour}
            className="text-[#0a0f1a]/50 hover:text-p_red hover:scale-110 transition cursor-pointer"
            title="Skip Tour"
          >
            <X size={14} className="md:size-[18px]" />
          </button>
        </div>

        {/* Card Content with Step Key to trigger fade entry */}
        <div key={currentStepIndex} className="flex flex-col gap-1 md:gap-2.5 animate-fade-in">
          <h2 className="font-sans font-black text-[13px] md:text-xl leading-tight tracking-tight text-[#0a0f1a]">
            {currentStep.title}
          </h2>
          <p className="text-[#0a0f1a]/85 text-[10.5px] md:text-sm font-medium leading-normal md:leading-relaxed font-sans text-left">
            {stepDescription}
          </p>
        </div>

        {/* Card Footer / Controls */}
        <div className="flex justify-between items-center border-t-2 border-[#0a0f1a]/10 pt-2 md:pt-4 mt-1 md:mt-2">
          {/* Progress dots/text */}
          <span className="font-mono text-[8.5px] md:text-xs font-bold tracking-wider text-[#0a0f1a]/60 uppercase">
            Step {currentStepIndex + 1} of {TOUR_STEPS.length}
          </span>

          {/* Action buttons */}
          <div className="flex gap-1 md:gap-2">
            {currentStepIndex > 0 && (
              <Button
                onClick={handlePrev}
                variant="neutral"
                className="py-0.5 px-2 md:py-1.5 md:px-3 border-2 border-[#0a0f1a] text-[9.5px] md:text-xs font-bold shadow-[1px_1px_0_#0a0f1a] md:shadow-[2px_2px_0_#0a0f1a] active:shadow-none hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] flex items-center gap-0.5 bg-gray-150 rounded-none text-[#0a0f1a] cursor-pointer h-6 md:h-9"
              >
                <ChevronLeft size={10} className="md:size-3.5" /> Back
              </Button>
            )}
            {!currentStep.hideNext && (
              <Button
                onClick={handleNext}
                variant="default"
                className="py-0.5 px-2.5 md:py-1.5 md:px-4 bg-[#FF5A50] border-2 border-[#0a0f1a] text-[9.5px] md:text-xs font-black shadow-[1px_1px_0_#0a0f1a] md:shadow-[2px_2px_0_#0a0f1a] active:shadow-none hover:translate-x-[-0.5px] hover:translate-y-[-0.5px] flex items-center gap-0.5 rounded-none text-white cursor-pointer h-6 md:h-9"
              >
                {currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'} <ChevronRight size={10} className="md:size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// Celebration Confetti Modal
interface CelebrationModalProps {
  onClose: () => void;
}

const CelebrationModal: React.FC<CelebrationModalProps> = ({ onClose }) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Confetti particles
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      shape: 'circle' | 'square' | 'triangle';
      rotation: number;
      rotationSpeed: number;
    }

    const particles: Particle[] = [];
    const colors = ['#FF5A50', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];
    const shapes: ('circle' | 'square' | 'triangle')[] = ['circle', 'square', 'triangle'];

    const shootConfetti = (x: number, y: number, angle: number) => {
      for (let i = 0; i < 75; i++) {
        const speed = 12 + Math.random() * 24;
        const spreadAngle = angle + (Math.random() - 0.5) * 0.9;
        particles.push({
          x,
          y,
          vx: Math.cos(spreadAngle) * speed,
          vy: Math.sin(spreadAngle) * speed,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 7 + Math.random() * 9,
          shape: shapes[Math.floor(Math.random() * shapes.length)],
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.25,
        });
      }
    };

    // Initial burst from bottom corners
    shootConfetti(0, height, -Math.PI / 4);
    shootConfetti(width, height, -3 * Math.PI / 4);

    let timer = 0;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      timer++;

      // Shoot occasionally to keep it active
      if (timer % 70 === 0 && particles.length < 180) {
        shootConfetti(0, height, -Math.PI / 4);
        shootConfetti(width, height, -3 * Math.PI / 4);
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.38; // Gravity
        p.vx *= 0.975; // Friction
        p.vy *= 0.975;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        if (p.shape === 'circle') {
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        } else if (p.shape === 'square') {
          ctx.rect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else {
          ctx.moveTo(0, -p.size / 2);
          ctx.lineTo(p.size / 2, p.size / 2);
          ctx.lineTo(-p.size / 2, p.size / 2);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        if (p.y > height + 20 || p.x < -20 || p.x > width + 20) {
          particles.splice(i, 1);
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0a0f1a]/92 p-4 animate-fade-in">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      
      <div className="relative w-full max-w-sm md:max-w-md bg-white border-3 md:border-4 border-[#0a0f1a] p-5 md:p-10 shadow-[6px_6px_0_#FF5A50] md:shadow-[10px_10px_0_#FF5A50] rounded-none text-center flex flex-col items-center gap-4 md:gap-8 z-10 animate-scale-in">
        <div className="w-14 h-14 md:w-20 md:h-20 bg-[#FF5A50] border-3 md:border-4 border-[#0a0f1a] flex items-center justify-center shadow-[3px_3px_0_#0a0f1a] md:shadow-[4px_4px_0_#0a0f1a] rounded-none animate-bounce">
          <span className="text-2xl md:text-4xl select-none">🎉</span>
        </div>

        <div className="flex flex-col gap-2 md:gap-3">
          <h1 className="font-cotta text-xl md:text-3xl font-black tracking-tight text-[#0a0f1a] uppercase leading-none">
            YOU ARE ALL SET TO GO!
          </h1>
          <p className="text-[#0a0f1a]/85 text-[11px] md:text-sm font-medium leading-relaxed font-sans max-w-xs md:max-w-sm mx-auto">
            Congratulations! You've completed the stylist guide. You are now ready to style outfits, manage your closet, and check daily recommendations.
          </p>
        </div>

        <Button
          onClick={onClose}
          variant="default"
          className="w-full py-2 md:py-3 bg-[#FF5A50] border-2 md:border-3 border-[#0a0f1a] text-xs md:text-sm font-black shadow-[3px_3px_0_#0a0f1a] md:shadow-[4px_4px_0_#0a0f1a] active:shadow-none hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all duration-150 rounded-none text-white uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer h-10 md:h-12"
        >
          Let's Start Styling! 🚀
        </Button>
      </div>
    </div>
  );
};
