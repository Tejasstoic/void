import PostForm from "@/components/feed/post-form";
import FeedList from "@/components/feed/feed-list";
import { Shield, Settings, Bell, Search } from "lucide-react";

export default function FeedPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Navigation (Sticky) */}
            <nav className="sticky top-0 z-50 glass border-b-0">
                <div className="mx-auto max-w-2xl flex h-16 items-center justify-between px-6">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-void-accent flex items-center justify-center">
                            <span className="font-black text-void-black text-xs">V</span>
                        </div>
                        <h1 className="font-bold tracking-tighter text-xl">VOID</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-2 text-void-muted hover:text-void-accent transition-colors"><Search className="h-5 w-5" /></button>
                        <button className="p-2 text-void-muted hover:text-void-accent transition-colors"><Bell className="h-5 w-5" /></button>
                        <button className="p-2 text-void-muted hover:text-void-accent transition-colors"><Settings className="h-5 w-5" /></button>
                    </div>
                </div>
            </nav>

            <main className="mx-auto max-w-2xl px-6 py-8">
                <PostForm />
                <FeedList />
            </main>

            {/* Floating Action for Admin (Mock) */}
            <div className="fixed bottom-8 right-8">
                <button className="h-14 w-14 rounded-full bg-void-purple text-white shadow-2xl shadow-void-purple/20 flex items-center justify-center hover:scale-110 active:scale-90 transition-all border border-white/20">
                    <Shield className="h-6 w-6" />
                </button>
            </div>
        </div>
    );
}
