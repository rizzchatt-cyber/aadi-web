import { motion } from 'motion/react';
import { ReactNode } from 'react';

interface RevealProps {
    children: ReactNode;
    width?: "fit-content" | "100%";
    delay?: number;
    direction?: "up" | "down" | "left" | "right";
    distance?: number;
    duration?: number;
    className?: string;
    once?: boolean;
}

export default function Reveal({
    children,
    width = "fit-content",
    delay = 0,
    direction = "up",
    distance = 50,
    duration = 0.8,
    className = "",
    once = true
}: RevealProps) {

    const getInitial = () => {
        if (typeof window !== 'undefined' && window.innerWidth < 768) return { x: 0, y: 0, opacity: 1 };
        switch (direction) {
            case "up": return { y: distance, opacity: 0 };
            case "down": return { y: -distance, opacity: 0 };
            case "left": return { x: distance, opacity: 0 };
            case "right": return { x: -distance, opacity: 0 };
            default: return { y: distance, opacity: 0 };
        }
    };

    return (
        <div className={`relative ${className}`} style={{ width, overflow: "hidden" }}>
            <motion.div
                initial={getInitial()}
                whileInView={{ x: 0, y: 0, opacity: 1 }}
                transition={{
                    duration,
                    delay,
                    ease: [0.16, 1, 0.3, 1]
                }}
                viewport={{ once }}
            >
                {children}
            </motion.div>
        </div>
    );
}
