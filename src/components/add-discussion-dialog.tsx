// src/components/add-discussion-dialog.tsx
'use client';

import React, { useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { Loader2, PlusCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { DiscussionCreationData } from '@/lib/search-data';

const discussionCategories = ["Entraide", "Questions de cours", "Débats", "Annonces", "Autre"];

// Schéma de validation pour le formulaire
const discussionSchema = z.object({
  title: z.string().min(10, "Le titre doit contenir au moins 10 caractères."),
  content: z.string().min(20, "Le contenu doit contenir au moins 20 caractères."),
  category: z.string({
    required_error: "La catégorie est requise.",
  }),
});

export type DiscussionFormValues = z.infer<typeof discussionSchema>;

interface AddDiscussionDialogProps {
    onDiscussionAdded: (data: DiscussionCreationData) => Promise<void>;
}

export function AddDiscussionDialog({ onDiscussionAdded }: AddDiscussionDialogProps) {
  const [open, setOpen] = useState(false);
  const { userData } = useAuth();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, control } = useForm<DiscussionFormValues>({
    resolver: zodResolver(discussionSchema),
    defaultValues: {
        title: '',
        content: '',
    }
  });

  const onSubmit: SubmitHandler<DiscussionFormValues> = async (data) => {
    if (!userData) {
      toast({ variant: "destructive", title: "Erreur", description: "Vous devez être connecté." });
      return;
    }
    
    await onDiscussionAdded({
        ...data,
        faculty: userData.faculty,
    });

    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
            reset();
        }
    }}>
      <DialogTrigger asChild>
        <Button disabled={!userData}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Démarrer une discussion
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Démarrer une nouvelle discussion</DialogTitle>
          <DialogDescription>
            Posez votre question ou partagez vos idées avec la communauté de votre faculté.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input id="title" {...register("title")} disabled={isSubmitting} placeholder="Quel est le sujet principal ?"/>
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Votre message</Label>
            <Textarea id="content" {...register("content")} disabled={isSubmitting} rows={6} placeholder="Développez votre pensée, posez votre question en détail..."/>
            {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
          </div>

          <div className="space-y-2">
              <Label>Catégorie</Label>
              <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                          <SelectTrigger><SelectValue placeholder="Sélectionnez une catégorie" /></SelectTrigger>
                          <SelectContent>
                              {discussionCategories.map(category => (
                                  <SelectItem key={category} value={category}>{category}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                  )}
              />
              {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
          </div>
          

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Publication...' : 'Publier la discussion'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
