import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State;

    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[100dvh] flex items-center justify-center bg-luxury-cream/10 p-6 text-center">
                    <div className="max-w-md w-full bg-white p-12 rounded-[40px] shadow-luxury border-luxury">
                        <h1 className="text-4xl font-serif text-charcoal mb-6">Experience Refreshing</h1>
                        <p className="text-charcoal/50 mb-10 font-light italic">We are perfecting few things. Please reload to continue.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-4 gold-gradient text-white font-bold rounded-2xl shadow-lg hover:scale-105 transition-transform"
                        >
                            Refresh Aura
                        </button>
                    </div>
                </div>
            );
        }

        return (this as any).props.children;
    }
}

export default ErrorBoundary;
