"use client";

import AuroraBackground from "@/components/AuroraBackground";
import JoinScreen from "@/components/JoinScreen";

export default function HomePage() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#030508]">
      <AuroraBackground />
      <div className="relative z-10 h-full w-full">
        <JoinScreen />
      </div>
    </div>
  );
}
