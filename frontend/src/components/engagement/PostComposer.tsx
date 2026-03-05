"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import {
    Zap,
    BookOpen,
    BarChart3,
    Send,
    Plus,
    Minus,
    X,
    Clock,
    Ghost,
    MapPin,
    Fingerprint,
} from "lucide-react";
import api from "@/lib/api";

const CONTENT_TYPES = [
    {
        type: "TEXT_BURST",
        label: "Short Burst",
        icon: <Zap className="h-4 w-4" />,
        description: "Quick thought, max impact",
        maxLength: 280,
        color: "text-void-accent",
    },
    {
        type: "CONFESSION",
        label: "Confession",
        icon: <BookOpen className="h-4 w-4" />,
        description: "Pour your heart out anonymously",
        maxLength: 5000,
        color: "text-void-purple",
    },
    {
        type: "POLL",
        label: "Poll",
        icon: <BarChart3 className="h-4 w-4" />,
        description: "Ask the void a question",
        maxLength: 300,
        color: "text-yellow-400",
    },
];

interface PostComposerProps {
    onPostCreated?: () => void;
}

export default function PostComposer({ onPostCreated }: PostComposerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [contentType, setContentType] = useState("TEXT_BURST");
    const [content, setContent] = useState("");
    const [pollQuestion, setPollQuestion] = useState("");
    const [pollOptions, setPollOptions] = useState(["", ""]);
    const [isEphemeral, setIsEphemeral] = useState(false);
    const [expireHours, setExpireHours] = useState(24);
    const [isLocalOnly, setIsLocalOnly] = useState(false);
    const [radius, setRadius] = useState(10);
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [isZkVerified, setIsZkVerified] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const activeType = CONTENT_TYPES.find((t) => t.type === contentType)!;

    const addPollOption = () => {
        if (pollOptions.length < 6) {
            setPollOptions([...pollOptions, ""]);
        }
    };

    const removePollOption = (index: number) => {
        if (pollOptions.length > 2) {
            setPollOptions(pollOptions.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = useCallback(async () => {
        if (!content.trim() && contentType !== "POLL") return;
        if (contentType === "POLL" && (!pollQuestion.trim() || pollOptions.filter((o) => o.trim()).length < 2)) return;

        setIsSubmitting(true);

        try {
            const payload: Record<string, unknown> = {
                content: contentType === "POLL" ? pollQuestion : content,
                content_type: contentType,
            };

            if (contentType === "POLL") {
                payload.poll_question = pollQuestion;
                payload.poll_options = pollOptions.filter((o) => o.trim());
            }

            if (isEphemeral) {
                payload.is_ephemeral = true;
                const expiresAt = new Date();
                expiresAt.setHours(expiresAt.getHours() + expireHours);
                payload.expires_at = expiresAt.toISOString();
            }

            if (isLocalOnly && location) {
                payload.geo_latitude = location.lat;
                payload.geo_longitude = location.lng;
                payload.geo_privacy_radius = radius;
            }

            if (isZkVerified) {
                payload.is_zk_verified = true;
            }

            await api.post("/content/posts/", payload);

            // Reset
            setContent("");
            setPollQuestion("");
            setPollOptions(["", ""]);
            setIsOpen(false);
            onPostCreated?.();
        } catch {
            // Error handling
        } finally {
            setIsSubmitting(false);
        }
    }, [content, contentType, pollQuestion, pollOptions, isEphemeral, expireHours, isLocalOnly, location, radius, isZkVerified, onPostCreated]);

    return (
        <>
            {/* Compact trigger */}
            {!isOpen && (
                <motion.button
                    onClick={() => setIsOpen(true)}
                    className="w-full flex items-center gap-3 px-5 py-4 glass rounded-2xl text-left hover:border-void-accent/20 transition-all group"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                >
                    <div className="h-8 w-8 rounded-full bg-void-accent/10 border border-void-accent/20 flex items-center justify-center">
                        <Plus className="h-4 w-4 text-void-accent" />
                    </div>
                    <span className="text-void-muted text-sm group-hover:text-white/60 transition-colors">
                        What&apos;s on your mind, anonymous?
                    </span>
                </motion.button>
            )}

            {/* Full composer */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="glass-premium rounded-2xl p-5 space-y-4">
                            {/* Content type selector */}
                            <div className="flex gap-2">
                                {CONTENT_TYPES.map((type) => (
                                    <button
                                        key={type.type}
                                        onClick={() => setContentType(type.type)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${contentType === type.type
                                            ? `${type.color} bg-white/10 border border-white/10`
                                            : "text-void-muted hover:text-white/60 border border-transparent"
                                            }`}
                                    >
                                        {type.icon}
                                        {type.label}
                                    </button>
                                ))}

                                <div className="flex-1" />
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-void-muted hover:text-white transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Type description */}
                            <p className="text-[11px] text-void-muted">{activeType.description}</p>

                            {/* Content input */}
                            {contentType !== "POLL" ? (
                                <div className="relative">
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value.slice(0, activeType.maxLength))}
                                        placeholder={
                                            contentType === "CONFESSION"
                                                ? "Let it all out..."
                                                : "Drop your thought into the void..."
                                        }
                                        className={`w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-void-muted/50 focus:outline-none focus:border-void-accent/30 resize-none transition-colors ${contentType === "CONFESSION" ? "min-h-[160px]" : "min-h-[80px]"
                                            }`}
                                    />
                                    <span className="absolute bottom-3 right-3 text-[10px] text-void-muted tabular-nums">
                                        {content.length}/{activeType.maxLength}
                                    </span>
                                </div>
                            ) : (
                                /* Poll input */
                                <div className="space-y-3">
                                    <input
                                        value={pollQuestion}
                                        onChange={(e) => setPollQuestion(e.target.value.slice(0, 300))}
                                        placeholder="Ask a question..."
                                        className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-void-muted/50 focus:outline-none focus:border-void-accent/30 transition-colors"
                                    />

                                    <div className="space-y-2">
                                        {pollOptions.map((option, i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <div className="h-3 w-3 rounded-full border border-white/20 flex-shrink-0" />
                                                <input
                                                    value={option}
                                                    onChange={(e) => {
                                                        const next = [...pollOptions];
                                                        next[i] = e.target.value.slice(0, 100);
                                                        setPollOptions(next);
                                                    }}
                                                    placeholder={`Option ${i + 1}`}
                                                    className="flex-1 bg-transparent border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder:text-void-muted/30 focus:outline-none focus:border-white/10 transition-colors"
                                                />
                                                {pollOptions.length > 2 && (
                                                    <button
                                                        onClick={() => removePollOption(i)}
                                                        className="text-void-muted hover:text-void-error transition-colors"
                                                    >
                                                        <Minus className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}

                                        {pollOptions.length < 6 && (
                                            <button
                                                onClick={addPollOption}
                                                className="flex items-center gap-1.5 text-[11px] text-void-accent hover:text-void-accent/80 transition-colors pl-5"
                                            >
                                                <Plus className="h-3 w-3" />
                                                Add option
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Privacy Options */}
                            <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsEphemeral(!isEphemeral)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${isEphemeral ? 'bg-void-purple text-white' : 'bg-white/5 text-void-muted'}`}
                                    >
                                        <Ghost className="h-3 w-3" />
                                        Self-Destruct
                                    </button>
                                </div>
                                {isEphemeral && (
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-void-muted">
                                        <Clock className="h-3 w-3" />
                                        <span>Vanishes in:</span>
                                        <select
                                            value={expireHours}
                                            onChange={(e) => setExpireHours(Number(e.target.value))}
                                            className="bg-transparent border-none outline-none text-void-accent cursor-pointer"
                                        >
                                            <option value={1} className="bg-void-black">1 Hour</option>
                                            <option value={6} className="bg-void-black">6 Hours</option>
                                            <option value={12} className="bg-void-black">12 Hours</option>
                                            <option value={24} className="bg-void-black">24 Hours</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            if (!isLocalOnly) {
                                                // Simulated geolocation
                                                setLocation({ lat: 40.7128, lng: -74.0060 }); // NY Default
                                                setIsLocalOnly(true);
                                            } else {
                                                setIsLocalOnly(false);
                                                setLocation(null);
                                            }
                                        }}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${isLocalOnly ? 'bg-void-accent text-void-black' : 'bg-white/5 text-void-muted'}`}
                                    >
                                        <MapPin className="h-3 w-3" />
                                        Local Pulse
                                    </button>
                                </div>
                                {isLocalOnly && (
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-void-muted">
                                        <span>Radius:</span>
                                        <select
                                            value={radius}
                                            onChange={(e) => setRadius(Number(e.target.value))}
                                            className="bg-transparent border-none outline-none text-void-accent cursor-pointer"
                                        >
                                            <option value={1} className="bg-void-black">1 km</option>
                                            <option value={5} className="bg-void-black">5 km</option>
                                            <option value={10} className="bg-void-black">10 km</option>
                                            <option value={50} className="bg-void-black">50 km</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsZkVerified(!isZkVerified)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${isZkVerified ? 'bg-void-accent text-void-black' : 'bg-white/5 text-void-muted'}`}
                                        title="Simulated ZK-Proof: Prove you are a valid user without revealing your ID"
                                    >
                                        <Fingerprint className="h-3 w-3" />
                                        ZK Verified Anonymity
                                    </button>
                                </div>
                                {isZkVerified && (
                                    <p className="text-[9px] text-void-accent/60 font-medium">
                                        Author ID masked via simulated ZK-proof
                                    </p>
                                )}
                            </div>

                            {/* Submit */}
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] text-void-muted">
                                    Privacy: {isEphemeral ? 'Ephemeral' : 'Persistent'}
                                </p>
                                <motion.button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-void-accent text-void-black text-xs font-bold uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
                                    whileTap={{ scale: 0.97 }}
                                >
                                    <Send className="h-3.5 w-3.5" />
                                    {isSubmitting ? "Posting..." : "Cast into Void"}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
