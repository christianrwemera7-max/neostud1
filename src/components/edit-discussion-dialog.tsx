// src/components/edit-discussion-dialog.tsx
'use client';

import React, { useState, useEffect } from 'react';
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
import { Loader2, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Discussion } from '@/lib/search-data';

const discussionCategories = ["Entraide", "Questions de cours", "Débats", "Annonces", "Autre"];

const discussionSchema = z.object({
  title: z.string().min(10, "Le titre doit contenir au moins 10 caractères."),
  content: z.string().min(20, "Le contenu doit contenir au moins 20 caractères."),
  category: z.string({
    required_error: "La catégorie est requise.",
  }),
});

export type DiscussionFormValues = z.infer<typeof discussionSchema>;

interface EditDiscussionDialogProps {
    discussion: Discussion;
    onDiscussionUpdated: (discussionId: string, data: DiscussionFormValues) => Promise<void>;
    triggerButton: React.ReactNode;
}

export function EditDiscussionDialog({ discussion, onDiscussionUpdated, triggerButton }: EditDiscussionDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, control } = useForm<DiscussionFormValues>({
    resolver: zodResolver(discussionSchema),
  });

  useEffect(() => {
    if (open) {
      reset({
        title: discussion.title,
        content: discussion.content,
        category: discussion.category,
      });
    }
  }, [open, discussion, reset]);

  const onSubmit: SubmitHandler<DiscussionFormValues> = async (data) => {
    await onDiscussionUpdated(discussion.id, data);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Modifier la discussion</DialogTitle>
          <DialogDescription>
            Mettez à jour les informations de votre publication.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input id="title" {...register("title")} disabled={isSubmitting} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Message</Label>
            <Textarea id="content" {...register("content")} disabled={isSubmitting} rows={6} />
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
              Enregistrer les modifications
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
