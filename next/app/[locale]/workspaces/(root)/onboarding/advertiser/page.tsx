"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiCall } from '@/lib/utils/Http.FetchApiSPA.util';
import { PiMegaphoneBold, PiArrowLeft, PiArrowRight, PiCheckCircle } from "react-icons/pi";
import { toast } from "react-toastify";
import { BlockPrimitive, BlockHeader, BlockTitle, BlockDescription, BlockContent, BlockFooter } from "@/app/primitives/Block.primitive";
import { ButtonPrimitive } from "@/app/primitives/Button.primitive";

export default function AdvertiserOnboardingPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: "",
        contactEmail: "",
        contactPhone: "",
        website: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (!formData.title) {
            toast.warn("Please fill in the required fields");
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await apiCall({
                url: "/api/workspaces/onboarding",
                method: "POST",
                body: {
                    type: "advertiser",
                    data: {
                        title: formData.title,
                        orgDetails: formData
                    }
                }
            } as any);

            const result = (response as any).data;
            if (result.success) {
                setSubmitted(true);
            } else {
                toast.error(result.error || "Application failed");
            }
        } catch {
            toast.error("Failed to submit application");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-[80vh] p-6 flex flex-col items-center justify-center">
                <div className="max-w-lg w-full">
                    <BlockPrimitive variant="default">
                        <BlockContent>
                            <div className="text-center py-6">
                                <div className="w-20 h-20 bg-app-bright-cyan/15 text-app-bright-cyan rounded-full flex items-center justify-center text-4xl mx-auto mb-8">
                                    <PiCheckCircle />
                                </div>
                                <h1 className="text-3xl font-bold text-app-dark-purple dark:text-white mb-3 tracking-tight">Application Submitted!</h1>
                                <p className="text-app-dark-purple/50 dark:text-white/50 font-medium leading-relaxed mb-8">
                                    Your advertiser application is under review. We&apos;ll notify you once it&apos;s approved.
                                </p>
                                <ButtonPrimitive variant="default" onClick={() => router.push("/workspaces")}>
                                    Go to Workspaces
                                </ButtonPrimitive>
                            </div>
                        </BlockContent>
                    </BlockPrimitive>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] p-6 flex flex-col items-center justify-center">
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-app-bright-cyan/8 dark:bg-app-bright-cyan/15 rounded-full blur-[128px]" />
            </div>

            <div className="relative max-w-2xl w-full z-10">
                <BlockPrimitive variant="default">
                    <BlockContent>
                        {/* Back button */}
                        <ButtonPrimitive variant="ghost" onClick={() => router.push("/workspaces/onboarding/welcome")}>
                            <PiArrowLeft className="mr-2" /> Back
                        </ButtonPrimitive>
                    </BlockContent>

                    <BlockHeader>
                        <div className="w-12 h-12 bg-app-bright-cyan/15 text-app-bright-cyan rounded-xl flex items-center justify-center text-xl mb-2">
                            <PiMegaphoneBold />
                        </div>
                        <BlockTitle>
                            Register as an <span className="text-app-bright-cyan">Advertiser</span>
                        </BlockTitle>
                        <BlockDescription>
                            Tell us about your brand. Start promoting and reaching your audience.
                        </BlockDescription>
                    </BlockHeader>

                    <BlockContent>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-app-dark-purple/40 dark:text-white/40 ml-1">Company / Brand Name *</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className="w-full h-14 px-5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-app text-app-dark-purple dark:text-white font-medium placeholder-app-dark-purple/25 dark:placeholder-white/25 outline-none focus:border-app-bright-cyan/50 transition-colors"
                                    placeholder="Your company or brand name"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-app-dark-purple/40 dark:text-white/40 ml-1">Contact Email</label>
                                    <input
                                        type="email"
                                        name="contactEmail"
                                        value={formData.contactEmail}
                                        onChange={handleInputChange}
                                        className="w-full h-14 px-5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-app text-app-dark-purple dark:text-white font-medium placeholder-app-dark-purple/25 dark:placeholder-white/25 outline-none focus:border-app-bright-cyan/50 transition-colors"
                                        placeholder="email@company.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-app-dark-purple/40 dark:text-white/40 ml-1">Contact Phone</label>
                                    <input
                                        type="text"
                                        name="contactPhone"
                                        value={formData.contactPhone}
                                        onChange={handleInputChange}
                                        className="w-full h-14 px-5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-app text-app-dark-purple dark:text-white font-medium placeholder-app-dark-purple/25 dark:placeholder-white/25 outline-none focus:border-app-bright-cyan/50 transition-colors"
                                        placeholder="+994 XX XXX XX XX"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-app-dark-purple/40 dark:text-white/40 ml-1">Website</label>
                                <input
                                    type="url"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleInputChange}
                                    className="w-full h-14 px-5 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-app text-app-dark-purple dark:text-white font-medium placeholder-app-dark-purple/25 dark:placeholder-white/25 outline-none focus:border-app-bright-cyan/50 transition-colors"
                                    placeholder="https://yourcompany.com"
                                />
                            </div>
                        </div>
                    </BlockContent>

                    <BlockFooter>
                        <ButtonPrimitive variant="default" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? "Submitting..." : "Submit for Approval"} <PiArrowRight className="ml-2" />
                        </ButtonPrimitive>
                    </BlockFooter>
                </BlockPrimitive>
            </div>
        </div>
    );
}
