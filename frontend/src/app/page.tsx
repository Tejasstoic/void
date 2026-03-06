
"use client";


import Link from "next/link";
import { Shield, Lock, Users, ChevronRight, Activity, Zap, Eye, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/use-auth-store";
import Image from "next/image";

export default function Home() {
  const { user } = useAuthStore();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 glass sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 relative overflow-hidden rounded-xl border border-white/10 shadow-lg">
            <Image
              src="/branding/logo_exclusive.png"
              alt="VOID"
              fill
              className="object-cover scale-110"
            />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Void</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-[10px] uppercase tracking-[0.3em] font-bold text-void-muted">
          <Link href="#features" className="hover:text-void-accent transition-colors">Infrastructure</Link>
          <Link href="#security" className="hover:text-void-accent transition-colors">Encryption</Link>
          <Link href="#governance" className="hover:text-void-accent transition-colors">Governance</Link>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <Link
              href="/feed"
              className="px-6 py-2.5 bg-void-accent text-void-black text-xs font-bold uppercase tracking-widest rounded-full hover:scale-105 transition-all"
            >
              Enter Void
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-xs font-bold uppercase tracking-widest hover:text-void-accent transition-colors">Login</Link>
              <Link
                href="/register"
                className="px-6 py-2.5 bg-void-accent text-void-black text-xs font-bold uppercase tracking-widest rounded-full hover:scale-105 transition-all"
              >
                Join
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-8 pt-32 pb-40 overflow-hidden">
        <div className="absolute top-[10%] left-[10%] h-[500px] w-[500px] rounded-full bg-void-accent/10 blur-[120px] -z-10" />
        <div className="absolute bottom-[20%] right-[10%] h-[400px] w-[400px] rounded-full bg-void-purple/10 blur-[120px] -z-10" />

        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full mb-8"
          >
            <Zap className="h-4 w-4 text-void-accent" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-void-muted">v0.1.0 Protocol Active</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black tracking-tighter uppercase mb-8 leading-[0.9]"
          >
            The Future is <span className="text-transparent bg-clip-text bg-gradient-to-r from-void-accent to-void-purple">Anonymous</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-void-muted mb-12 max-w-2xl mx-auto font-medium"
          >
            Speak freely. Judge fairly. Govern together. Experience the world's first AI-moderated anonymous social protocol.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col md:flex-row items-center justify-center gap-6"
          >
            <Link
              href={user ? "/feed" : "/register"}
              className="group h-14 px-10 bg-void-accent text-void-black font-bold uppercase tracking-widest rounded-2xl flex items-center gap-3 hover:scale-105 transition-all"
            >
              {user ? 'Go to Feed' : 'Establish Identity'}
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="#governance"
              className="h-14 px-10 bg-white/5 border border-white/10 font-bold uppercase tracking-widest rounded-2xl flex items-center hover:bg-white/10 transition-all"
            >
              Read Whitepaper
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Grid Stats */}
      <section className="px-8 py-20 border-y border-white/5 bg-void-surface/30">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          {[
            { label: "Active Nodes", value: "1.2k+", icon: Globe },
            { label: "Daily Pulses", value: "48.5k", icon: Activity },
            { label: "Neutrality Score", value: "99.9%", icon: Shield },
            { label: "Response Time", value: "<1ms", icon: Zap },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-void-accent font-bold">
                <stat.icon className="h-4 w-4" />
                <span className="text-2xl tracking-tighter">{stat.value}</span>
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-void-muted">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="px-8 py-32">
        <div className="max-w-6xl mx-auto">
          <div className="mb-20 text-center">
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Core Infrastructure</h2>
            <p className="text-void-muted max-w-xl mx-auto">Decentralized protocols meeting next-gen AI filters.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="AI Sentinel"
              description="Real-time toxicity analysis ensures the void remains a space for ideas, not hate."
            />
            <FeatureCard
              icon={<Lock className="h-6 w-6" />}
              title="Identity Blackout"
              description="Zero-knowledge proofs secure your voice without compromising your safety."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Democratic Core"
              description="Community voting on bans and strikes puts the power in your hands."
            />
          </div>
        </div>
      </section>

      {/* Visual Footer */}
      <footer className="mt-auto px-8 py-12 border-t border-white/5 text-center">
        <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-void-muted">
          Designated Endpoint for the Anonymous Social Protocol © 2026
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 glass rounded-3xl border-transparent hover:border-void-accent/20 transition-all hover:translate-y-[-4px]">
      <div className="p-3 bg-void-accent/10 border border-void-accent/20 rounded-2xl w-fit mb-6 text-void-accent">
        {icon}
      </div>
      <h3 className="text-xl font-bold uppercase tracking-tight mb-3">{title}</h3>
      <p className="text-void-muted leading-relaxed text-sm">
        {description}
      </p>
    </div>
  );
}
