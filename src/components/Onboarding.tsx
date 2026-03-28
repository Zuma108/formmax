"use client";

import { useState, useRef, useEffect, UIEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Shield, TrendingUp, Dumbbell, Brain, Zap, Volume2, 
  CheckCircle, Crosshair, Activity, User, Mail, Camera, 
  Smartphone, Users, AlertTriangle, Target, Settings, Gauge, Flame, Bell 
} from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

// Shared transition for all step slides — snappy native-app feel
const SLIDE_TRANSITION = { duration: 0.22, ease: [0.32, 0.72, 0, 1] as const };

// --- Custom Components ---

const OptionCard = ({ 
  icon: Icon, 
  title, 
  selected, 
  onClick, 
  multi = false 
}: { 
  icon: any, 
  title: string, 
  selected: boolean, 
  onClick: () => void,
  multi?: boolean
}) => {
  return (
    <button
      onClick={onClick}
      // touch-manipulation eliminates 300ms tap delay without disabling zoom
      style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
      className={`w-full p-4 rounded-3xl flex items-center gap-5 outline-none transition-colors duration-150 active:scale-[0.97] ${
        selected 
          ? 'bg-[#18181b] text-white' 
          : 'bg-[#f4f4f5] text-zinc-900 active:bg-zinc-200'
      }`}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
        selected ? 'bg-white text-zinc-900' : 'bg-white shadow-sm text-zinc-900'
      }`}>
        <Icon strokeWidth={2} className="w-6 h-6" />
      </div>
      <span className="font-semibold text-lg text-left">{title}</span>
    </button>
  );
};

// --- Weight Ruler Component ---
const WeightRuler = ({ value, onChange, unit }: { value: number, onChange: (v: number) => void, unit: string }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [paddingX, setPaddingX] = useState(0);
  const tickSpacing = 10;
  const minVal = 40;
  const maxVal = 150;
  const tickCount = (maxVal - minVal) * 10;

  // Step 1: measure viewport half-width to create centering padding
  useEffect(() => {
    if (scrollRef.current) {
      setPaddingX(scrollRef.current.clientWidth / 2);
    }
  }, []);

  // Step 2: set initial scroll AFTER padding divs are rendered
  // (paddingX state update causes re-render; setting scroll here ensures DOM is stable)
  useEffect(() => {
    if (paddingX > 0 && scrollRef.current) {
      scrollRef.current.scrollLeft = (value - minVal) * tickSpacing * 10;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paddingX]);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const rawVal = minVal + (scrollLeft / (tickSpacing * 10));
    let clamped = Math.min(Math.max(rawVal, minVal), maxVal);
    clamped = Math.round(clamped * 10) / 10;
    
    if (value !== clamped) {
      onChange(clamped);
    }
  };

  return (
    <div className="relative w-full h-32 select-none">
      <div className="absolute top-0 bottom-6 left-1/2 -translate-x-1/2 w-[2px] bg-zinc-900 z-10 rounded-full" />
      <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-r from-white via-transparent to-white" />
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="w-full h-full overflow-x-auto hide-scrollbar flex items-end pb-8"
        style={{ WebkitOverflowScrolling: 'touch' as any, touchAction: 'pan-x' }}
      >
        <div style={{ width: paddingX, flexShrink: 0 }} />
        <div className="flex items-end h-16 w-[11000px] relative">
          <div className="absolute bottom-0 left-0 h-full flex" style={{ width: tickCount * tickSpacing }}>
             {Array.from({ length: Math.ceil(tickCount / 10) + 1 }).map((_, i) => (
                <div key={i} className="flex items-end h-full w-[100px] shrink-0 border-l border-zinc-300 relative justify-between">
                   <span className="absolute top-full mt-2 -translate-x-1/2 text-xs font-medium text-zinc-500">
                     {minVal + i}
                   </span>
                   {Array.from({ length: 9 }).map((_, j) => {
                      const isHalf = j === 4;
                      return (
                        <div key={j} className={`w-[1px] bg-zinc-300 ${isHalf ? 'h-8' : 'h-4'} shrink-0`} style={{ marginLeft: 9 }} />
                      )
                   })}
                </div>
             ))}
          </div>
        </div>
        <div style={{ width: paddingX, flexShrink: 0 }} />
      </div>

    </div>
  );
};


export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 13;

  const [answers, setAnswers] = useState({
    firstName: '',
    lastName: '',
    email: '',
    gender: '',
    weightUnit: 'kg',
    bodyWeight: 80.0,
    experience: '',
    setup: '',
    focusAreas: [] as string[],
    weaknesses: [] as string[],
    injuries: [] as string[],
    primaryGoal: '',
    strictness: '',
    audioFeedbackAllowed: null as boolean | null,
    notificationsAllowed: null as boolean | null
  });

  const nextStep = () => {
    if (step < TOTAL_STEPS) setStep(prev => prev + 1);
    else onComplete();
  };

  const prevStep = () => {
    if (step > 1) setStep(prev => prev - 1);
  };

  const toggleArrayItem = (key: 'focusAreas' | 'weaknesses' | 'injuries', value: string) => {
    setAnswers(prev => {
      const arr = prev[key];
      const newArr = arr.includes(value) 
        ? arr.filter(i => i !== value) 
        : [...arr, value];
      return { ...prev, [key]: newArr };
    });
  };

  // --- Layout Wrappers ---

  const renderHeader = (title: string, subtitle?: string, showBack = true) => (
    <div className="pt-10 pb-6 px-6">
      <div className="flex items-center w-full mb-8 gap-4">
        {showBack ? (
          <button 
            onClick={prevStep}
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minWidth: 44, minHeight: 44 }}
            className="w-11 h-11 rounded-full bg-zinc-100 flex items-center justify-center active:bg-zinc-200 active:scale-95 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-zinc-800" />
          </button>
        ) : (
          <div className="w-11 h-11" />
        )}
        
        <div className="flex-1 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: `${((step - 1) / TOTAL_STEPS) * 100}%` }}
            animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            transition={{ ease: "easeInOut", duration: 0.3 }}
            className="h-full bg-zinc-900 rounded-full"
          />
        </div>
      </div>
      <h2 className="text-4xl font-extrabold text-zinc-900 tracking-tight leading-tight px-1">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 px-1 text-zinc-500 font-medium text-lg leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );

  const renderFooter = (disabled: boolean, customText = "Continue") => (
    <div className="px-6 pb-6 pt-4 mt-auto">
      <button 
        onClick={nextStep}
        disabled={disabled}
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: 56 }}
        className="w-full py-4 rounded-full text-lg font-bold transition-colors disabled:bg-zinc-100 disabled:text-zinc-400 bg-zinc-900 text-white active:bg-zinc-700 active:scale-[0.98]"
      >
        {customText}
      </button>
    </div>
  );

  // --- Screens ---

  const renderName = () => (
    <motion.div 
      key="step1"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={SLIDE_TRANSITION}
      className="absolute inset-0 flex flex-col bg-white overflow-y-auto overscroll-contain"
      style={{ WebkitOverflowScrolling: 'touch' as any }}
    >
      {renderHeader("What's your name?", "Create your athlete profile.", false)}
      <div className="px-6 flex flex-col gap-5 mt-4">
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-6 h-6 pointer-events-none" />
          <input 
            type="text" 
            value={answers.firstName}
            onChange={e => setAnswers({...answers, firstName: e.target.value})}
            placeholder="First Name" 
            autoComplete="given-name"
            autoCapitalize="words"
            autoCorrect="off"
            enterKeyHint="next"
            className="w-full bg-[#f4f4f5] pl-14 pr-4 py-5 rounded-3xl text-zinc-900 font-semibold text-[18px] placeholder:text-zinc-400 placeholder:font-medium focus:outline-none ring-2 ring-transparent focus:ring-zinc-900 transition-all"
          />
        </div>
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-6 h-6 pointer-events-none" />
          <input 
            type="text" 
            value={answers.lastName}
            onChange={e => setAnswers({...answers, lastName: e.target.value})}
            placeholder="Last Name (optional)" 
            autoComplete="family-name"
            autoCapitalize="words"
            autoCorrect="off"
            enterKeyHint="go"
            className="w-full bg-[#f4f4f5] pl-14 pr-4 py-5 rounded-3xl text-zinc-900 font-semibold text-[18px] placeholder:text-zinc-400 placeholder:font-medium focus:outline-none ring-2 ring-transparent focus:ring-zinc-900 transition-all"
          />
        </div>
      </div>
      <div className="flex-1" />
      <div>{renderFooter(!answers.firstName)}</div>
    </motion.div>
  );

  const renderEmail = () => (
    <motion.div 
      key="step2"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={SLIDE_TRANSITION}
      className="absolute inset-0 flex flex-col bg-white overflow-y-auto overscroll-contain"
      style={{ WebkitOverflowScrolling: 'touch' as any }}
    >
      {renderHeader("Your email address", "We'll use this to save your progress.")}
      <div className="px-6 flex flex-col gap-5 mt-4">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 w-6 h-6 pointer-events-none" />
          <input 
            type="email"
            inputMode="email"
            value={answers.email}
            onChange={e => setAnswers({...answers, email: e.target.value})}
            placeholder="Email Address" 
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
            className="w-full bg-[#f4f4f5] pl-14 pr-4 py-5 rounded-3xl text-zinc-900 font-semibold text-[18px] placeholder:text-zinc-400 placeholder:font-medium focus:outline-none ring-2 ring-transparent focus:ring-zinc-900 transition-all"
          />
        </div>
      </div>
      <div className="flex-1" />
      <div>{renderFooter(!answers.email.includes('@'))}</div>
    </motion.div>
  );

  const renderGender = () => (
    <motion.div 
      key="step3"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={SLIDE_TRANSITION}
      className="absolute inset-0 flex flex-col bg-white overflow-y-auto overscroll-contain"
      style={{ WebkitOverflowScrolling: 'touch' as any }}
    >
      {renderHeader("Biological Sex", "Used for precise biomechanical estimations.")}
      <div className="px-6 flex flex-col gap-4">
        <OptionCard icon={User} title="Male" selected={answers.gender === 'Male'} onClick={() => setAnswers({...answers, gender: 'Male'})} />
        <OptionCard icon={User} title="Female" selected={answers.gender === 'Female'} onClick={() => setAnswers({...answers, gender: 'Female'})} />
        <OptionCard icon={User} title="Other / Prefer not to say" selected={answers.gender === 'Other'} onClick={() => setAnswers({...answers, gender: 'Other'})} />
      </div>
      <div className="mt-6">{renderFooter(!answers.gender)}</div>
    </motion.div>
  );

  const renderBodyWeight = () => (
    <motion.div 
      key="step4"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={SLIDE_TRANSITION}
      className="absolute inset-0 flex flex-col bg-white overflow-hidden"
    >
      {renderHeader("Body Weight", "Calibrate your AI body model.")}
      <div className="flex-1 flex flex-col items-center justify-center -mt-10">
        <div className="bg-zinc-100/80 p-1.5 rounded-2xl flex items-center w-48 mb-8">
           <button 
             onClick={() => setAnswers({...answers, weightUnit: 'lbs'})}
             style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: 44 }}
             className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${answers.weightUnit === 'lbs' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 active:bg-white/50'}`}
           >
             lbs
           </button>
           <button 
             onClick={() => setAnswers({...answers, weightUnit: 'kg'})}
             style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: 44 }}
             className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${answers.weightUnit === 'kg' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 active:bg-white/50'}`}
           >
             Kg
           </button>
        </div>
        <p className="text-zinc-500 font-medium mb-1">Current Body Weight</p>
        <h1 className="text-5xl font-extrabold tracking-tight text-zinc-900 mb-12">
          {answers.bodyWeight.toFixed(1)} <span className="text-4xl">{answers.weightUnit}</span>
        </h1>
        <WeightRuler 
          value={answers.bodyWeight} 
          unit={answers.weightUnit} 
          onChange={(val) => setAnswers({...answers, bodyWeight: val})}
        />
      </div>
      {renderFooter(false)}
    </motion.div>
  );

  const renderExperience = () => (
    <motion.div 
      key="step5"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={SLIDE_TRANSITION}
      className="absolute inset-0 flex flex-col bg-white overflow-y-auto overscroll-contain"
      style={{ WebkitOverflowScrolling: 'touch' as any }}
    >
      {renderHeader("Lifting Experience", "How long have you been training?")}
      <div className="px-6 flex flex-col gap-4">
        <OptionCard icon={Activity} title="Beginner (< 1 Year)" selected={answers.experience === 'Beginner'} onClick={() => setAnswers({...answers, experience: 'Beginner'})} />
        <OptionCard icon={TrendingUp} title="Intermediate (1-3 Years)" selected={answers.experience === 'Intermediate'} onClick={() => setAnswers({...answers, experience: 'Intermediate'})} />
        <OptionCard icon={Zap} title="Advanced (3+ Years)" selected={answers.experience === 'Advanced'} onClick={() => setAnswers({...answers, experience: 'Advanced'})} />
      </div>
      <div className="mt-6">{renderFooter(!answers.experience)}</div>
    </motion.div>
  );

  const renderSetup = () => (
    <motion.div 
      key="step6"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={SLIDE_TRANSITION}
      className="absolute inset-0 flex flex-col bg-white overflow-y-auto overscroll-contain"
      style={{ WebkitOverflowScrolling: 'touch' as any }}
    >
      {renderHeader("Training Environment", "How will you record your lifts?")}
      <div className="px-6 flex flex-col gap-4">
        <OptionCard icon={Camera} title="Phone on a Tripod" selected={answers.setup === 'Tripod'} onClick={() => setAnswers({...answers, setup: 'Tripod'})} />
        <OptionCard icon={Smartphone} title="Propped against water bottle" selected={answers.setup === 'Propped'} onClick={() => setAnswers({...answers, setup: 'Propped'})} />
        <OptionCard icon={Users} title="Training Partner filming" selected={answers.setup === 'Partner'} onClick={() => setAnswers({...answers, setup: 'Partner'})} />
      </div>
      <div className="mt-6">{renderFooter(!answers.setup)}</div>
    </motion.div>
  );

  const renderFocusAreas = () => (
    <motion.div 
      key="step7"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={SLIDE_TRANSITION}
      className="absolute inset-0 flex flex-col bg-white overflow-y-auto overscroll-contain"
      style={{ WebkitOverflowScrolling: 'touch' as any }}
    >
      {renderHeader("Lifting Preferences", "Which lifts do you want to perfect? (Select multiple)")}
      <div className="px-6 flex flex-col gap-4">
        <OptionCard icon={Dumbbell} title="Squat & Lower Body" selected={answers.focusAreas.includes('Squat')} onClick={() => toggleArrayItem('focusAreas', 'Squat')} multi />
        <OptionCard icon={Zap} title="Deadlift & Posterior Chain" selected={answers.focusAreas.includes('Deadlift')} onClick={() => toggleArrayItem('focusAreas', 'Deadlift')} multi />
        <OptionCard icon={Crosshair} title="Bench Press & Chest" selected={answers.focusAreas.includes('Bench')} onClick={() => toggleArrayItem('focusAreas', 'Bench')} multi />
        <OptionCard icon={TrendingUp} title="Overhead Press & Shoulders" selected={answers.focusAreas.includes('Overhead')} onClick={() => toggleArrayItem('focusAreas', 'Overhead')} multi />
      </div>
      <div className="mt-6">{renderFooter(answers.focusAreas.length === 0)}</div>
    </motion.div>
  );

  const renderWeaknesses = () => (
    <motion.div 
      key="step8"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={SLIDE_TRANSITION}
      className="absolute inset-0 flex flex-col bg-white overflow-y-auto overscroll-contain"
      style={{ WebkitOverflowScrolling: 'touch' as any }}
    >
      {renderHeader("Common Breakdowns", "What are you struggling with? (Select multiple)")}
      <div className="px-6 flex flex-col gap-4">
        <OptionCard icon={Activity} title="Squat Butt Wink" selected={answers.weaknesses.includes('Butt Wink')} onClick={() => toggleArrayItem('weaknesses', 'Butt Wink')} multi />
        <OptionCard icon={AlertTriangle} title="Knee Cave (Valgus)" selected={answers.weaknesses.includes('Knee Cave')} onClick={() => toggleArrayItem('weaknesses', 'Knee Cave')} multi />
        <OptionCard icon={Shield} title="Lower Back Rounding" selected={answers.weaknesses.includes('Lower Back Rounding')} onClick={() => toggleArrayItem('weaknesses', 'Lower Back Rounding')} multi />
        <OptionCard icon={Target} title="Bar Path Deviation" selected={answers.weaknesses.includes('Bar Path Deviation')} onClick={() => toggleArrayItem('weaknesses', 'Bar Path Deviation')} multi />
      </div>
      <div className="mt-6">{renderFooter(answers.weaknesses.length === 0)}</div>
    </motion.div>
  );

  const renderInjuries = () => (
    <motion.div 
      key="step9"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={SLIDE_TRANSITION}
      className="absolute inset-0 flex flex-col bg-white overflow-y-auto overscroll-contain"
      style={{ WebkitOverflowScrolling: 'touch' as any }}
    >
      {renderHeader("Current Pain Points", "Any past or present injuries? (Select multiple)")}
      <div className="px-6 flex flex-col gap-4">
        <OptionCard icon={Activity} title="Lower Back" selected={answers.injuries.includes('Lower Back')} onClick={() => toggleArrayItem('injuries', 'Lower Back')} multi />
        <OptionCard icon={Activity} title="Knees" selected={answers.injuries.includes('Knees')} onClick={() => toggleArrayItem('injuries', 'Knees')} multi />
        <OptionCard icon={Activity} title="Shoulders" selected={answers.injuries.includes('Shoulders')} onClick={() => toggleArrayItem('injuries', 'Shoulders')} multi />
        <OptionCard icon={CheckCircle} title="No injuries (Pain Free)" selected={answers.injuries.includes('None')} onClick={() => toggleArrayItem('injuries', 'None')} multi />
      </div>
      <div className="mt-6">{renderFooter(answers.injuries.length === 0)}</div>
    </motion.div>
  );

  const renderMotivation = () => (
    <motion.div 
      key="step10"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={SLIDE_TRANSITION}
      className="absolute inset-0 flex flex-col bg-white overflow-y-auto overscroll-contain"
      style={{ WebkitOverflowScrolling: 'touch' as any }}
    >
      {renderHeader("Primary Goal", "Why do you want to improve your form?")}
      <div className="px-6 flex flex-col gap-4">
        <OptionCard icon={Shield} title="Prevent injuries & train pain-free" selected={answers.primaryGoal === 'Injuries'} onClick={() => setAnswers({...answers, primaryGoal: 'Injuries'})} />
        <OptionCard icon={TrendingUp} title="Push heavier PRs safely" selected={answers.primaryGoal === 'PRs'} onClick={() => setAnswers({...answers, primaryGoal: 'PRs'})} />
        <OptionCard icon={Dumbbell} title="Maximize muscle growth" selected={answers.primaryGoal === 'Muscle'} onClick={() => setAnswers({...answers, primaryGoal: 'Muscle'})} />
        <OptionCard icon={Brain} title="Improve mind-muscle connection" selected={answers.primaryGoal === 'Mind-Muscle'} onClick={() => setAnswers({...answers, primaryGoal: 'Mind-Muscle'})} />
      </div>
      <div className="mt-6">{renderFooter(!answers.primaryGoal)}</div>
    </motion.div>
  );

  const renderStrictness = () => (
    <motion.div 
      key="step11"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={SLIDE_TRANSITION}
      className="absolute inset-0 flex flex-col bg-white overflow-y-auto overscroll-contain"
      style={{ WebkitOverflowScrolling: 'touch' as any }}
    >
      {renderHeader("AI Coach Strictness", "How demanding should your AI be?")}
      <div className="px-6 flex flex-col gap-4">
        <OptionCard icon={Gauge} title="Strict (No Mercy)" selected={answers.strictness === 'Strict'} onClick={() => setAnswers({...answers, strictness: 'Strict'})} />
        <OptionCard icon={Settings} title="Balanced (Optimal)" selected={answers.strictness === 'Balanced'} onClick={() => setAnswers({...answers, strictness: 'Balanced'})} />
        <OptionCard icon={Flame} title="Hype Man (Forgiving)" selected={answers.strictness === 'Hype Man'} onClick={() => setAnswers({...answers, strictness: 'Hype Man'})} />
      </div>
      <div className="mt-6">{renderFooter(!answers.strictness)}</div>
    </motion.div>
  );

  const renderPermissions = () => (
    <motion.div 
      key="step12"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={SLIDE_TRANSITION}
      className="absolute inset-0 flex flex-col bg-white overflow-y-auto overscroll-contain"
      style={{ WebkitOverflowScrolling: 'touch' as any }}
    >
      {renderHeader("Stay on Track", "Allow permissions for the best results.")}
      <div className="flex-1 flex flex-col px-6 gap-6 pt-4">
        
        {/* Audio Feedback Split */}
        <div className="bg-[#f4f4f5] rounded-[32px] p-6 w-full text-center shadow-sm">
          <Volume2 className="w-8 h-8 mx-auto text-zinc-800 mb-3" />
          <h3 className="font-bold text-xl px-4">Real-time Cues</h3>
          <p className="text-zinc-500 text-sm mt-2 mb-6 px-2">
            Get audio feedback mid-set if your form breaks down.
          </p>
          <div className="flex items-center bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
            <button 
               onClick={() => setAnswers({...answers, audioFeedbackAllowed: false})}
               style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: 52 }}
               className={`flex-1 py-4 text-center font-medium transition-colors border-r border-zinc-200 ${answers.audioFeedbackAllowed === false ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 active:bg-zinc-50'}`}
            >
              Skip
            </button>
            <button 
               onClick={() => setAnswers({...answers, audioFeedbackAllowed: true})}
               style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: 52 }}
               className={`flex-1 py-4 text-center font-semibold transition-colors ${answers.audioFeedbackAllowed === true ? 'bg-zinc-900 text-white' : 'text-zinc-900 active:bg-zinc-50'}`}
            >
              Enable
            </button>
          </div>
        </div>

        {/* Push Notifications Split */}
        <div className="bg-[#f4f4f5] rounded-[32px] p-6 w-full text-center shadow-sm">
          <Bell className="w-8 h-8 mx-auto text-zinc-800 mb-3" />
          <h3 className="font-bold text-xl px-4">Workout Summaries</h3>
          <p className="text-zinc-500 text-sm mt-2 mb-6 px-2">
            Receive push notifications when your AI analysis is ready.
          </p>
          <div className="flex items-center bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
            <button 
               onClick={() => setAnswers({...answers, notificationsAllowed: false})}
               style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: 52 }}
               className={`flex-1 py-4 text-center font-medium transition-colors border-r border-zinc-200 ${answers.notificationsAllowed === false ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-500 active:bg-zinc-50'}`}
            >
              Don't Allow
            </button>
            <button 
               onClick={() => setAnswers({...answers, notificationsAllowed: true})}
               style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', minHeight: 52 }}
               className={`flex-1 py-4 text-center font-semibold transition-colors ${answers.notificationsAllowed === true ? 'bg-zinc-900 text-white' : 'text-zinc-900 active:bg-zinc-50'}`}
            >
              Allow
            </button>
          </div>
        </div>
        
      </div>
      <div className="mt-4">{renderFooter(answers.audioFeedbackAllowed === null || answers.notificationsAllowed === null)}</div>
    </motion.div>
  );

  const renderFinal = () => (
    <motion.div 
      key="step13"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={SLIDE_TRANSITION}
      className="absolute inset-0 flex flex-col bg-white items-center justify-center overflow-y-auto overscroll-contain"
      style={{ WebkitOverflowScrolling: 'touch' as any }}
    >
       <div className="flex-1 flex flex-col items-center justify-center px-8 text-center mt-12">
          <div className="w-64 h-64 rounded-full bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-50 flex items-center justify-center mb-8 relative">
             <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiNkNGQ0ZDgiLz48L3N2Zz4=')] opacity-50 [mask-image:radial-gradient(circle_at_center,black,transparent)]" />
             <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-200 relative z-10 z-[20] rotate-[-5deg]">
               <Activity strokeWidth={2.5} className="w-16 h-16 text-zinc-900" />
             </div>
             <div className="absolute top-10 right-14 w-3 h-3 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '100ms'}} />
             <div className="absolute bottom-20 left-12 w-2 h-2 bg-zinc-800 rounded-full animate-bounce" style={{ animationDelay: '300ms'}} />
          </div>

          <div className="flex items-center gap-2 mb-4">
             <div className="w-5 h-5 rounded-full bg-zinc-200 flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-zinc-900" />
             </div>
             <p className="font-semibold text-zinc-800 text-sm">Calibration Complete</p>
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 leading-tight">
            Time to analyze your first lift!
          </h1>
       </div>

       <div className="w-full px-6 mb-12">
          <div className="bg-[#f4f4f5] p-5 rounded-3xl text-center relative">
             <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-zinc-200 border-4 border-white flex items-center justify-center">
                <Shield className="w-3 h-3 text-zinc-600" />
             </div>
             <h4 className="font-bold text-zinc-900 mb-2 mt-1">100% Private Processing</h4>
             <p className="text-xs text-zinc-500 font-medium leading-relaxed">
               Your videos stay on your device.<br/>We never store or share your workout footage.
             </p>
          </div>
       </div>

       <div className="w-full">
         {renderFooter(false, "Get Started")}
       </div>
    </motion.div>
  );

  return (
    <div
      className="fixed inset-0 bg-white font-sans overflow-hidden select-none"
      style={{
        // 100dvh accounts for mobile browser chrome (URL bar) collapsing on scroll
        height: '100dvh',
        // Safe area insets: notch (iOS), Dynamic Island, home indicator bar, Android status bar
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        // Remove tap highlight flash on Android Chrome
        WebkitTapHighlightColor: 'transparent',
        // Prevent pull-to-refresh rubber banding during onboarding
        overscrollBehavior: 'none',
      }}
    >
      <AnimatePresence mode="wait">
        {step === 1 && renderName()}
        {step === 2 && renderEmail()}
        {step === 3 && renderGender()}
        {step === 4 && renderBodyWeight()}
        {step === 5 && renderExperience()}
        {step === 6 && renderSetup()}
        {step === 7 && renderFocusAreas()}
        {step === 8 && renderWeaknesses()}
        {step === 9 && renderInjuries()}
        {step === 10 && renderMotivation()}
        {step === 11 && renderStrictness()}
        {step === 12 && renderPermissions()}
        {step === 13 && renderFinal()}
      </AnimatePresence>
    </div>
  );
}
