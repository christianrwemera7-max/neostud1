// src/components/edit-comment-dialog.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
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
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { Comment } from '@/lib/search-data';

const commentSchema = z.object({
  content: z.string().min(1, "Le commentaire ne peut pas être vide."),
});

type CommentFormValues = z.infer<typeof commentSchema>;

interface EditCommentDialogProps {
    comment: Comment;
    onCommentUpdated: (commentId: string, content: string) => Promise<void>;
    trigger: React.ReactNode;
}

export function EditCommentDialog({ comment, onCommentUpdated, trigger }: EditCommentDialogProps) {
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
  });

  useEffect(() => {
    if (open) {
      reset({ content: comment.content });
    }
  }, [open, comment, reset]);

  const onSubmit: SubmitHandler<CommentFormValues> = async (data) => {
    await onCommentUpdated(comment.id, data.content);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Modifier le commentaire</DialogTitle>
          <DialogDescription>
            Mettez à jour le contenu de votre commentaire.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="content" className="sr-only">Commentaire</Label>
            <Textarea id="content" {...register("content")} disabled={isSubmitting} rows={5} />
            {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
          </div>

          <DialogFooter className="pt-4">
             <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
