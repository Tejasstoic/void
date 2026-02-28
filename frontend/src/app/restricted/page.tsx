import RestrictedGate from "@/components/shared/restricted-gate";
import FeedList from "@/components/feed/feed-list";

export default function RestrictedPage() {
    return (
        <div className="min-h-screen bg-background p-6">
            <div className="mx-auto max-w-2xl flex flex-col gap-8 pt-12">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">The Restricted Void</h1>
                    <p className="text-void-muted">Unfiltered community content. Access with caution.</p>
                </div>

                <RestrictedGate>
                    <FeedList />
                </RestrictedGate>
            </div>
        </div>
    );
}
