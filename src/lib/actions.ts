'use server';

import { suggestLearningPath, type SuggestLearningPathOutput, type SuggestLearningPathInput } from '@/ai/flows/suggest-learning-path';
import { runAssistant, type AssistantOutput } from '@/ai/flows/assistant-flow';
import { generateQuiz, type GenerateQuizOutput, type GenerateQuizInput } from '@/ai/flows/generate-quiz-flow';
import { speakText } from '@/ai/flows/tts-flow';
import { z } from 'zod';
import { FACULTY_NAMES } from './constants';
import { auth, db } from './firebase';
import { doc, getDoc, runTransaction, writeBatch, serverTimestamp, collection, addDoc, increment, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';


export async function generateLearningPath(
  input: SuggestLearningPathInput
): Promise<SuggestLearningPathOutput> {

  const validatedFields = z.object({
    studentId: z.string(),
    faculty: z.enum(FACULTY_NAMES),
    courseId: z.string().min(1),
    targetSemester: z.enum(['semestre-1', 'semestre-2', 'annee-complete']),
    learningObjectives: z.array(z.string()),
    currentProgress: z.string(), // Is a JSON string
  }).safeParse(input);

  if (!validatedFields.success) {
    throw new Error('Données non valides. Vérifiez vos entrées.');
  }

  try {
    const result = await suggestLearningPath(validatedFields.data);
    return result;
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Une erreur inattendue est survenue. Veuillez réessayer.';
    throw new Error(errorMessage);
  }
}


// Chat Assistant Actions
const messageSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  faculty: z.enum(FACULTY_NAMES, { required_error: 'Faculty is required' }),
  isDeveloperMode: z.boolean(),
});

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export type ChatState = {
  messages: Message[];
  error?: string;
};

async function getUserRole(userId: string): Promise<'student' | 'premium_student' | 'faculty_admin' | 'admin'> {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
        return userDoc.data().role || 'student';
    }
    return 'student';
}

export async function sendMessage(prevState: ChatState, formData: FormData): Promise<ChatState> {
  const validatedFields = messageSchema.safeParse({
    message: formData.get('message'),
    faculty: formData.get('faculty'),
    isDeveloperMode: formData.get('isDeveloperMode') === 'true',
  });

  if (!validatedFields.success) {
    return {
      ...prevState,
      error: 'Données invalides. L\'IA n\'a pas pu recevoir votre message.',
    };
  }
  
  let { message: userMessage, faculty, isDeveloperMode } = validatedFields.data;
  const newMessages: Message[] = [...prevState.messages, { role: 'user', content: userMessage }];

  // Sécurité : Vérifier le rôle de l'utilisateur côté serveur
  const userId = auth.currentUser?.uid;
  if (isDeveloperMode && userId) {
      const userRole = await getUserRole(userId);
      if (userRole !== 'admin' && userRole !== 'premium_student') {
          // Si l'utilisateur n'est pas premium, on force le mode développeur à false
          isDeveloperMode = false;
      }
  } else if (isDeveloperMode && !userId) {
      // Si l'utilisateur n'est pas connecté, le mode dev est désactivé
      isDeveloperMode = false;
  }

  try {
    const result: AssistantOutput = await runAssistant({
      message: userMessage,
      history: prevState.messages,
      faculty: faculty,
      isDeveloperMode: isDeveloperMode,
    });
    
    newMessages.push({ role: 'assistant', content: result.response });
    
    return {
      messages: newMessages,
    };

  } catch (error) {
    console.error(error);
    return {
      ...prevState,
      error: 'Désolé, une erreur est survenue avec l\'assistant. Veuillez réessayer.',
    };
  }
}

// TTS Action
export async function getVoiceResponse(text: string): Promise<{ media: string }> {
  try {
    return await speakText(text);
  } catch (error) {
    console.error("TTS Action Error:", error);
    throw new Error("Impossible de générer la voix.");
  }
}

// Quiz Generation Action
export async function createQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  const validatedFields = z.object({
    courseContext: z.string().min(5, { message: 'Le sujet doit contenir au moins 5 caractères.' }),
  }).safeParse(input);

  if (!validatedFields.success) {
    throw new Error('Données non valides. Vérifiez le sujet du quiz.');
  }

  try {
    const result = await generateQuiz(validatedFields.data);
    return result;
  } catch (error) {
    console.error("Error in createQuiz action:", error);
    throw new Error("L'IA n'a pas pu générer le quiz. Veuillez réessayer.");
  }
}

// --- Bibliothèque : Favoris, Notes, Commentaires ---

const favoriteSchema = z.object({
  resourceId: z.string(),
  userId: z.string(),
});

export async function toggleFavorite(data: { resourceId: string, userId: string }): Promise<{ favorited: boolean }> {
  const validation = favoriteSchema.safeParse(data);
  if (!validation.success) {
    throw new Error("Données invalides.");
  }

  const { resourceId, userId } = validation.data;
  const favoriteDocRef = doc(db, 'users', userId, 'favorites', resourceId);
  const resourceDocRef = doc(db, 'library', resourceId);

  try {
    let favorited = false;
    await runTransaction(db, async (transaction) => {
      const favoriteDoc = await transaction.get(favoriteDocRef);

      if (favoriteDoc.exists()) {
        transaction.delete(favoriteDocRef);
        transaction.update(resourceDocRef, { favoritesCount: increment(-1) });
        favorited = false;
      } else {
        transaction.set(favoriteDocRef, { createdAt: serverTimestamp() });
        transaction.update(resourceDocRef, { favoritesCount: increment(1) });
        favorited = true;
      }
    });
    return { favorited };
  } catch (error) {
    console.error("Erreur lors du basculement du favori:", error);
    throw new Error("Impossible de mettre à jour les favoris.");
  }
}


const ratingSchema = z.object({
  resourceId: z.string(),
  userId: z.string(),
  rating: z.number().min(1).max(5),
});

export async function submitRating(data: { resourceId: string, userId: string, rating: number }) {
  const validation = ratingSchema.safeParse(data);
  if (!validation.success) throw new Error("Note invalide.");

  const { resourceId, userId, rating } = validation.data;
  const ratingDocRef = doc(db, 'ratings', `${userId}_${resourceId}`);
  const resourceDocRef = doc(db, 'library', resourceId);

  try {
    await runTransaction(db, async (transaction) => {
      const resourceDoc = await transaction.get(resourceDocRef);
      const ratingDoc = await transaction.get(ratingDocRef);

      if (!resourceDoc.exists()) throw new Error("Ressource non trouvée.");

      const resourceData = resourceDoc.data();
      const currentRating = (resourceData.rating || 0) as number;
      const ratingCount = (resourceData.ratingCount || 0) as number;
      const oldUserRating = ratingDoc.exists() ? (ratingDoc.data().rating as number) : 0;

      let newRatingCount = ratingCount;
      let newTotalRating = currentRating * ratingCount;

      if (ratingDoc.exists()) {
        newTotalRating = newTotalRating - oldUserRating + rating;
      } else {
        newRatingCount += 1;
        newTotalRating += rating;
      }
      
      const newAverageRating = newRatingCount > 0 ? newTotalRating / newRatingCount : 0;
      
      transaction.set(ratingDocRef, { userId, resourceId, rating, createdAt: serverTimestamp() });
      transaction.update(resourceDocRef, {
        rating: newAverageRating,
        ratingCount: newRatingCount,
      });
    });
  } catch (error) {
    console.error("Erreur lors de la soumission de la note:", error);
    throw new Error("Impossible de soumettre la note.");
  }
}


const commentSchema = z.object({
  resourceId: z.string(),
  userId: z.string(),
  authorName: z.string(),
  authorAvatar: z.string().url().or(z.literal("")),
  content: z.string().min(1, "Le commentaire ne peut pas être vide."),
});

export async function addComment(data: z.infer<typeof commentSchema>) {
    const validation = commentSchema.safeParse(data);
    if (!validation.success) {
        throw new Error("Données de commentaire invalides.");
    }

    const { resourceId, userId, authorName, authorAvatar, content } = validation.data;
    const commentsCollectionRef = collection(db, 'library', resourceId, 'comments');
    const resourceDocRef = doc(db, 'library', resourceId);

    const batch = writeBatch(db);

    const newCommentRef = doc(commentsCollectionRef);
    batch.set(newCommentRef, {
        authorId: userId,
        authorName,
        authorAvatar,
        content,
        createdAt: serverTimestamp(),
    });
    
    batch.update(resourceDocRef, { commentsCount: increment(1) });

    try {
        await batch.commit();
    } catch (error) {
        console.error("Erreur lors de l'ajout du commentaire:", error);
        throw new Error("Impossible d'ajouter le commentaire.");
    }
}

const updateCommentSchema = z.object({
  resourceId: z.string(),
  commentId: z.string(),
  content: z.string().min(1, "Le commentaire ne peut pas être vide."),
  userId: z.string(),
});

export async function updateComment(data: z.infer<typeof updateCommentSchema>) {
    const validation = updateCommentSchema.safeParse(data);
    if (!validation.success) throw new Error("Données de mise à jour invalides.");

    const { resourceId, commentId, content, userId } = validation.data;
    const commentDocRef = doc(db, 'library', resourceId, 'comments', commentId);

    const commentDoc = await getDoc(commentDocRef);
    if (!commentDoc.exists() || commentDoc.data().authorId !== userId) {
        throw new Error("Action non autorisée.");
    }

    await updateDoc(commentDocRef, { content });
}

const deleteCommentSchema = z.object({
  resourceId: z.string(),
  commentId: z.string(),
  userId: z.string(),
});

export async function deleteComment(data: z.infer<typeof deleteCommentSchema>) {
    const validation = deleteCommentSchema.safeParse(data);
    if (!validation.success) throw new Error("Données de suppression invalides.");

    const { resourceId, commentId, userId } = validation.data;
    const commentDocRef = doc(db, 'library', resourceId, 'comments', commentId);
    const resourceDocRef = doc(db, 'library', resourceId);

    const commentDoc = await getDoc(commentDocRef);
    if (!commentDoc.exists() || commentDoc.data().authorId !== userId) {
        throw new Error("Action non autorisée.");
    }

    const batch = writeBatch(db);
    batch.delete(commentDocRef);
    batch.update(resourceDocRef, { commentsCount: increment(-1) });
    
    await batch.commit();
}


// --- Gestion de Compte ---

export async function deleteCurrentUserAccount(): Promise<{ success: boolean; error?: string }> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Aucun utilisateur n'est connecté.");
  }

  try {
    const userDocRef = doc(db, 'users', user.uid);
    await deleteDoc(userDocRef);
    await deleteUser(user);
    return { success: true };
  } catch (error: any) {
    console.error("Erreur lors de la suppression du compte :", error);
    
    if (error.code === 'auth/requires-recent-login') {
      throw new Error("Cette opération est sensible. Veuillez vous reconnecter avant de supprimer votre compte.");
    }

    throw new Error("Une erreur est survenue lors de la suppression du compte.");
  }
}

// --- Activation de carte Premium ---
const activatePremiumSchema = z.object({
  userId: z.string(),
});

export async function activatePremiumWithCard(data: { userId: string }): Promise<{ success: boolean; error?: string }> {
  const validation = activatePremiumSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: 'Données non valides.' };
  }
  
  const { userId } = validation.data;
  const userDocRef = doc(db, 'users', userId);

  try {
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      return { success: false, error: 'Utilisateur non trouvé.' };
    }

    if (userDoc.data().role === 'premium_student') {
        return { success: false, error: 'Cet utilisateur est déjà premium.' };
    }

    const startDate = Timestamp.now();
    const endDate = new Timestamp(startDate.seconds + 365 * 24 * 60 * 60, startDate.nanoseconds);

    await updateDoc(userDocRef, {
      role: 'premium_student',
      subscriptionStartDate: startDate,
      subscriptionEndDate: endDate,
    });
    
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de l'activation de la carte:", error);
    return { success: false, error: "Une erreur est survenue lors de l'activation." };
  }
}
