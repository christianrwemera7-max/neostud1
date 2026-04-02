'use server';
/**
 * @fileOverview A simple chat AI agent.
 *
 * - runAssistant - A function that handles the chat interaction.
 * - AssistantInput - The input type for the chat function.
 * - AssistantOutput - The return type for the a function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { FACULTY_NAMES } from '@/lib/constants';
import { getFacultyKnowledge } from '@/ai/faculties-knowledge';

const AssistantInputSchema = z.object({
  message: z.string().describe('The user message.'),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).describe('The conversation history.'),
  faculty: z.enum(FACULTY_NAMES).describe("The user's faculty."),
  isDeveloperMode: z.boolean().optional().describe('Flag to enable a more detailed and structured response.'),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

const AssistantOutputSchema = z.object({
  response: z.string().describe("The AI's response."),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;


// Définir le schéma d'entrée étendu pour le prompt, incluant les connaissances de la faculté
const PromptInputSchema = AssistantInputSchema.extend({
    expertise: z.string(),
    instructions: z.string(),
    greeting: z.string(),
});

// Définir le prompt une seule fois, de manière statique.
const assistantPrompt = ai.definePrompt({
    name: 'assistantPrompt', // Un seul nom générique
    input: { schema: PromptInputSchema },
    output: { schema: AssistantOutputSchema },
    system: `Tu es Neo, un assistant IA expert conçu pour les étudiants de la plateforme NeoStud.
Ta mission est de fournir des réponses précises, structurées et pédagogiques.

Tu incarnes l'expert suivant :
**Spécialité : {{{expertise}}}**

**Instructions impératives :**
1.  **Expertise ciblée :** Base toutes tes réponses sur les connaissances spécifiques à ta spécialité. {{{instructions}}}
2.  **Rigueur et Précision :** Utilise tes capacités d'accès à l'information pour trouver les informations les plus récentes et pertinentes dans ton domaine d'expertise.
3.  **Ton Pédagogique :** Adopte un ton encourageant et professionnel. Simplifie les concepts complexes sans sacrifier la précision.
4.  **Gestion des limites :** Si une question est hors du champ de ta spécialité, admets-le poliment et explique pourquoi tu ne peux pas répondre. Ne jamais inventer une réponse.
5.  **Première interaction :** Si l'historique est vide, commence TOUJOURS la conversation par : "{{{greeting}}}". Pour les messages suivants, réponds directement à la question.

**Format de Réponse :**
{{#if isDeveloperMode}}
- **MODE APPROFONDI ACTIVÉ** : Développe le sujet de manière exhaustive. Structure ta réponse avec des titres en gras (en utilisant la syntaxe Markdown **Titre**), des listes à puces et des paragraphes détaillés. La réponse doit être longue, complète et approfondie.
- **Carte Mentale (si pertinent)** : Si la question de l'étudiant porte sur un concept qui peut être visualisé, tu DOIS générer une carte mentale (mind map) en utilisant la syntaxe Mermaid. Commencez le bloc par \`\`\`mermaid et termine par \`\`\`. La carte doit clairement hiérarchiser le concept central, les branches principales et les sous-branches. Le texte de la carte mentale doit être en français.
{{else}}
- **Mode Standard** : Fournis une réponse claire, concise et directe à la question de l'étudiant. Va droit au but.
{{/if}}`,
    prompt: `{{#if history}}Historique de la conversation :
{{#each history}}
- {{role}}: {{{content}}}
{{/each}}

Nouveau message de l'étudiant :
- user: {{{message}}}
{{else}}
- user: {{{message}}}
{{/if}}
Ta réponse (en tant qu'expert en {{{expertise}}}) :`,
});

const assistantFlow = ai.defineFlow(
  {
    name: 'assistantFlow',
    inputSchema: AssistantInputSchema,
    outputSchema: AssistantOutputSchema,
  },
  async (input) => {
    // Injecte la connaissance spécifique à la faculté dans le prompt.
    const facultyKnowledge = getFacultyKnowledge(input.faculty);
    
    // Appelle le prompt pré-défini avec toutes les données nécessaires
    const {output} = await assistantPrompt({
      ...input,
      ...facultyKnowledge, // Ajoute l'expertise, les instructions et le greeting au contexte du prompt
    });
    
    return output!;
  }
);

export async function runAssistant(input: AssistantInput): Promise<AssistantOutput> {
  return assistantFlow(input);
}
