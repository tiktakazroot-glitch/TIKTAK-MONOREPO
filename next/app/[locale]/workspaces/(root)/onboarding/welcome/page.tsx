"use client";

import { useRouter } from "next/navigation";
import { PiStorefront, PiMegaphoneBold, PiArrowRight } from "react-icons/pi";
import { BlockPrimitive, BlockContent } from "@/app/primitives/Block.primitive";

export default function OnboardingWelcomePage() {
    const router = useRouter();

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6">
            {/* Background glow effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-app-bright-purple/10 dark:bg-app-bright-purple/20 rounded-full blur-[128px]" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-app-bright-cyan/8 dark:bg-app-bright-cyan/15 rounded-full blur-[128px]" />
            </div>

            <div className="relative max-w-3xl w-full space-y-12 text-center z-10">
                {/* Header */}
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-app-dark-purple dark:text-white tracking-tight">
                        Choose Your{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-app-bright-purple to-app-bright-cyan">
                            Journey
                        </span>
                    </h1>
                    <p className="text-lg text-app-dark-purple/50 dark:text-white/60 max-w-xl mx-auto font-medium">
                        Select how you want to use TikTak. You can always change this later.
                    </p>
                </div>

                {/* Two Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Store / Provider Path */}
                    <button
                        onClick={() => router.push("/workspaces/onboarding/provider")}
                        className="text-left group hover:-translate-y-1 transition-all duration-500"
                    >
                        <BlockPrimitive variant="default">
                            <BlockContent>
                                <div className="w-14 h-14 bg-app-bright-purple/15 text-app-bright-purple rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                                    <PiStorefront />
                                </div>
                                <h3 className="text-xl font-bold text-app-dark-purple dark:text-white mb-2 group-hover:text-app-bright-purple transition-colors">
                                    I&apos;m a Store
                                </h3>
                                <p className="text-app-dark-purple/50 dark:text-white/50 text-sm font-medium mb-6 leading-relaxed">
                                    Register your store, add products, and reach customers across Azerbaijan.
                                </p>
                                <div className="flex items-center gap-2 text-app-bright-purple font-bold uppercase tracking-widest text-xs">
                                    Open a Store <PiArrowRight className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </BlockContent>
                        </BlockPrimitive>
                    </button>

                    {/* Advertiser Path */}
                    <button
                        onClick={() => router.push("/workspaces/onboarding/advertiser")}
                        className="text-left group hover:-translate-y-1 transition-all duration-500"
                    >
                        <BlockPrimitive variant="default">
                            <BlockContent>
                                <div className="w-14 h-14 bg-app-bright-cyan/15 text-app-bright-cyan rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform">
                                    <PiMegaphoneBold />
                                </div>
                                <h3 className="text-xl font-bold text-app-dark-purple dark:text-white mb-2 group-hover:text-app-bright-cyan transition-colors">
                                    I&apos;m an Advertiser
                                </h3>
                                <p className="text-app-dark-purple/50 dark:text-white/50 text-sm font-medium mb-6 leading-relaxed">
                                    Promote your brand, run campaigns, and connect with your audience.
                                </p>
                                <div className="flex items-center gap-2 text-app-bright-cyan font-bold uppercase tracking-widest text-xs">
                                    Start Advertising <PiArrowRight className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </BlockContent>
                        </BlockPrimitive>
                    </button>
                </div>

                {/* Footer note */}
                <div className="pt-4 text-center">
                    <p className="text-xs font-semibold text-app-dark-purple/25 dark:text-white/30 uppercase tracking-[0.2em]">
                        Staff & moderator access is managed separately
                    </p>
                </div>
            </div>
        </div>
    );
}
