import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type ArenaType = 'ICPC' | 'IOI' | 'Long';

interface ArenaStatsProps {
  totalArenasConcluded: number;
  arenaStats: {
    type: ArenaType;
    count: number;
  }[];
}

export function ArenaStats({ totalArenasConcluded, arenaStats }: ArenaStatsProps) {
  const getArenaTypeColor = (type: ArenaType) => {
    switch (type) {
      case 'ICPC':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'IOI':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Long':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <Card className="bg-black border-gray-800 shadow-lg w-fit min-w-[280px]">
      <CardHeader className="pb-3 px-5 pt-4">
        <CardTitle className="text-sm font-semibold text-white">Arena Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-4">
        <div className="flex items-center gap-4">
          {/* Total on the left */}
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-1">Total</p>
            <p className="text-3xl font-bold text-white">{totalArenasConcluded}</p>
          </div>
          
          {/* Divider */}
          <div className="h-16 w-px bg-gray-700"></div>
          
          {/* Types on the right */}
          <div className="flex-1">
            <div className="space-y-2">
              {arenaStats.map((stat) => (
                <div 
                  key={stat.type} 
                  className={`${getArenaTypeColor(stat.type)} px-3 py-2 rounded-lg border flex items-center justify-between`}
                >
                  <span className="text-sm font-semibold">{stat.type}</span>
                  <span className="text-lg font-bold">{stat.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
