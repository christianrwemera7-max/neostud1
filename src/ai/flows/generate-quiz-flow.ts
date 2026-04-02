'use server';
/**
 * @fileOverview An AI agent for generating quizzes.
 *
 * - generateQuiz - A function that generates a quiz based on a course subject.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuizInputSchema = z.object({
  courseContext: z.string().describe('The subject or context of the course for which to generate a quiz.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const QuizQuestionSchema = z.object({
    question: z.string().describe("The quiz question."),
    options: z.array(z.string()).describe("A list of possible answers."),
    correctAnswer: z.string().describe("The correct answer from the options."),
});

const GenerateQuizOutputSchema = z.object({
  title: z.string().describe("The title of the quiz."),
  questions: z.array(QuizQuestionSchema).describe('A list of quiz questions, each with options and a correct answer.'),
  
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: {schema: GenerateQuizInputSchema},
  output: {schema: GenerateQuizOutputSchema},
  prompt: `Tu es un assistant pédagogique expert en droit congolais. Ta mission est de créer un quiz pertinent et stimulant pour les étudiants.
Le quiz doit porter sur le sujet suivant : {{{courseContext}}}.

Génère un quiz composé de 5 questions à choix multiples. Chaque question doit avoir 4 options de réponse, dont une seule est correcte.
Assure-toi que les questions couvrent des aspects importants du sujet.
Le titre du quiz doit être clair et en rapport avec le sujet.

Par exemple, pour "Droit Constitutionnel", le titre pourrait être "Quiz de Droit Constitutionnel".
`,
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
