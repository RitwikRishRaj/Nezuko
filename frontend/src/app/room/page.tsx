"use client"

import React, { useState, useMemo } from "react"
import { IceCream, Puzzle } from "lucide-react"
import { HoverButton } from "@/components/ui/hover-button"
import { Badge } from "@/components/ui/badge"
import AnimatedNumberCounter from "@/components/count-down-numbers"
import { AnimatedCounter } from "@/components/ui/animated-counter"
import GlassRadioGroup from "@/components/glass-radio-group"
import { TagSelector } from "@/components/ui/tagSelector"
import ToggleSwitch from "@/components/toggle-switch"
import RatingRangeSlider from "@/components/RatingRangeSlider"
import LinkEditor from "@/components/link-editor"
import AnimatedNumberCountdown from "@/components/countdown-number"

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
]


export default function RoomPage() {
  const [minutes, setMinutes] = useState(1); // Time in minutes
  const [competitionType, setCompetitionType] = useState<CompetitionType>('icpc');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [isRandom, setIsRandom] = useState(false);
  const [showProblemLinks, setShowProblemLinks] = useState(true);
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black p-4 overflow-hidden">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>

      {/* Gradient accents */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-6xl rounded-2xl border border-white/10 bg-black/40 p-8 backdrop-blur-xl shadow-2xl">
        <div className="relative mb-10">
          <div className="flex items-center gap-6">
            <h1 className="text-4xl font-bold text-white">Room</h1>
            <div className="flex items-center gap-3">
              <HoverButton className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 px-4 py-2.5 group/button">
                <span className="relative z-10 flex items-center gap-3 transition-all duration-300">
                  <span className="relative text-white">
                    <svg
                      className="group-hover/button:scale-110 group-hover/button:-translate-y-0.5 transition-transform duration-300 group-active/button:scale-95"
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
                      <line x1="13" x2="19" y1="19" y2="13" />
                      <line x1="16" x2="20" y1="16" y2="20" />
                      <line x1="19" x2="21" y1="21" y2="19" />
                      <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
                      <line x1="5" x2="9" y1="14" y2="18" />
                      <line x1="7" x2="4" y1="17" y2="20" />
                      <line x1="3" x2="5" y1="19" y2="21" />
                    </svg>
                  </span>
                  <span className="font-semibold text-white/95 group-hover/button:translate-y-[-1px] group-hover/button:scale-105 transition-all duration-300">Play</span>
                </span>
              </HoverButton>

              <HoverButton className="bg-gradient-to-r from-red-500/20 to-rose-500/20 hover:from-red-500/30 hover:to-rose-500/30 px-4 py-2.5 group/button">
                <span className="relative z-10 flex items-center gap-3 transition-all duration-300">
                  <span className="relative text-white">
                    <svg
                      className="group-hover/button:scale-110 group-hover/button:-translate-y-0.5 transition-transform duration-300 group-active/button:scale-95"
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 7l16 0" />
                      <path d="M10 11l0 6" />
                      <path d="M14 11l0 6" />
                      <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                      <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                    </svg>
                  </span>
                  <span className="font-semibold text-white/95 group-hover/button:translate-y-[-1px] transition-transform duration-300">Discard</span>
                </span>
              </HoverButton>
            </div>
          </div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <AnimatedNumberCountdown
              endDate={useMemo(() => {
                const endDate = new Date();
                endDate.setMinutes(endDate.getMinutes() + minutes);
                return endDate;
              }, [minutes])}
              className="text-xl font-medium text-white/80"
              autoStart={false}
            />
          </div>
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Host vs Invite */}
          <div className="space-y-6">
            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold text-white mb-3">Hosts</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 px-3 bg-black/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center">
                      <span className="text-base">👤</span>
                    </div>
                    <span className="text-sm text-white">You (Host 1)</span>
                  </div>
                  <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors">
                    Copy Invite Link
                  </button>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-black/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center">
                      <span className="text-base">👤</span>
                    </div>
                    <span className="text-sm text-white">You (Host 2)</span>
                  </div>
                  <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors">
                    Copy Invite Link
                  </button>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-black/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center">
                      <span className="text-base">👤</span>
                    </div>
                    <span className="text-sm text-white">You (Host 3)</span>
                  </div>
                  <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors">
                    Copy Invite Link
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-2xl font-semibold text-white mb-3">Opponent</h2>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 px-3 bg-black/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center">
                      <span className="text-base">👤</span>
                    </div>
                    <span className="text-sm text-white">You (Host 1)</span>
                  </div>
                  <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors">
                    Copy Invite Link
                  </button>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-black/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center">
                      <span className="text-base">👤</span>
                    </div>
                    <span className="text-sm text-white">You (Host 2)</span>
                  </div>
                  <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors">
                    Copy Invite Link
                  </button>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-black/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center">
                      <span className="text-base">👤</span>
                    </div>
                    <span className="text-sm text-white">You (Host 3)</span>
                  </div>
                  <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors">
                    Copy Invite Link
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Counter */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-full max-w-md">
              <div className="rounded-xl bg-white/5 p-6 border border-white/10">
                <div className="w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 pr-6">
                      <h3 className="text-lg font-medium text-white/80 mb-3">Questions Counter</h3>
                      <AnimatedNumberCounter />
                    </div>
                    <div className="h-16 w-px bg-white/20"></div>
                    <div className="flex-1 pl-6">
                      <h3 className="text-lg font-medium text-white/80 mb-3">Time (in minutes)</h3>
                      <div className="flex items-center justify-between w-full">
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            value={minutes}
                            min={1}
                            max={560}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 1;
                              setMinutes(Math.min(560, Math.max(1, value)));
                            }}
                            className="w-16 !bg-transparent px-1 py-0.5 text-center text-lg !text-white border-b border-white/30 outline-none appearance-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <div className="flex flex-col -ml-1">
                            <button
                              onClick={() => setMinutes(prev => Math.min(560, prev + 1))}
                              className="text-white/60 hover:text-white text-xs w-4 h-4 flex items-center justify-center"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => setMinutes(prev => Math.max(1, prev - 1))}
                              className="text-white/60 hover:text-white text-xs w-4 h-4 flex items-center justify-center"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                        <AnimatedCounter value={minutes} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Format Selector */}
                <div className="mt-6 flex items-baseline gap-4">
                  <h3 className="text-lg font-medium text-white/80 whitespace-nowrap pt-1">Format</h3>
                  <div className="w-56">
                    <GlassRadioGroup
                      value={competitionType}
                      onChange={(type: string) => setCompetitionType(type as CompetitionType)}
                    />
                  </div>
                </div>

                {/* Tags Input */}
                <div className="mt-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-medium text-white/80">Tags</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/70">Randomize</span>
                      <div className="relative top-0.5">
                        <ToggleSwitch
                          name="randomize"
                          checked={isRandom}
                          onChange={(e) => {
                            const newValue = e.target.checked;
                            setIsRandom(newValue);
                            if (newValue) {
                              setSelectedTags([]);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  {isRandom ? (
                    <div className="text-sm text-gray-400 italic py-2 px-3 bg-black/20 rounded-md">
                      Random questions will be provided in the arena
                    </div>
                  ) : (
                    <TagSelector
                      availableTags={AVAILABLE_TAGS}
                      selectedTags={selectedTags}
                      onTagsChange={setSelectedTags}
                      placeholder="Search or create a topic..."
                    />
                  )}
                </div>

                {/* Rating Range Selector */}
                <div className="mt-0">
                  <RatingRangeSlider
                    min={800}
                    max={3500}
                    step={100}
                    onChange={(range) => {
                      console.log('Rating range selected:', range);
                      // You can add your state management logic here
                    }}
                  />
                </div>

                {/* Link Editor Section */}
                <div className="mt-0 w-full">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-white/80">Problem Links</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/70">Enable</span>
                      <div className="relative top-0.5">
                        <ToggleSwitch
                          name="problemLinks"
                          checked={showProblemLinks}
                          onChange={(e) => setShowProblemLinks(e.target.checked)}
                        />
                      </div>
                    </div>
                  </div>
                  <LinkEditor enabled={showProblemLinks} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
