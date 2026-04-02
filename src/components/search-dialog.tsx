'use client';

import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from './ui/button';
import { Search, Command, ArrowRight } from 'lucide-react';
import { useSearch } from '@/hooks/use-search';
import Link from 'next/link';
import { getAllSearchResults, SearchResult } from '@/lib/search-data';
import { cn } from '@/lib/utils';

export function SearchDialog() {
    const { isOpen, onOpen, onClose } = useSearch();
    const [query, setQuery] = useState('');
    const [allSearchResults, setAllSearchResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        if (isOpen) {
            const fetchResults = async () => {
                setIsLoading(true);
                try {
                    const results = await getAllSearchResults();
                    setAllSearchResults(results);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchResults();
        }
    }, [isOpen]);

    const filteredResults = useMemo(() => {
        const lowercasedQuery = query.toLowerCase().trim();
        if (lowercasedQuery === '') return allSearchResults.slice(0, 8);
        
        return allSearchResults
            .filter(result => result.title.toLowerCase().includes(lowercasedQuery))
            .sort((a, b) => {
                const aStarts = a.title.toLowerCase().startsWith(lowercasedQuery);
                const bStarts = b.title.toLowerCase().startsWith(lowercasedQuery);
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;
                return 0;
            })
            .slice(0, 10);
    }, [query, allSearchResults]);

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                isOpen ? onClose() : onOpen();
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [onOpen, onClose, isOpen]);
    
    const handleSelect = useCallback(() => {
        onClose();
        setQuery('');
    }, [onClose]);

  return (
    <>
        <Button
            onClick={onOpen}
            variant="outline"
            className="h-10 w-full justify-start text-sm text-muted-foreground bg-muted/30 border-muted-foreground/20 sm:pr-12 md:w-40 lg:w-64 rounded-xl hover:bg-muted/50 group"
        >
            <Search className="h-4 w-4 mr-2 group-hover:text-primary transition-colors" />
            <span className="hidden lg:inline-flex">Rechercher...</span>
            <span className="inline-flex lg:hidden">Rechercher</span>
            <kbd className="pointer-events-none absolute right-2 top-2.5 hidden h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
            </kbd>
        </Button>
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="p-0 overflow-hidden sm:max-w-xl border-none shadow-2xl animate-in zoom-in-95 duration-200">
                <DialogTitle className="sr-only">Recherche NeoStud</DialogTitle>
                <div className="flex items-center border-b px-4 h-14 bg-background">
                    <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <Input 
                        placeholder="Rechercher des cours, documents, outils..." 
                        className="border-0 focus-visible:ring-0 text-base h-full bg-transparent" 
                        value={query}
                        autoFocus
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    {query && (
                        <Button variant="ghost" size="sm" onClick={() => setQuery('')} className="h-7 px-2 text-xs">Effacer</Button>
                    )}
                </div>
                 <div className="p-2 max-h-[450px] overflow-y-auto bg-muted/5">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                            <Command className="h-5 w-5 animate-spin" />
                            <span>Chargement...</span>
                        </div>
                    ) : filteredResults.length > 0 ? (
                        <div className="space-y-4 py-2">
                            <div>
                                <p className="px-3 pb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    {query ? 'Résultats correspondants' : 'Suggestions rapides'}
                                </p>
                                <div className="space-y-1">
                                    {filteredResults.map((result) => {
                                        const Icon = result.icon;
                                        return (
                                            <Link
                                                key={result.title + result.href}
                                                href={result.href}
                                                onClick={handleSelect}
                                                className="flex items-center justify-between p-3 rounded-xl hover:bg-white dark:hover:bg-zinc-900 hover:shadow-sm group transition-all"
                                            >
                                                <div className='flex items-center gap-3'>
                                                    <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                                                        <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium group-hover:text-primary">{result.title}</span>
                                                        <span className="text-[10px] text-muted-foreground">{result.category}</span>
                                                    </div>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 px-4">
                            <div className="bg-muted/50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="h-6 w-6 text-muted-foreground/50" />
                            </div>
                            <p className="text-sm font-medium">Aucun résultat pour "{query}"</p>
                            <p className="text-xs text-muted-foreground mt-1">Vérifiez l'orthographe ou essayez un mot plus général.</p>
                        </div>
                    )}
                </div>
                <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1"><kbd className="border bg-background px-1 rounded">↵</kbd> Sélectionner</span>
                        <span className="flex items-center gap-1"><kbd className="border bg-background px-1 rounded">↑↓</kbd> Naviguer</span>
                    </div>
                    <span>NeoStud Search v1.0</span>
                </div>
            </DialogContent>
        </Dialog>
    </>
  );
}