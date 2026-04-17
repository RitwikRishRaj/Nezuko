'use client';

import { useState } from 'react';
import { IBM_Plex_Sans } from 'next/font/google';
import { motion } from 'framer-motion';
import ToggleSwitch from "@/components/toggle-switch";

// Tournament Bracket Component
interface Team {
  id: number;
  name: string;
  score: number | null;
}

interface BracketMatchProps {
  team1?: Team;
  team2?: Team;
  winner?: 'team1' | 'team2';
  className?: string;
  id?: string;
  isSelected?: boolean;
  isInPath?: boolean;
  onClick?: () => void;
}

function TournamentBracket({ selectedBracket, setSelectedBracket }: { selectedBracket: string | null, setSelectedBracket: (id: string | null) => void }) {
  // Generate 32 teams
  const allTeams: Team[] = Array.from({ length: 32 }, (_, i) => ({
    id: i + 1,
    name: `Team ${i + 1}`,
    score: null
  }));

  // Round of 32 (16 matches)
  const roundOf32: Team[][] = [];
  for (let i = 0; i < 32; i += 2) {
    roundOf32.push([allTeams[i], allTeams[i + 1]]);
  }

  // Round of 16 winners (8 matches)
  const roundOf16Teams: Team[] = [
    { id: 33, name: "Team 1", score: null }, // Winner of Team 1 vs Team 2
    { id: 34, name: "Team 4", score: null }, // Winner of Team 3 vs Team 4
    { id: 35, name: "Team 5", score: null }, // Winner of Team 5 vs Team 6
    { id: 36, name: "Team 8", score: null }, // Winner of Team 7 vs Team 8
    { id: 37, name: "Team 9", score: null }, // Winner of Team 9 vs Team 10
    { id: 38, name: "Team 12", score: null }, // Winner of Team 11 vs Team 12
    { id: 39, name: "Team 13", score: null }, // Winner of Team 13 vs Team 14
    { id: 40, name: "Team 16", score: null }, // Winner of Team 15 vs Team 16
  ];

  // Define bracket source paths for 32-team tournament
  const bracketSourcePaths: { [key: string]: string[] } = {
    // Round of 32 (no source)
    'r32_1': ['r32_1'], 'r32_2': ['r32_2'], 'r32_3': ['r32_3'], 'r32_4': ['r32_4'],
    'r32_5': ['r32_5'], 'r32_6': ['r32_6'], 'r32_7': ['r32_7'], 'r32_8': ['r32_8'],
    'r32_9': ['r32_9'], 'r32_10': ['r32_10'], 'r32_11': ['r32_11'], 'r32_12': ['r32_12'],
    'r32_13': ['r32_13'], 'r32_14': ['r32_14'], 'r32_15': ['r32_15'], 'r32_16': ['r32_16'],

    // Round of 16 (each match shows both teams' source paths)
    'r16_1': ['r16_1', 'r32_1', 'r32_5'], // Team 1 vs Team 9: Team 1 from r32_1, Team 9 from r32_5
    'r16_2': ['r16_2', 'r32_2', 'r32_6'], // Team 4 vs Team 12: Team 4 from r32_2, Team 12 from r32_6  
    'r16_3': ['r16_3', 'r32_3', 'r32_7'], // Team 5 vs Team 13: Team 5 from r32_3, Team 13 from r32_7
    'r16_4': ['r16_4', 'r32_4', 'r32_8'], // Team 8 vs Team 16: Team 8 from r32_4, Team 16 from r32_8
    'r16_5': ['r16_5', 'r32_9', 'r32_10'], // Next bracket: both teams' paths
    'r16_6': ['r16_6', 'r32_11', 'r32_12'], // Next bracket: both teams' paths
    'r16_7': ['r16_7', 'r32_13', 'r32_14'], // Next bracket: both teams' paths
    'r16_8': ['r16_8', 'r32_15', 'r32_16'], // Next bracket: both teams' paths

    // Quarter Finals (based on actual displayed teams)
    'q1': ['q1', 'r16_1', 'r16_2', 'r32_1', 'r32_2'], // Team 1 vs Team 4: Team 1 won r16_1, Team 4 won r16_2
    'q2': ['q2', 'r16_3', 'r16_4', 'r32_3', 'r32_4'], // Team 5 vs Team 8: Team 5 won r16_3, Team 8 won r16_4
    'q3': ['q3', 'r16_1', 'r16_2', 'r32_5', 'r32_6'], // Team 9 vs Team 12: Team 9 won r16_1, Team 12 won r16_2
    'q4': ['q4', 'r16_3', 'r16_4', 'r32_7', 'r32_8'], // Team 13 vs Team 16: Team 13 won r16_3, Team 16 won r16_4

    // Semi Finals 
    's1': ['s1', 'q1', 'q2', 'r16_1', 'r16_4', 'r32_1', 'r32_4'], // Team 1 vs Team 8
    's2': ['s2', 'q3', 'q4', 'r16_1', 'r16_4', 'r32_5', 'r32_8'], // Team 9 vs Team 16

    // Finals (Team 1 vs Team 16)
    'f1': ['f1', 's1', 's2', 'q1', 'q4', 'r16_1', 'r16_4', 'r32_1', 'r32_8']
  };

  const getSourcePathForBracket = (bracketId: string): string[] => {
    return bracketSourcePaths[bracketId] || [];
  };

  const isInSourcePath = (bracketId: string): boolean => {
    if (!selectedBracket) return false;
    const sourcePath = getSourcePathForBracket(selectedBracket);
    return sourcePath.includes(bracketId);
  };

  // Define which arrows should be highlighted based on source path
  const isArrowHighlighted = (arrowPosition: 'arrow1' | 'arrow2' | 'arrow3' | 'arrow4'): boolean => {
    if (!selectedBracket) return false;

    switch (arrowPosition) {
      case 'arrow1': // Between Round of 32 and Round of 16
        return selectedBracket.startsWith('r16_') || selectedBracket.startsWith('q') || selectedBracket.startsWith('s') || selectedBracket === 'f1';
      case 'arrow2': // Between Round of 16 and Quarter Finals
        return selectedBracket.startsWith('q') || selectedBracket.startsWith('s') || selectedBracket === 'f1';
      case 'arrow3': // Between quarters and semis
        return ['s1', 's2', 'f1'].includes(selectedBracket);
      case 'arrow4': // Between semis and finals
        return selectedBracket === 'f1';
      default:
        return false;
    }
  };

  const MedalIcon = () => (
    <svg height="16" width="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="#10b981">
      <path d="M212,96A84,84,0,1,0,76,161.9V240a4,4,0,0,0,4,4,4.05,4.05,0,0,0,1.79-.42L128,220.47l46.22,23.11A4,4,0,0,0,180,240V161.9A83.89,83.89,0,0,0,212,96ZM172,233.53l-42.22-21.11a4,4,0,0,0-3.58,0L84,233.53v-66a83.8,83.8,0,0,0,88,0ZM128,172a76,76,0,1,1,76-76A76.08,76.08,0,0,1,128,172Zm0-128a52,52,0,1,0,52,52A52.06,52.06,0,0,0,128,44Zm0,96a44,44,0,1,1,44-44A44.05,44.05,0,0,1,128,140Z" />
    </svg>
  );

  const ArrowIcon = ({ isHighlighted = false }) => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      className={`${isHighlighted ? 'text-cyan-400' : 'text-gray-500'} transition-colors duration-300`}
    >
      <path
        d="M9 18l6-6-6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const BracketMatch = ({ team1, team2, winner, className = "", id, isSelected, isInPath, onClick }: BracketMatchProps & { winner?: 'team1' | 'team2' }) => (
    <div
      className={`
        bg-gray-800/30 border rounded-lg p-2 w-full max-w-[220px] cursor-pointer transition-all duration-300
        ${isSelected ? 'border-cyan-400 bg-cyan-400/10' : isInPath ? 'border-cyan-400/50 bg-cyan-400/5' : 'border-gray-600/50'}
        hover:border-cyan-400/70 hover:bg-cyan-400/5
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <div className={`text-xs font-medium truncate ${winner === 'team1' ? 'text-cyan-400' : 'text-white'}`}>
            {team1?.name || "TBD"}
          </div>
          {winner === 'team1' && <MedalIcon />}
        </div>
        <div className="text-xs text-gray-400 px-1">vs</div>
        <div className="flex items-center gap-1 flex-1 min-w-0 justify-end">
          {winner === 'team2' && <MedalIcon />}
          <div className={`text-xs font-medium truncate ${winner === 'team2' ? 'text-cyan-400' : 'text-white'}`}>
            {team2?.name || "TBD"}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto p-4 overflow-x-auto">
      <div className="flex items-start gap-4 min-w-[1400px]">
        {/* Round of 32 */}
        <div className="space-y-2 min-w-[180px]">
          <h3 className="text-sm font-semibold text-white mb-2 text-center">Round of 32</h3>
          <div className="space-y-1">
            {roundOf32.slice(0, 8).map((match, i) => (
              <BracketMatch
                key={`r32_${i + 1}`}
                id={`r32_${i + 1}`}
                team1={match[0]}
                team2={match[1]}
                winner={i % 2 === 0 ? "team1" : "team2"}
                isSelected={selectedBracket === `r32_${i + 1}`}
                isInPath={isInSourcePath(`r32_${i + 1}`)}
                onClick={() => setSelectedBracket(selectedBracket === `r32_${i + 1}` ? null : `r32_${i + 1}`)}
                className="mb-1"
              />
            ))}
            <div className="border-t border-gray-600 my-2"></div>
            {roundOf32.slice(8, 16).map((match, i) => (
              <BracketMatch
                key={`r32_${i + 9}`}
                id={`r32_${i + 9}`}
                team1={match[0]}
                team2={match[1]}
                winner={i % 2 === 0 ? "team1" : "team2"}
                isSelected={selectedBracket === `r32_${i + 9}`}
                isInPath={isInSourcePath(`r32_${i + 9}`)}
                onClick={() => setSelectedBracket(selectedBracket === `r32_${i + 9}` ? null : `r32_${i + 9}`)}
                className="mb-1"
              />
            ))}
          </div>
        </div>

        {/* Arrow 1 */}
        <div className="flex items-center justify-center h-full pt-20">
          <ArrowIcon isHighlighted={isArrowHighlighted('arrow1')} />
        </div>

        {/* Round of 16 */}
        <div className="space-y-2 min-w-[180px]">
          <h3 className="text-sm font-semibold text-white mb-2 text-center">Round of 16</h3>
          <div className="space-y-2 pt-34">
            {roundOf16Teams.slice(0, 4).map((team, i) => (
              <BracketMatch
                key={`r16_${i + 1}`}
                id={`r16_${i + 1}`}
                team1={team}
                team2={roundOf16Teams[i + 4] || { id: 0, name: "TBD", score: null }}
                winner="team1"
                isSelected={selectedBracket === `r16_${i + 1}`}
                isInPath={isInSourcePath(`r16_${i + 1}`)}
                onClick={() => setSelectedBracket(selectedBracket === `r16_${i + 1}` ? null : `r16_${i + 1}`)}
                className="mb-2"
              />
            ))}
            <div className="border-t border-gray-600 my-2"></div>
            {roundOf16Teams.slice(4, 8).map((team, i) => (
              <BracketMatch
                key={`r16_${i + 5}`}
                id={`r16_${i + 5}`}
                team1={team}
                team2={{ id: 0, name: "TBD", score: null }}
                winner="team1"
                isSelected={selectedBracket === `r16_${i + 5}`}
                isInPath={isInSourcePath(`r16_${i + 5}`)}
                onClick={() => setSelectedBracket(selectedBracket === `r16_${i + 5}` ? null : `r16_${i + 5}`)}
                className="mb-2"
              />
            ))}
          </div>
        </div>

        {/* Arrow 2 */}
        <div className="flex items-center justify-center h-full pt-20">
          <ArrowIcon isHighlighted={isArrowHighlighted('arrow2')} />
        </div>

        {/* Quarter Finals */}
        <div className="space-y-2 min-w-[180px]">
          <h3 className="text-sm font-semibold text-white mb-2 text-center">Quarter Finals</h3>
          <div className="space-y-4 pt-34">
            <BracketMatch
              id="q1"
              team1={{ id: 41, name: "Team 1", score: null }}
              team2={{ id: 42, name: "Team 4", score: null }}
              winner="team1"
              isSelected={selectedBracket === 'q1'}
              isInPath={isInSourcePath('q1')}
              onClick={() => setSelectedBracket(selectedBracket === 'q1' ? null : 'q1')}
            />
            <BracketMatch
              id="q2"
              team1={{ id: 43, name: "Team 5", score: null }}
              team2={{ id: 44, name: "Team 8", score: null }}
              winner="team2"
              isSelected={selectedBracket === 'q2'}
              isInPath={isInSourcePath('q2')}
              onClick={() => setSelectedBracket(selectedBracket === 'q2' ? null : 'q2')}
            />
            <div className="border-t border-gray-600 my-2"></div>
            <BracketMatch
              id="q3"
              team1={{ id: 45, name: "Team 9", score: null }}
              team2={{ id: 46, name: "Team 12", score: null }}
              winner="team1"
              isSelected={selectedBracket === 'q3'}
              isInPath={isInSourcePath('q3')}
              onClick={() => setSelectedBracket(selectedBracket === 'q3' ? null : 'q3')}
            />
            <BracketMatch
              id="q4"
              team1={{ id: 47, name: "Team 13", score: null }}
              team2={{ id: 48, name: "Team 16", score: null }}
              winner="team2"
              isSelected={selectedBracket === 'q4'}
              isInPath={isInSourcePath('q4')}
              onClick={() => setSelectedBracket(selectedBracket === 'q4' ? null : 'q4')}
            />
          </div>
        </div>

        {/* Arrow 3 */}
        <div className="flex items-center justify-center h-full pt-20">
          <ArrowIcon isHighlighted={isArrowHighlighted('arrow3')} />
        </div>

        {/* Semi Finals */}
        <div className="space-y-2 min-w-[180px]">
          <h3 className="text-sm font-semibold text-white mb-2 text-center">Semi Finals</h3>
          <div className="space-y-8 pt-34">
            <BracketMatch
              id="s1"
              team1={{ id: 49, name: "Team 1", score: null }}
              team2={{ id: 50, name: "Team 8", score: null }}
              winner="team1"
              isSelected={selectedBracket === 's1'}
              isInPath={isInSourcePath('s1')}
              onClick={() => setSelectedBracket(selectedBracket === 's1' ? null : 's1')}
            />
            <BracketMatch
              id="s2"
              team1={{ id: 51, name: "Team 9", score: null }}
              team2={{ id: 52, name: "Team 16", score: null }}
              winner="team2"
              isSelected={selectedBracket === 's2'}
              isInPath={isInSourcePath('s2')}
              onClick={() => setSelectedBracket(selectedBracket === 's2' ? null : 's2')}
            />
          </div>
        </div>

        {/* Arrow 4 */}
        <div className="flex items-center justify-center h-full pt-20">
          <ArrowIcon isHighlighted={isArrowHighlighted('arrow4')} />
        </div>

        {/* Finals */}
        <div className="space-y-3 min-w-[180px]">
          <h3 className="text-sm font-semibold text-white mb-2 text-center">Finals</h3>
          <div className="pt-12 space-y-4">
            <BracketMatch
              id="f1"
              team1={{ id: 53, name: "Team 1", score: null }}
              team2={{ id: 54, name: "Team 16", score: null }}
              winner="team1"
              isSelected={selectedBracket === 'f1'}
              isInPath={isInSourcePath('f1')}
              onClick={() => setSelectedBracket(selectedBracket === 'f1' ? null : 'f1')}
            />

            {/* Champion Declaration */}
            <div className="pt-4">
              <h4 className="text-xs font-semibold text-yellow-400 mb-2 text-center">🏆 Champion</h4>
              <div className="bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 w-full max-w-[180px]">
                <div className="flex items-center justify-center gap-2">
                  <MedalIcon />
                  <span className="text-xs font-bold text-yellow-300">Team 1</span>
                  <MedalIcon />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
});

export default function LiveEventBoardPage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [selectedBracket, setSelectedBracket] = useState<string | null>(null);

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-black">
      <div className={`h-full max-h-full flex flex-col ${ibmPlexSans.variable} font-sans`}>
        {/* Header with centered title and maintenance toggle */}
        <div className="flex-shrink-0 relative p-6">
          <div className="flex items-center justify-center relative">
            <h1 className="text-3xl font-bold text-white text-center">
              Live Event Board
            </h1>

            {/* Maintenance Mode Toggle - positioned in top right */}
            <div className="absolute right-0 top-0">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <span className="text-red-300 font-medium text-sm">Maintenance Mode</span>
                <ToggleSwitch
                  name="maintenance-mode"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                />
              </motion.div>
            </div>
          </div>
        </div>

        {/* Main content area with tournament bracket */}
        <div className="flex-1 flex flex-col items-center p-6 overflow-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            {/* Quick Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white/80 mb-3">Match Control</h3>
                <div className="space-y-2">
                  <button className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 rounded text-sm transition-all duration-200">
                    Start Next Match
                  </button>
                  <button className="w-full px-3 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-300 rounded text-sm transition-all duration-200">
                    Update Scores
                  </button>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white/80 mb-3">Tournament Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Round:</span>
                    <span className="text-white">Quarter Finals</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Teams Remaining:</span>
                    <span className="text-white">8</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white/80 mb-3">Actions</h3>
                <div className="space-y-2">
                  <button className="w-full px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 rounded text-sm transition-all duration-200">
                    Export Bracket
                  </button>
                  <button className="w-full px-3 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/30 text-yellow-300 rounded text-sm transition-all duration-200">
                    Reset Tournament
                  </button>
                </div>
              </div>
            </div>

            {/* Tournament Bracket Card */}
            <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-white">
                    Tournament Bracket
                  </h2>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${maintenanceMode
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-green-500/20 text-green-300 border border-green-500/30'
                    }`}>
                    {maintenanceMode ? 'Maintenance' : 'Live'}
                  </div>
                </div>

                {/* Tournament Bracket */}
                <div className="relative">
                  <TournamentBracket selectedBracket={selectedBracket} setSelectedBracket={setSelectedBracket} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}