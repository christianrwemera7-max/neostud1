// src/components/edit-reply-dialog.tsx
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
import { Reply } from '@/lib/search-data';

const replySchema = z.object({
  content: z.string().min(1, "La réponse ne peut pas être vide."),
});

export type ReplyFormValues = z.infer<typeof replySchema>;

interface EditReplyDialogProps {
    reply: Reply;
    onReplyUpdated: (replyId: string, newContent: string) => Promise<void>;
    children: React.ReactNode;
}

export function EditReplyDialog({ reply, onReplyUpdated, children }: EditReplyDialogProps) {
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ReplyFormValues>({
    resolver: zodResolver(replySchema),
  });

  useEffect(() => {
    if (open) {
      reset({
        content: reply.content,
      });
    }
  }, [open, reply, reset]);

  const onSubmit: SubmitHandler<ReplyFormValues> = async (data) => {
    await onReplyUpdated(reply.id, data.content);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Modifier la réponse</DialogTitle>
          <DialogDescription>
            Mettez à jour le contenu de votre commentaire.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="content">Votre réponse</Label>
            <Textarea id="content" {...register("content")} disabled={isSubmitting} rows={6} />
            {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
          </div>

          <DialogFooter className="pt-4">
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
