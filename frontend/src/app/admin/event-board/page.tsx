'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/textfield';
import { IBM_Plex_Sans } from 'next/font/google';
import { RadialSelector } from "@/components/circular-fan-speed-knob";
import { motion, AnimatePresence } from 'framer-motion';
import GlassRadioGroup from '@/components/glass-radio-group';
import AnimatedNumberCounter from "@/components/count-down-numbers";
import { AnimatedCounter } from "@/components/ui/animated-counter";
const TagSelector = dynamic(() => import("@/components/ui/tagSelector").then(mod => ({ default: mod.TagSelector })), {
  ssr: false,
  loading: () => <div className="h-9 bg-gray-800/50 border border-gray-600 rounded-md animate-pulse" />
});
import ToggleSwitch from "@/components/toggle-switch";
import RatingRangeSlider from "@/components/RatingRangeSlider";
import AnimatedNumberCountdown from '@/components/countdown-number';
import LinkEditor from "@/components/link-editor";

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
});

function CustomDateTimePicker() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDateTime = () => {
    if (!selectedDate && !selectedTime) return 'Pick date & time';

    const datePart = selectedDate ? selectedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) : '';

    const timePart = selectedTime || '';

    if (datePart && timePart) {
      return `${datePart} at ${timePart}`;
    } else if (datePart) {
      return datePart;
    } else if (timePart) {
      return timePart;
    }

    return 'Pick date & time';
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleConfirm = () => {
    setIsOpen(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };



  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSelectedTime(value);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="flex items-center gap-2" ref={containerRef}>
      <label className="text-lg font-medium text-white whitespace-nowrap">Date & Time:</label>
      <div className="relative">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-[240px] h-10 bg-gradient-to-r from-gray-900 to-black border border-gray-600 focus:border-blue-400 text-white rounded-xl text-sm px-4 py-2 text-left flex items-center justify-between hover:border-gray-500 focus:outline-none transition-all duration-200 shadow-lg"
        >
          <span className="truncate text-gray-200">{formatDateTime()}</span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg className="w-4 h-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute top-full left-0 mt-2 w-72 bg-gradient-to-br from-gray-900 via-black to-gray-900 border border-gray-600 rounded-2xl shadow-2xl z-50 p-5 backdrop-blur-sm"
            >
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <motion.button
                  onClick={() => navigateMonth('prev')}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-300 hover:text-white transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>

                <motion.h3
                  key={currentMonth.getMonth()}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-white font-semibold text-base"
                >
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </motion.h3>

                <motion.button
                  onClick={() => navigateMonth('next')}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-300 hover:text-white transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              </div>

              {/* Day names */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {dayNames.map((day, index) => (
                  <div key={index} className="text-center text-xs font-medium text-gray-400 py-1 h-7 flex items-center justify-center">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <motion.div
                key={currentMonth.getMonth()}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-7 gap-1 mb-4"
              >
                {getDaysInMonth(currentMonth).map((date, index) => (
                  <motion.button
                    key={index}
                    onClick={() => date && handleDateClick(date)}
                    disabled={!date}
                    whileHover={date ? { scale: 1.05 } : {}}
                    whileTap={date ? { scale: 0.95 } : {}}
                    className={`
                      h-8 w-full text-sm font-medium transition-all duration-200 flex items-center justify-center
                      ${!date ? 'invisible' : ''}
                      ${date && selectedDate && date.toDateString() === selectedDate.toDateString()
                        ? 'bg-blue-600 text-white rounded-lg shadow-md'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg'
                      }
                      ${date && date.toDateString() === new Date().toDateString()
                        ? 'ring-1 ring-blue-400'
                        : ''
                      }
                    `}
                  >
                    {date?.getDate()}
                  </motion.button>
                ))}
              </motion.div>

              {/* Time picker section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="border-t border-gray-700 pt-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <label className="text-white text-sm font-medium flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Time:
                  </label>
                  <input
                    type="text"
                    value={selectedTime}
                    onChange={handleTimeChange}
                    placeholder="e.g. 2:30 PM"
                    className="flex-1 h-8 bg-gray-800/50 border border-gray-600 focus:border-blue-400 text-white rounded-lg text-sm px-3 focus:ring-0 focus:outline-none transition-all duration-200 placeholder-gray-500"
                  />
                </div>

                <div className="text-xs text-gray-500 mb-3">
                  Format: 9:30 AM, 2 PM, 11:45 pm
                </div>

                {/* Confirm button */}
                <motion.button
                  onClick={handleConfirm}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-8 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white rounded-lg text-sm font-medium transition-all duration-200 shadow-lg shadow-purple-500/25 flex items-center justify-center"
                >
                  Confirm Selection
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Define the number of rounds options
const roundsOptions = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
];

type CompetitionType = 'icpc' | 'ioi' | 'long';

// Algorithm and data structure tags
interface Tag {
  id: string
  name: string
}

const AVAILABLE_TAGS: Tag[] = [
  { id: "1", name: "implementation" },
  { id: "2", name: "brute force" },
  { id: "3", name: "sortings" },
  { id: "4", name: "two pointers" },
  { id: "5", name: "binary search" },
  { id: "6", name: "math" },
  { id: "7", name: "greedy" },
  { id: "8", name: "strings" },
  { id: "9", name: "data structures" },
  { id: "10", name: "graphs" },
  { id: "11", name: "dfs and similar" },
  { id: "12", name: "trees" },
  { id: "13", name: "constructive algorithms" },
  { id: "14", name: "bitmasks" },
  { id: "15", name: "hashing" },
  { id: "16", name: "combinatorics" },
  { id: "17", name: "number theory" },
  { id: "18", name: "dp" },
  { id: "19", name: "shortest paths" },
  { id: "20", name: "divide and conquer" },
  { id: "21", name: "ternary search" },
  { id: "22", name: "dsu" },
  { id: "23", name: "geometry" },
  { id: "24", name: "interactive" },
  { id: "25", name: "matrices" },
  { id: "26", name: "probabilities" },
  { id: "27", name: "schedules" },
  { id: "28", name: "expression parsing" },
  { id: "29", name: "meet-in-the-middle" },
  { id: "30", name: "games" },
  { id: "31", name: "flows" },
  { id: "32", name: "graph matchings" },
  { id: "33", name: "string suffix structures" },
  { id: "34", name: "fft" },
  { id: "35", name: "chinese remainder theorem" },
  { id: "36", name: "2-sat" },
];

// Round configuration interface
interface RoundConfig {
  id: number;
  duration: number;
  selectedTags: Tag[];
  isRandom: boolean;
  ratingRange: [number, number];
  customQuestionsEnabled: boolean;
}

export default function EventBoardPage() {
  const [eventTitle, setEventTitle] = useState('');
  const [numberOfRounds, setNumberOfRounds] = useState<string>("1");
  const [competitionType, setCompetitionType] = useState<CompetitionType>('icpc');
  const [currentRound, setCurrentRound] = useState<number>(1);

  // Initialize round configurations
  const [roundConfigs, setRoundConfigs] = useState<RoundConfig[]>(() => {
    return Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      duration: 120,
      selectedTags: [],
      isRandom: false,
      ratingRange: [800, 2000] as [number, number],
      customQuestionsEnabled: false
    }));
  });

  // Update round configurations when number of rounds changes
  useEffect(() => {
    const numRounds = parseInt(numberOfRounds);
    if (currentRound > numRounds) {
      setCurrentRound(1);
    }
  }, [numberOfRounds, currentRound]);

  const getCurrentRoundConfig = (): RoundConfig => {
    return roundConfigs[currentRound - 1];
  };

  const updateRoundConfig = (updates: Partial<RoundConfig>) => {
    setRoundConfigs(prev =>
      prev.map(config =>
        config.id === currentRound
          ? { ...config, ...updates }
          : config
      )
    );
  };

  const handleEventTitleSubmit = (value: string) => {
    setEventTitle(value);
    console.log('Event title submitted:', value);
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden p-2 box-border">
      <div className={`h-full max-h-full flex flex-col ${ibmPlexSans.variable} font-sans`}>
        <div className="flex-shrink-0 relative mb-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Event Creation</h1>
            <div className="absolute -right-0 -top-2">
              <AnimatedNumberCountdown
                endDate={useMemo(() => {
                  const endDate = new Date();
                  const totalDuration = roundConfigs
                    .slice(0, parseInt(numberOfRounds))
                    .reduce((total, config) => total + (config.duration || 30), 0);
                  endDate.setMinutes(endDate.getMinutes() + totalDuration);
                  return endDate;
                }, [roundConfigs, numberOfRounds])}
                className="text-xl font-medium text-white/80"
                autoStart={false}
              />
            </div>
          </div>
          <div className="flex items-start gap-4 mt-4">
            <div className="flex items-center gap-2">
              <label className="text-lg font-medium text-white whitespace-nowrap">
                Title:
              </label>
              <div className="w-full max-w-md">
                <Input
                  name="title"
                  placeholder="Enter event title..."
                  className="w-full h-10 bg-black border border-gray-700 focus:border-blue-500 text-white placeholder-gray-400 rounded-lg text-sm px-3 py-2 focus:ring-0"
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      const target = e.target as HTMLInputElement;
                      const title = target.value.trim();
                      if (title) {
                        handleEventTitleSubmit(title);
                      }
                    }
                  }}
                />
              </div>
            </div>
            <CustomDateTimePicker />
            <div className="flex items-baseline gap-4">
              <h3 className="text-lg font-medium text-white whitespace-nowrap pt-1">Format:</h3>
              <div className="w-56">
                <GlassRadioGroup
                  value={competitionType}
                  onChange={(type: string) => setCompetitionType(type as CompetitionType)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-2 overflow-hidden min-h-0">
          {eventTitle && (
            <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-600 flex-shrink-0">
              <p className="text-white text-sm">
                <span className="text-gray-400">Current title:</span> {eventTitle}
              </p>
            </div>
          )}

          {/* Rounds and Configuration Section */}
          <div className={`flex gap-6 flex-1 overflow-hidden transition-all duration-500 ${getCurrentRoundConfig().customQuestionsEnabled ? 'max-w-none' : 'max-w-6xl'
            }`}>
            {/* Left Column - Rounds Selector */}
            <div className="flex-shrink-0 w-80 h-full overflow-hidden">
              <div className="flex items-center gap-2 pl-4 mb-2">
                <label className="text-lg font-medium text-white whitespace-nowrap">
                  Rounds
                </label>
                <span className="text-lg font-bold text-white">{numberOfRounds}</span>
              </div>
              <div className="flex h-full max-h-96 overflow-hidden">
                <div className="scale-[0.6] origin-top-left ml-2">
                  <RadialSelector
                    options={roundsOptions}
                    name="number-of-rounds"
                    defaultValue="1"
                    onValueChange={(value: string) => setNumberOfRounds(value)}
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Per-Round Configuration */}
            <div className={`flex-1 transition-all duration-500 ${getCurrentRoundConfig().customQuestionsEnabled ? 'min-w-0' : ''
              }`}>
              <div className={`rounded-xl bg-white/5 border border-white/10 overflow-hidden flex flex-col ${getCurrentRoundConfig().customQuestionsEnabled ? 'max-h-[28rem]' : 'max-h-80'
                }`}>
                {/* Round Tabs */}
                <div className="flex border-b border-white/10 overflow-x-auto">
                  {Array.from({ length: parseInt(numberOfRounds) }, (_, i) => i + 1).map((roundNum) => (
                    <button
                      key={roundNum}
                      onClick={() => setCurrentRound(roundNum)}
                      className={`relative flex-shrink-0 px-3 py-2 text-sm font-medium transition-all duration-300 ease-out flex items-center justify-center min-w-[70px] ${currentRound === roundNum
                        ? 'text-white'
                        : 'text-white/60 hover:text-white/90 hover:bg-white/5'
                        }`}
                    >
                      Round {roundNum}
                      {currentRound === roundNum && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* Round Configuration Content */}
                <div className={`p-4 flex-1 min-h-0 ${getCurrentRoundConfig().customQuestionsEnabled ? 'overflow-y-auto' : 'flex flex-col'
                  }`}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentRound}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                        duration: 0.4
                      }}
                      className="space-y-3 h-full flex flex-col min-h-0"
                    >
                      {/* Round Header with Custom Questions Toggle */}
                      <div className="flex items-center justify-between mb-2 flex-shrink-0">
                        <h3 className="text-lg font-semibold text-white">
                          Round {currentRound} Configuration
                        </h3>
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 }}
                          className="flex items-center gap-3 p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg"
                        >
                          <span className="text-purple-300 font-medium text-xs">Custom Questions</span>
                          <ToggleSwitch
                            name={`custom-questions-round-${currentRound}`}
                            checked={getCurrentRoundConfig().customQuestionsEnabled}
                            onChange={(e) => {
                              updateRoundConfig({ customQuestionsEnabled: e.target.checked });
                            }}
                          />
                        </motion.div>
                      </div>

                      <div className="grid gap-1 flex-shrink-0" style={{ gridTemplateColumns: '1fr 1fr 1.5fr' }}>
                        {/* Questions Counter */}
                        <div>
                          <h4 className="text-lg font-medium text-white/80 mb-1">Questions Counter</h4>
                          <AnimatedNumberCounter />
                        </div>

                        {/* Duration */}
                        <div>
                          <h4 className="text-lg font-medium text-white/80 mb-3">Duration (minutes)</h4>
                          <div className="flex items-center gap-2 w-full">
                            <div className="relative flex items-center">
                              <input
                                type="number"
                                value={getCurrentRoundConfig().duration}
                                min={30}
                                max={480}
                                onChange={(e) => {
                                  const inputValue = e.target.value;
                                  // Allow any input during typing
                                  const value = inputValue === '' ? 0 : parseInt(inputValue);
                                  if (!isNaN(value)) {
                                    updateRoundConfig({ duration: value });
                                  }
                                }}
                                onBlur={(e) => {
                                  // Ensure valid value when field loses focus
                                  const value = parseInt(e.target.value);
                                  if (isNaN(value) || value < 30) {
                                    updateRoundConfig({ duration: 30 });
                                  } else if (value > 480) {
                                    updateRoundConfig({ duration: 480 });
                                  }
                                }}
                                className="w-20 !bg-transparent px-1 py-0.5 text-center text-lg !text-white border-b border-white/30 outline-none appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <div className="flex flex-col -ml-1">
                                <button
                                  onClick={() => {
                                    const currentDuration = getCurrentRoundConfig().duration || 30;
                                    updateRoundConfig({ duration: Math.min(480, currentDuration + 10) });
                                  }}
                                  className="text-white/60 hover:text-white text-xs w-4 h-4 flex items-center justify-center"
                                >
                                  ▲
                                </button>
                                <button
                                  onClick={() => {
                                    const currentDuration = getCurrentRoundConfig().duration || 30;
                                    updateRoundConfig({ duration: Math.max(30, currentDuration - 10) });
                                  }}
                                  className="text-white/60 hover:text-white text-xs w-4 h-4 flex items-center justify-center"
                                >
                                  ▼
                                </button>
                              </div>
                            </div>
                            <AnimatedCounter value={getCurrentRoundConfig().duration || 30} />
                          </div>
                        </div>

                        {/* Problem Tags */}
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-medium text-white/80">Problem Tags</h4>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-white/70">Random</span>
                              <ToggleSwitch
                                name={`randomize-round-${currentRound}`}
                                checked={getCurrentRoundConfig().isRandom}
                                onChange={(e) => {
                                  const newValue = e.target.checked;
                                  updateRoundConfig({
                                    isRandom: newValue,
                                    selectedTags: newValue ? [] : getCurrentRoundConfig().selectedTags
                                  });
                                }}
                              />
                            </div>
                          </div>
                          {getCurrentRoundConfig().isRandom ? (
                            <div className="text-xs text-gray-400 italic py-2 px-3 bg-black/20 rounded-lg border border-gray-700">
                              Random problems
                            </div>
                          ) : (
                            <div className="flex-1">
                              <TagSelector
                                key={`tag-selector-${currentRound}`}
                                availableTags={AVAILABLE_TAGS}
                                selectedTags={getCurrentRoundConfig().selectedTags}
                                onTagsChange={(tags) => updateRoundConfig({ selectedTags: tags })}
                                placeholder={`Search topics...`}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 overflow-hidden min-h-0">
                        <AnimatePresence mode="wait">
                          {getCurrentRoundConfig().customQuestionsEnabled ? (
                            /* Custom Questions Link Editor */
                            <motion.div
                              key="link-editor"
                              initial={{ opacity: 0, x: -100, scale: 0.95 }}
                              animate={{ opacity: 1, x: 0, scale: 1 }}
                              exit={{ opacity: 0, x: -100, scale: 0.95 }}
                              transition={{
                                duration: 0.5,
                                type: "spring",
                                stiffness: 200,
                                damping: 25
                              }}
                              className="relative h-full"
                            >
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-xl blur-sm"
                              />
                              <motion.div
                                initial={{ borderColor: "rgba(139, 92, 246, 0)" }}
                                animate={{ borderColor: "rgba(139, 92, 246, 0.3)" }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                                className="relative bg-black/20 border rounded-xl p-4 backdrop-blur-sm h-full min-h-64 overflow-y-auto"
                              >
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: 0.3 }}
                                >
                                  <LinkEditor enabled={true} />
                                </motion.div>
                              </motion.div>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="rating-only"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.3 }}
                              className="flex-1 flex items-start justify-center pt-2"
                            >
                              {/* Rating Range */}
                              <div className="w-full">
                                <RatingRangeSlider
                                  min={800}
                                  max={3500}
                                  step={100}
                                  onChange={(range) => {
                                    updateRoundConfig({ ratingRange: [range.min, range.max] });
                                  }}
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
