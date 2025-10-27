import { ProblemTable } from "@/components/problem-table";
import { Leaderboard } from "@/components/leaderboard";
import { TeamStats } from "@/components/team-stats";
import { TeamChat } from "@/components/team-chat";
import AnimatedNumberCountdown from "@/components/countdown-number";
import { Clock } from "lucide-react";

export default function ArenaPage() {
  // Set the end date for the countdown (1 hour from now)
  const endDate = new Date();
  endDate.setHours(endDate.getHours() + 1);

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center gap-8">
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
            <div className="flex items-center px-6 py-3">
              <div className="flex items-center gap-6">
                <div className="font-bold text-foreground">
                  <div className="text-muted-foreground text-base font-medium">Round</div>
                  <div className="text-xl">1 of 2</div>
                </div>
                <div className="h-10 w-px bg-border"></div>
                <div className="font-bold text-foreground">
                  <div className="text-muted-foreground text-base font-medium">Team Points</div>
                  <div className="text-xl">1,245</div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
            <div className="px-6 py-3">
              <AnimatedNumberCountdown 
                endDate={endDate} 
                autoStart={false}
                className="text-base"
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              <ProblemTable />
            </div>
            <TeamStats />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <Leaderboard />
            <TeamChat />
          </div>
        </div>
      </div>
    </main>
  );
}