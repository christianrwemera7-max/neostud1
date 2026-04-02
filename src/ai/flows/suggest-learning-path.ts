'use server';

/**
 * @fileOverview A learning path suggestion AI agent.
 *
 * - suggestLearningPath - A function that suggests an optimal learning path based on user progress.
 * - SuggestLearningPathInput - The input type for the suggestLearningPath function.
 * - SuggestLearningPathOutput - The return type for the suggestLearningPath function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { FACULTY_NAMES } from '@/lib/constants';

const SuggestLearningPathInputSchema = z.object({
  studentId: z.string().describe('The ID of the student.'),
  courseId: z.string().describe('The ID of the course.'),
  faculty: z.enum(FACULTY_NAMES).describe('The faculty of the student.'),
  targetSemester: z
    .enum(['semestre-1', 'semestre-2', 'annee-complete'])
    .describe(
      "The semester the student wants to focus on. The path should prioritize subjects from this semester, but can include prerequisites from other semesters if necessary."
    ),
  currentProgress: z
    .string()
    .describe(
      'A JSON string map of content IDs to progress percentages (0-100) for the student in the course.'
    ),
  learningObjectives: z
    .array(z.string())
    .describe('A list of learning objectives for the course.'),
});
export type SuggestLearningPathInput = z.infer<typeof SuggestLearningPathInputSchema>;


const StepSchema = z.object({
  topicName: z.string().describe("Le nom de la matière ou du sujet à étudier."),
  justification: z.string().describe("La raison pour laquelle cette matière est incluse à cette étape."),
  suggestedDuration: z.string().describe("Le temps d'étude suggéré pour cette étape (ex: '1 semaine', '3 jours')."),
  practicalTips: z.string().describe("Conseils pratiques pour aborder cette matière (ex: 'Focus sur les cas pratiques', 'Faire des fiches de révision')."),
});

const WeeklyPlanSchema = z.object({
  week: z.number().describe("Le numéro de la semaine (commençant à 1)."),
  focus: z.string().describe("L'objectif principal ou le thème de la semaine."),
  steps: z.array(StepSchema).describe("La liste des matières/étapes à suivre pour cette semaine."),
});

const SuggestLearningPathOutputSchema = z.object({
  overallReasoning: z.string().describe("L'explication globale et la stratégie derrière le plan proposé."),
  weeklyPlan: z.array(WeeklyPlanSchema).describe("Un plan d'étude détaillé découpé en semaines."),
});

export type SuggestLearningPathOutput = z.infer<typeof SuggestLearningPathOutputSchema>;
export type WeeklyPlan = z.infer<typeof WeeklyPlanSchema>;


export async function suggestLearningPath(
  input: SuggestLearningPathInput
): Promise<SuggestLearningPathOutput> {
  return suggestLearningPathFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestLearningPathPrompt',
  input: {schema: SuggestLearningPathInputSchema},
  output: {schema: SuggestLearningPathOutputSchema},
  system: `Tu es un coach pédagogique IA expert, spécialisé pour les étudiants de la faculté de {{{faculty}}}.
Ton rôle est de transformer une évaluation de compétences en un plan d'action structuré, motivant et réaliste sur 4 semaines.

L'étudiant souhaite se concentrer sur le : **{{{targetSemester}}}**.

Tes instructions sont les suivantes :
1.  **Analyse Stratégique** : Analyse la progression de l'étudiant (0% = aucune maîtrise, 100% = maîtrise complète), ses objectifs, et les matières. Identifie les points faibles qui sont des prérequis pour des matières plus importantes, surtout celles du semestre ciblé.
2.  **Création du Plan Hebdomadaire** :
    *   Crée un plan d'étude sur 4 semaines.
    *   Pour chaque semaine, définis un objectif clair et concis (le champ 'focus'). Par exemple: "Semaine 1: Consolidation des fondamentaux du droit civil".
    *   Répartis les matières à étudier dans les 4 semaines de manière logique. Commence par les matières les moins maîtrisées et les plus fondamentales.
    *   Combine 2 à 3 matières par semaine pour un apprentissage équilibré. Ne surcharge pas l'étudiant.
3.  **Détail des Étapes (Steps)** : Pour chaque matière dans une semaine donnée :
    *   **topicName**: Indique le nom complet de la matière.
    *   **justification**: Explique brièvement (1 sentence) pourquoi cette matière est importante à ce moment du plan.
    *   **suggestedDuration**: Estime un temps d'étude réaliste (ex: '2 jours', '4 sessions de 2h').
    *   **practicalTips**: Fournis UN conseil très concret et actionnable. Ex: "Focalisez-vous sur les arrêts de principe" ou "Entraînez-vous avec les annales des 3 dernières années".
4.  **Priorité au Semestre Ciblé** : Le plan doit se concentrer PRINCIPALEMENT sur les matières du semestre ciblé ({{{targetSemester}}}). Si des matières d'un autre semestre sont des prérequis essentiels et que l'étudiant y est faible, inclus-les en début de plan (Semaine 1 ou 2).
5.  **Raisonnement Global** : Rédige une explication globale ('overallReasoning') qui résume la logique de ton plan. Explique pourquoi tu as commencé par certaines matières et comment le plan aide à atteindre les objectifs de l'étudiant et du semestre visé.
6.  **Ton** : Adopte un ton encourageant, clair et professionnel. Tu es un coach qui guide vers la réussite.`,
  prompt: `Voici les informations sur l'étudiant :

- ID Étudiant : {{{studentId}}}
- ID du Cours : {{{courseId}}}
- Faculté : {{{faculty}}}
- Semestre à prioriser : {{{targetSemester}}}
- Progression Actuelle (Format JSON où la clé est le nom de la matière et la valeur est le pourcentage de maîtrise) : {{{currentProgress}}}
- Objectifs d'Apprentissage : {{{learningObjectives}}}

Génère un plan d'étude hebdomadaire détaillé sur 4 semaines. La sortie doit être un JSON valide respectant le schéma spécifié.`,
});

const suggestLearningPathFlow = ai.defineFlow(
  {
    name: 'suggestLearningPathFlow',
    inputSchema: SuggestLearningPathInputSchema,
    outputSchema: SuggestLearningPathOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
