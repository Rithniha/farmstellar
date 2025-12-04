"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import LeaderboardCard from "@/components/app/leaderboard-card";
import { UserProgressCard } from "@/components/app/user-progress-card";
import { WeatherAlertCard } from "@/components/app/weather-alert-card";
import { OngoingQuestsCard } from "@/components/app/ongoing-quests-card";
import { getGreeting } from "@/lib/utils";
import { useUser } from "@/lib/userContext";
import Image from "next/image";

export default function FarmerDashboard({ onStartQuest }) {
  const userData = useUser();
  useEffect(() => {
    const name = userData?.name;
    if (!name) return;
    try {
      const key = `greeted_${name}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch (e) {
      // ignore session storage errors
    }

    toast.success(
      <div className="flex items-center gap-3">
        <span className="text-2xl animate-wiggle" role="img" aria-label="wave">
          👋
        </span>
        <div>
          <div className="font-bold">
            Welcome, {userData?.name || "Farmer"}!
          </div>
          <div className="text-xs text-muted-foreground">Happy farming 🌱</div>
        </div>
      </div>,
      { duration: 4500 }
    );
  }, [userData?.name]);
  const handleResumeQuest = (questId) => {
    if (onStartQuest) {
      onStartQuest(questId);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <div className="flex justify-start items-center gap-3 ml-14 sm:ml-16">
            {/* <div className="w-10 h-10 bg-linear-to-br from-primary to-accent rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div> */}
            <Image
              src="/logo.png"
              alt="FarmStellar Logo"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <div>
              <div className="flex items-center gap-2">
                {/* <Sun className="w-4 h-4 text-accent" /> */}
                <h1 className="text-lg sm:text-xl font-bold text-foreground">
                  {getGreeting()}, {userData?.name || "Farmer"}!
                </h1>
              </div>
              <p className="text-xs text-muted-foreground">
                Ready to grow your knowledge today? 🌱
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content (2/3 width on desktop) */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Progress Bar */}
            <UserProgressCard userData={userData} />

            {/* Weather Alert Widget */}
            <WeatherAlertCard
              location={userData?.location || "Bangalore Rural, Karnataka"}
            />
          </div>

          {/* Right Column - Leaderboard (1/3 width on desktop) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Ongoing Quests Section */}
              <OngoingQuestsCard onResumeQuest={handleResumeQuest} />

              {/* Leaderboard - positioned below ongoing quests */}
              <LeaderboardCard />
            </div>
          </div>
        </div>

        {/* Quick Stats Section */}
        <div className="mt-8 bg-card border-2 border-border rounded-3xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-foreground mb-6">
            Your Achievements
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-linear-to-br from-primary/10 to-transparent rounded-2xl border border-primary/20 hover:scale-105 transition-transform">
              <p className="text-3xl font-bold text-primary mb-1">
                {userData?.questsProgress?.filter(
                  (q) => q.status === "completed"
                )?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Quests Completed</p>
            </div>
            <div className="text-center p-4 bg-linear-to-br from-accent/10 to-transparent rounded-2xl border border-accent/20 hover:scale-105 transition-transform">
              <p className="text-3xl font-bold text-accent mb-1">
                {userData?.badges?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Badges Earned</p>
            </div>
            <div className="text-center p-4 bg-linear-to-br from-primary/10 to-transparent rounded-2xl border border-primary/20 hover:scale-105 transition-transform">
              <p className="text-3xl font-bold text-primary mb-1">92%</p>
              <p className="text-xs text-muted-foreground">Success Rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
