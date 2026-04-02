// @/lib/schemas.ts
import { z } from 'zod';
import { FACULTY_NAMES } from './constants';

export const learningPathSchema = z.object({
  currentProgress: z.record(z.number().min(0).max(100)),
  learningObjectives: z.string().min(10, {
    message: "Veuillez décrire vos objectifs d'apprentissage.",
  }),
  faculty: z.enum(FACULTY_NAMES),
  courseId: z.string().min(1, { message: "Veuillez sélectionner un parcours." }),
});
