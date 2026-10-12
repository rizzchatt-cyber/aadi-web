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
                    <div className="max-w-md w-full bg-white p-8 md:p-12 rounded-[40px] shadow-luxury border-luxury">
                        <h1 className="text-3xl font-serif text-charcoal mb-4">Experience Refreshing</h1>
                        <p className="text-charcoal/60 mb-6 font-light text-sm italic">
                            A momentary hiccup occurred. Click below to continue seamlessly.
                        </p>
                        {this.state.error && (
                            <div className="text-left bg-red-50 text-red-600 p-3 rounded-xl text-xs font-mono mb-6 overflow-auto max-h-32 border border-red-200">
                                {this.state.error.message}
                            </div>
                        )}
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-3.5 gold-gradient text-white font-bold rounded-2xl shadow-lg hover:scale-[1.02] transition-transform cursor-pointer text-sm uppercase tracking-wider"
                            >
                                Refresh Page
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 text-charcoal font-bold rounded-2xl transition-colors cursor-pointer text-xs uppercase tracking-wider"
                            >
                                Return to Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (this as any).props.children;
    }
}

const SafeErrorBoundary: React.ComponentType<Props> = ErrorBoundary as any;
export default SafeErrorBoundary;
