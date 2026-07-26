import { useState, useEffect, useRef } from 'react';
import { Search, SortAsc, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DriveImage from './DriveImage';

interface SearchBarProps {
    onSearch: (query: string) => void;
    onFilterChange: (filters: any) => void;
    onSortChange: (sort: string) => void;
    suggestions: any[];
    categories: any[];
}

export default function SearchBar({ onSearch, onFilterChange, onSortChange, suggestions, categories }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedSort, setSelectedSort] = useState('newest');
    const [priceRange, setPriceRange] = useState(1000000);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchChange = (val: string) => {
        setQuery(val);
        onSearch(val);
        setShowSuggestions(val.length > 0);
    };

    const clearSearch = () => {
        setQuery('');
        onSearch('');
        setShowSuggestions(false);
    };

    return (
        <div ref={containerRef} className="relative w-full max-w-5xl mx-auto z-50">
            {/* Search Bar Container */}
            <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className={`relative flex flex-col md:flex-row items-center gap-4 p-2 transition-all duration-300 transform-gpu ${isFocused ? 'scale-[1.01]' : 'scale-100'
                    }`}
            >
                <div className={`relative flex-grow w-full group transition-all duration-500 rounded-[40px] transform-gpu ${isFocused ? 'shadow-[0_0_25px_rgba(198,167,94,0.2)]' : 'shadow-lg shadow-black/5'
                    }`}>
                    {/* Glassmorphism Background */}
                    <div className="absolute inset-0 bg-[#FFFDF9]/80 backdrop-blur-xl rounded-[40px] border border-gold/10 group-hover:border-gold/30 transition-colors" />

                    <div className="relative flex items-center px-6 py-2">
                        <Search className={`mr-4 transition-colors duration-300 ${isFocused ? 'text-gold' : 'text-charcoal/30'}`} size={20} />
                        <input
                            type="text"
                            placeholder="Search masterpieces by name, category or fragrance note..."
                            value={query}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full py-4 bg-transparent outline-none text-charcoal placeholder:text-charcoal/30 font-medium text-sm md:text-base"
                        />
                        <AnimatePresence>
                            {query && (
                                <motion.button
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    onClick={clearSearch}
                                    className="p-2 hover:bg-gold/10 rounded-full transition-colors"
                                >
                                    <X size={18} className="text-gold" />
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Filter & Sort Buttons */}
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-grow md:flex-initial group">
                        <div className="absolute inset-0 bg-[#FFFDF9]/80 backdrop-blur-xl rounded-[40px] border border-gold/10 group-hover:border-gold/30 transition-colors" />
                        <select
                            value={selectedSort}
                            onChange={(e) => {
                                setSelectedSort(e.target.value);
                                onSortChange(e.target.value);
                            }}
                            className="relative w-full pl-6 pr-10 py-4 bg-transparent outline-none text-[11px] font-black uppercase tracking-widest text-gold cursor-pointer appearance-none min-w-[160px]"
                        >
                            <option value="newest">Newest</option>
                            <option value="price-low">Price: Low</option>
                            <option value="price-high">Price: High</option>
                            <option value="trending">Trending</option>
                        </select>
                        <SortAsc className="absolute right-4 top-1/2 -translate-y-1/2 text-gold/40 pointer-events-none" size={16} />
                    </div>
                </div>
            </motion.div>

            {/* Suggestions Dropdown */}
            <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full left-0 right-0 mt-4 mx-2 bg-white/95 backdrop-blur-2xl rounded-[32px] border border-gold/10 shadow-2xl overflow-hidden shadow-gold/5"
                    >
                        <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                            <p className="text-[10px] uppercase tracking-[0.3em] text-gold/60 font-black mb-4 px-4">Suggestions</p>
                            <div className="grid grid-cols-1 gap-2">
                                {suggestions.slice(0, 5).map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setQuery(item.title);
                                            onSearch(item.title);
                                            setShowSuggestions(false);
                                        }}
                                        className="flex items-center gap-4 p-3 hover:bg-gold/5 rounded-2xl transition-all group text-left"
                                    >
                                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-luxury-cream/30 border border-gold/5 flex-shrink-0">
                                            <DriveImage src={item.images?.[0]} alt={item.title} className="w-full h-full object-contain p-1 object-center" />
                                        </div>
                                        <div className="flex-grow">
                                            <h4 className="text-sm font-bold text-charcoal group-hover:text-gold transition-colors">{item.title}</h4>
                                            <p className="text-[10px] text-charcoal/40 uppercase tracking-widest">
                                                {categories.find(c => c.id === item.category_id)?.name || 'Collection'}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            {item.priceOnRequest ? null : (
                                                <p className="text-sm font-black text-charcoal">₹{(item.price || 0).toLocaleString()}</p>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
