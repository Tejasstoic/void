"use client";

import { motion } from "framer-motion";
import { Shield, Users, Lock, ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      {/* Background Decorative elements */}
      <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-void-purple/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-void-accent/10 blur-[120px]" />

      <main className="relative z-10 flex flex-col items-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-void-accent/20 bg-void-accent/5 px-4 py-1.5 text-xs font-medium tracking-wider text-void-accent uppercase"
        >
          <Shield className="h-3 w-3" />
          Governance-First Social Platform
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className="text-7xl font-bold tracking-tighter sm:text-9xl"
        >
          VOID<span className="text-void-accent">.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-6 max-w-xl text-lg text-void-muted sm:text-xl"
        >
          Experience the next evolution of anonymous social media. Empowered by AI moderation and community governance.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-10 flex flex-col gap-4 sm:flex-row"
        >
          <button className="group relative flex h-14 items-center justify-center gap-2 overflow-hidden rounded-full bg-void-accent px-8 font-bold text-void-black transition-all hover:scale-105 active:scale-95">
            Enter the Void
            <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
          <button className="flex h-14 items-center justify-center rounded-full border border-white/10 bg-white/5 px-8 font-bold transition-all hover:bg-white/10 glass">
            Learn More
          </button>
        </motion.div>

        <div className="mt-24 grid w-full max-w-5xl gap-6 sm:grid-cols-3 px-4">
          <FeatureCard
            icon={<Lock className="h-6 w-6 text-void-accent" />}
            title="Privacy First"
            description="True anonymity protected by advanced encryption and zero-tracking policy."
            delay={1.1}
          />
          <FeatureCard
            icon={<Shield className="h-6 w-6 text-void-purple" />}
            title="AI Moderation"
            description="Real-time content scoring ensures a safe environment without manual bias."
            delay={1.3}
          />
          <FeatureCard
            icon={<Users className="h-6 w-6 text-white" />}
            title="Governance"
            description="Community-driven rules and transparent strike systems for active accountability."
            delay={1.5}
          />
        </div>
      </main>

      <footer className="absolute bottom-8 text-xs text-white/20 tracking-widest uppercase">
        © 2026 VOID PLATFORM // ALL RIGHTS RESERVED
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay }}
      className="flex flex-col items-start p-8 text-left glass rounded-2xl hover:border-white/10 transition-colors cursor-default group"
    >
      <div className="mb-4 rounded-xl bg-white/5 p-3 group-hover:bg-void-accent/10 transition-colors">
        {icon}
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm text-void-muted leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
