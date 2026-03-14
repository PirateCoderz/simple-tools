"use client";

// Login not required for using tools; sign-in remains optional via Topbar.
import Topbar from "@/components/Topbar";
import Hero from "@/components/Hero";

export default function Home() {
  return (
    <div className="min-h-screen bg-[url('/background.jpg')] h-screen bg-cover bg-no-repeat">
      <Topbar />
      <Hero />
    </div>
  );
}
