import AnalyticsClient from "./AnalyticsClient";

export const metadata = {
  title: "Analytics | AI Calling Agent",
  description: "View restaurant call metrics and analytics.",
};

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-orange-500/30">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>
      
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
            Restaurant Analytics
          </h1>
          <p className="text-neutral-400 text-lg max-w-2xl">
            Monitor call performance, track accepted and rejected orders across all your restaurants.
          </p>
        </div>

        <AnalyticsClient />
      </main>
    </div>
  );
}
