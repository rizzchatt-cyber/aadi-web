import { motion } from 'motion/react';

interface SplitTextProps {
    text: string;
    className?: string;
    delay?: number;
    type?: 'chars' | 'words';
    once?: boolean;
}

export default function SplitText({
    text,
    className = "",
    delay = 0,
    type = 'chars',
    once = true
}: SplitTextProps) {
    const words = text.split(" ");

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    const container = {
        hidden: { opacity: isMobile ? 1 : 0 },
        visible: (i = 1) => ({
            opacity: 1,
            transition: {
                staggerChildren: isMobile ? 0.01 : 0.03, // Reduced stagger
                delayChildren: delay * i
            },
        }),
    };

    const child = {
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1] // Faster, non-spring ease
            },
        },
        hidden: {
            opacity: 0,
            y: 10, // Reduced distance
            transition: {
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1]
            },
        },
    };

    // Performance optimization: Don't split chars on mobile, just words
    const effectiveType = isMobile ? 'words' : type;

    if (effectiveType === 'words') {
        return (
            <motion.div
                className={`flex flex-wrap transform-gpu ${className}`}
                variants={container}
                initial="hidden"
                whileInView="visible"
                viewport={{ once }}
            >
                {words.map((word, index) => (
                    <motion.span
                        variants={child}
                        key={index}
                        className="mr-[0.25em] will-change-transform"
                    >
                        {word}
                    </motion.span>
                ))}
            </motion.div>
        );
    }

    return (
        <motion.div
            className={`flex flex-wrap transform-gpu ${className}`}
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once }}
        >
            {words.map((word, index) => (
                <span key={index} className="whitespace-nowrap mr-[0.25em]">
                    {word.split("").map((char, charIndex) => (
                        <motion.span
                            variants={child}
                            key={charIndex}
                            className="inline-block will-change-transform"
                        >
                            {char}
                        </motion.span>
                    ))}
                </span>
            ))}
        </motion.div>
    );
}
