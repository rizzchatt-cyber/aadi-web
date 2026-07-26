import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';
import { Sparkles } from 'lucide-react';

export default function AnnouncementBar() {
    const [settings, setSettings] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

    useEffect(() => {
        return onSnapshot(doc(db, 'settings', 'announcement'), (snap) => {
            if (snap.exists()) setSettings(snap.data());
        });
    }, []);

    useEffect(() => {
        if (!settings?.show || !settings?.endDate) return;

        const calculateTime = () => {
            const now = new Date().getTime();
            const distance = new Date(settings.endDate).getTime() - now;

            if (distance < 0) {
                setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
                return;
            }

            setTimeLeft({
                d: Math.floor(distance / (1000 * 60 * 60 * 24)),
                h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                s: Math.floor((distance % (1000 * 60)) / 1000)
            });
        };

        calculateTime();
        const timer = setInterval(calculateTime, 1000);

        return () => clearInterval(timer);
    }, [settings]);

    if (!settings?.show) return null;

    return (
        <div className="gold-gradient text-white py-1.5 md:py-2 text-center relative overflow-hidden group">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6">
                <div className="flex items-center gap-2">
                    <Sparkles size={14} className="animate-pulse text-white" />
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] drop-shadow-sm">
                        {settings.text || 'Exquisite Luxury Coming Soon'}
                    </span>
                    <Sparkles size={14} className="animate-pulse text-white" />
                </div>

                {settings.showTimer && (
                    <div className="flex items-center gap-3 font-serif bg-black/10 px-3 py-0.5 rounded-full backdrop-blur-sm border border-white/10">
                        <div className="flex flex-col items-center">
                            <span className="text-xs md:text-sm font-bold leading-none">{String(timeLeft.d).padStart(2, '0')}</span>
                            <span className="text-[7px] uppercase opacity-60 tracking-tighter">Days</span>
                        </div>
                        <span className="opacity-40 -mt-2">:</span>
                        <div className="flex flex-col items-center">
                            <span className="text-xs md:text-sm font-bold leading-none">{String(timeLeft.h).padStart(2, '0')}</span>
                            <span className="text-[7px] uppercase opacity-60 tracking-tighter">Hrs</span>
                        </div>
                        <span className="opacity-40 -mt-2">:</span>
                        <div className="flex flex-col items-center">
                            <span className="text-xs md:text-sm font-bold leading-none">{String(timeLeft.m).padStart(2, '0')}</span>
                            <span className="text-[7px] uppercase opacity-60 tracking-tighter">Min</span>
                        </div>
                        <span className="opacity-40 -mt-2">:</span>
                        <div className="flex flex-col items-center">
                            <span className="text-xs md:text-sm font-bold leading-none text-white">{String(timeLeft.s).padStart(2, '0')}</span>
                            <span className="text-[7px] uppercase opacity-60 tracking-tighter">Sec</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Animated Shine Effect */}
            <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="w-[40%] h-full bg-linear-to-r from-transparent via-white/20 to-transparent -skew-x-[20deg] absolute -left-[50%] animate-shimmer" />
            </div>
        </div>
    );
}
