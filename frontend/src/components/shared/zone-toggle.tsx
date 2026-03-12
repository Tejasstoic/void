"use client";

import { useState } from "react";
import { Shield, ShieldAlert, AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/use-auth-store";

interface ZoneToggleProps {
  isRestricted: boolean;
  onToggle: (restricted: boolean) => void;
}

export default function ZoneToggle({ isRestricted, onToggle }: ZoneToggleProps) {
  const { user } = useAuthStore();
  const [showWarning, setShowWarning] = useState(false);

  const handleToggle = () => {
    if (!isRestricted) {
      // Switching TO restricted
      if (!user?.is_18_plus) {
        setShowWarning(true);
        return;
      }
      setShowWarning(true);
    } else {
      onToggle(false);
    }
  };

  const confirmEnter = () => {
    setShowWarning(false);
    onToggle(true);
  };

  return (
    <>
      <button
        onClick={handleToggle}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 ${
          isRestricted
            ? "bg-void-error/20 border border-void-error/40 text-void-error shadow-[0_0_20px_rgba(255,0,60,0.15)]"
            : "bg-green-400/10 border border-green-400/30 text-green-400"
        }`}
      >
        {isRestricted ? (
          <>
            <ShieldAlert size={14} />
            WILD ZONE
          </>
        ) : (
          <>
            <Shield size={14} />
            SAFE ZONE
          </>
        )}
      </button>

      {/* Age Verification / Warning Modal */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md p-8 glass-premium rounded-3xl text-center"
            >
              <button
                onClick={() => setShowWarning(false)}
                className="absolute top-4 right-4 p-2 text-void-muted hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="h-16 w-16 mx-auto mb-6 rounded-full bg-void-error/10 border border-void-error/30 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-void-error" />
              </div>

              {!user?.is_18_plus ? (
                <>
                  <h3 className="text-xl font-black uppercase tracking-tight mb-3">Age Restricted</h3>
                  <p className="text-sm text-void-muted mb-6">
                    The Wild Zone contains mature content. You must be 18 or older to access this section.
                    Your account indicates you do not meet the age requirement.
                  </p>
                  <button
                    onClick={() => setShowWarning(false)}
                    className="px-8 py-3 bg-white/10 rounded-xl text-sm font-bold hover:bg-white/20 transition-all"
                  >
                    Go Back
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-black uppercase tracking-tight mb-3">Content Warning</h3>
                  <p className="text-sm text-void-muted mb-6">
                    The Wild Zone contains mature and potentially disturbing content.
                    Proceed only if you&apos;re comfortable with this type of content.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setShowWarning(false)}
                      className="px-6 py-3 bg-white/10 rounded-xl text-sm font-bold hover:bg-white/20 transition-all"
                    >
                      Go Back
                    </button>
                    <button
                      onClick={confirmEnter}
                      className="px-6 py-3 bg-void-error/20 border border-void-error/30 rounded-xl text-sm font-bold text-void-error hover:bg-void-error/30 transition-all"
                    >
                      Enter Wild Zone
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
