'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface MermaidRendererProps {
  code: string;
}

export function MermaidRenderer({ code }: MermaidRendererProps) {
  const [svg, setSvg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const renderChart = async () => {
      if (!code) return;
      
      setLoading(true);
      try {
        // Importation dynamique de mermaid pour éviter les problèmes de SSR et de build
        const mermaid = (await import('mermaid')).default;
        
        mermaid.initialize({
          startOnLoad: false,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'Inter, sans-serif',
        });

        // Générer un ID unique pour le rendu
        const id = `mermaid-${Math.random().toString(36).substring(7)}`;
        const { svg: renderedSvg } = await mermaid.render(id, code);
        setSvg(renderedSvg);
      } catch (error) {
        console.error('Erreur de rendu Mermaid:', error);
        setSvg('<p class="text-destructive text-xs p-4">Erreur lors de la génération du diagramme. Vérifiez la syntaxe Mermaid.</p>');
      } finally {
        setLoading(false);
      }
    };

    renderChart();
  }, [code]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 my-4 border rounded-xl bg-muted/30 min-h-[200px] animate-pulse">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-xs text-muted-foreground">Génération du schéma...</p>
      </div>
    );
  }

  return (
    <div className="my-6 space-y-2">
      <div 
        className="mermaid-diagram overflow-x-auto p-4 flex justify-center bg-white dark:bg-zinc-900 rounded-xl border shadow-sm"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <p className="text-[10px] text-center text-muted-foreground italic">Schéma conceptuel généré par Neo IA</p>
    </div>
  );
}
