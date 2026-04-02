'use client';
import React from 'react';
import { MermaidRenderer } from './mermaid-renderer';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Découper le contenu pour isoler les blocs Mermaid
  const parts = content.split(/(\`\`\`mermaid[\s\S]*?\`\`\`)/g);

  const renderText = (text: string) => {
    if (!text.trim()) return { __html: '' };

    let html = text
      // Titres en gras (souvent envoyés par l'IA sous forme de **Titre**)
      .replace(/^\*\*(.*?)\*\*/gm, '<h4 class="text-sm font-bold text-primary mt-4 mb-2">$1</h4>')
      // Listes à puces
      .replace(/^- (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
      // Encapsuler les li consécutifs dans un ul
      .replace(/(<li.*<\/li>)+/g, '<ul class="list-disc list-outside my-3">$1</ul>')
      // Gras simple à l'intérieur du texte
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      // Italique
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      // Sauts de ligne pour paragraphes
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/\n/g, '<br />');

    // On s'assure que tout est dans un paragraphe
    html = `<p class="mb-3">${html}</p>`;
    
    // Nettoyage final pour les balises mal imbriquées par le regex
    html = html.replace(/<p class="mb-3"><ul/g, '<ul').replace(/<\/ul><\/p>/g, '</ul>');

    return { __html: html };
  };

  return (
    <div className="markdown-content">
      {parts.map((part, index) => {
        if (part.startsWith('```mermaid')) {
          const code = part.replace('```mermaid', '').replace('```', '').trim();
          return <MermaidRenderer key={index} code={code} />;
        }
        return <div key={index} dangerouslySetInnerHTML={renderText(part)} />;
      })}
    </div>
  );
}