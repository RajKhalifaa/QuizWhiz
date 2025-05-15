import { useEffect, useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { formatCompletionTime } from "@/lib/timeUtils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LeaderboardEntry {
  id: number;
  username: string;
  score: number;
  timeTaken: string;
  completedAt: string;
  level: string;
}

export default function Leaderboard() {
  const [, params] = useRoute("/leaderboard/material/:materialId");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const materialId = Number(params?.materialId);
  const [activeLevel, setActiveLevel] = useState<string>("Beginner");
  
  const { data, isLoading, error } = useQuery<LeaderboardEntry[]>({
    queryKey: [`/api/leaderboard/material/${materialId}`],
    enabled: !isNaN(materialId)
  });
  
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load leaderboard. Please try again later.",
        variant: "destructive"
      });
    }
  }, [error, toast]);
  
  // Filter entries by level
  const filteredEntries = data?.filter(entry => entry.level === activeLevel) || [];
  
  // Sort by score (desc) and time taken (asc)
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score;
    }
    
    // Convert time to seconds for comparison
    const [aMin, aSec] = a.timeTaken.split(':').map(Number);
    const [bMin, bSec] = b.timeTaken.split(':').map(Number);
    const aSeconds = aMin * 60 + aSec;
    const bSeconds = bMin * 60 + bSec;
    
    return aSeconds - bSeconds;
  });
  
  // Get the top 3 for the podium
  const topThree = sortedEntries.slice(0, 3);
  while (topThree.length < 3) {
    topThree.push({
      id: -topThree.length,
      username: "---",
      score: 0,
      timeTaken: "00:00",
      completedAt: new Date().toISOString(),
      level: activeLevel
    });
  }
  
  // Generate an initial for avatar
  const getInitial = (name: string) => name.charAt(0).toUpperCase();
  
  // Get colors for ranks
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 0: return "primary";
      case 1: return "secondary";
      case 2: return "[#CD7F32]";
      default: return "gray-400";
    }
  };
  
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center mb-6">
        <Link href={`/results/${materialId}`}>
          <Button variant="outline" size="icon" className="mr-4 rounded-full">
            <span className="material-icons text-primary">arrow_back</span>
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Leaderboard</h1>
          <p className="text-gray-600 mt-1">Quiz Rankings - {activeLevel} Level</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Top Students</CardTitle>
            
            <div className="flex space-x-2">
              <Button 
                className={activeLevel === "Beginner" ? "bg-primary text-white" : "bg-primary/20 text-primary"}
                onClick={() => setActiveLevel("Beginner")}
              >
                Beginner
              </Button>
              <Button 
                className={activeLevel === "Intermediate" ? "bg-primary text-white" : "bg-primary/20 text-primary"}
                onClick={() => setActiveLevel("Intermediate")}
              >
                Intermediate
              </Button>
              <Button 
                className={activeLevel === "Advanced" ? "bg-primary text-white" : "bg-primary/20 text-primary"}
                onClick={() => setActiveLevel("Advanced")}
              >
                Advanced
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sortedEntries.length > 0 ? (
            <>
              {/* Top 3 podium */}
              <div className="flex justify-center items-end space-x-4 mb-8">
                {topThree.map((entry, index) => {
                  const rankOrder = [1, 0, 2]; // Reorder for display (2nd, 1st, 3rd)
                  const rank = rankOrder[index];
                  const rankNumber = rank + 1;
                  const color = getRankColor(rank);
                  
                  // Different podium heights
                  const heights = ["h-24", "h-32", "h-20"];
                  
                  // Different avatar sizes
                  const avatarSizes = ["w-12 h-12", "w-16 h-16", "w-12 h-12"];
                  const avatarContainerSizes = ["w-12 h-12", "w-16 h-16", "w-12 h-12"];
                  const circleSizes = ["w-12 h-12", "w-16 h-16", "w-12 h-12"];
                  const badgeSizes = ["w-12 h-12", "w-16 h-16", "w-12 h-12"];
                  
                  return (
                    <div key={rank} className="flex flex-col items-center">
                      <div className={`${badgeSizes[index]} rounded-full bg-${color}/20 border-2 border-${color} flex items-center justify-center mb-2`}>
                        <span className={`font-bold text-${color} ${rank === 0 ? 'text-xl' : ''}`}>{rankNumber}</span>
                      </div>
                      <div className={`${heights[index]} w-24 sm:w-32 rounded-t-lg bg-${color} flex items-center justify-center`}>
                        <div className="text-center">
                          <div className={`${avatarContainerSizes[index]} rounded-full bg-white mx-auto mb-1 overflow-hidden`}>
                            {entry.id > 0 ? (
                              <Avatar className={avatarSizes[index]}>
                                <AvatarFallback>{getInitial(entry.username)}</AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className={`${circleSizes[index]} bg-gray-200 flex items-center justify-center`}>
                                <span className="text-gray-400">?</span>
                              </div>
                            )}
                          </div>
                          <span className="text-white font-bold text-sm">{entry.username}</span>
                          <p className="text-white text-xs">{entry.score}%</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Leaderboard table */}
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b-2 border-border">
                      <th className="px-3 py-3 text-left font-bold text-gray-800">Rank</th>
                      <th className="px-3 py-3 text-left font-bold text-gray-800">Student</th>
                      <th className="px-3 py-3 text-left font-bold text-gray-800">Score</th>
                      <th className="px-3 py-3 text-left font-bold text-gray-800">Time</th>
                      <th className="px-3 py-3 text-left font-bold text-gray-800">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEntries.map((entry, index) => {
                      const isTop3 = index < 3;
                      const medalColors = ["text-warning", "text-secondary", "text-[#CD7F32]"];
                      
                      return (
                        <tr key={entry.id} className={`border-b border-border ${index === 0 ? 'bg-primary/10' : ''}`}>
                          <td className="px-3 py-3">
                            {isTop3 ? (
                              <div className="flex items-center">
                                <span className="font-bold text-primary">{index + 1}</span>
                                <span className={`material-icons ${medalColors[index]} ml-1`}>emoji_events</span>
                              </div>
                            ) : (
                              <span className="font-bold">{index + 1}</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center">
                              <Avatar className="w-8 h-8 mr-2">
                                <AvatarFallback>{getInitial(entry.username)}</AvatarFallback>
                              </Avatar>
                              <span className={index === 0 ? "font-bold" : ""}>{entry.username}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 font-bold text-success">{entry.score}%</td>
                          <td className="px-3 py-3">{formatCompletionTime(entry.timeTaken)}</td>
                          <td className="px-3 py-3">
                            {new Date(entry.completedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <span className="material-icons text-6xl text-gray-400">emoji_events</span>
              <p className="mt-4 text-lg text-gray-600">No leaderboard entries yet for {activeLevel} level.</p>
              <p className="text-gray-600">Be the first to take this quiz!</p>
              <Link href="/subjects">
                <Button className="mt-6">
                  Browse Subjects
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
