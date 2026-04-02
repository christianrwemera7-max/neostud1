// src/components/conference-form-dialog.tsx
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
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { faculties, Faculty } from '@/lib/constants';
import type { Conference } from '@/lib/search-data';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Schéma de validation
const conferenceSchema = z.object({
  title: z.string().min(5, "Le titre est requis."),
  speaker: z.string().min(3, "Le nom de l'intervenant est requis."),
  description: z.string().min(10, "La description est requise."),
  image: z.string().url("L'URL de l'image est invalide."),
  aiHint: z.string().min(2, "Le 'AI Hint' est requis."),
  date: z.string({ required_error: "La date est requise." }),
  type: z.enum(["À venir", "Replay"], { required_error: "Le type est requis." }),
  status: z.enum(["upcoming", "replay"], { required_error: "Le statut est requis." }),
  link: z.string().url("Le lien de la conférence est invalide."),
  faculty: z.enum(faculties, { required_error: "La faculté est requise." }),
});

export type ConferenceFormValues = z.infer<typeof conferenceSchema>;

interface ConferenceFormDialogProps {
    conference?: Conference;
    onConfirm: (data: ConferenceFormValues) => Promise<void>;
    triggerButton: React.ReactNode;
}

export function ConferenceFormDialog({ conference, onConfirm, triggerButton }: ConferenceFormDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const isEditMode = !!conference;

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, control, setValue } = useForm<ConferenceFormValues>({
    resolver: zodResolver(conferenceSchema),
    defaultValues: isEditMode ? conference : {
        title: '',
        speaker: '',
        description: '',
        image: 'https://picsum.photos/600/400',
        aiHint: 'conference presentation',
        date: '',
        link: '',
        type: 'À venir',
        status: 'upcoming'
    }
  });

  useEffect(() => {
    if (open) {
        reset(isEditMode ? conference : {
            title: '',
            speaker: '',
            description: '',
            image: 'https://picsum.photos/600/400',
            aiHint: 'conference presentation',
            date: '',
            link: '',
            type: 'À venir',
            status: 'upcoming'
        });
    }
  }, [open, isEditMode, conference, reset]);


  const onSubmit: SubmitHandler<ConferenceFormValues> = async (data) => {
    await onConfirm(data);
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Modifier la conférence' : 'Nouvelle conférence'}</DialogTitle>
          <DialogDescription>
            Remplissez les détails ci-dessous.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-2">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input id="title" {...register("title")} disabled={isSubmitting} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

           <div className="space-y-2">
            <Label htmlFor="speaker">Intervenant</Label>
            <Input id="speaker" {...register("speaker")} disabled={isSubmitting} />
            {errors.speaker && <p className="text-sm text-destructive">{errors.speaker.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register("description")} disabled={isSubmitting} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>
          
           <div className="space-y-2">
            <Label htmlFor="image">URL de l'image</Label>
            <Input id="image" {...register("image")} disabled={isSubmitting} />
            {errors.image && <p className="text-sm text-destructive">{errors.image.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="aiHint">Indice pour IA (AI Hint)</Label>
            <Input id="aiHint" {...register("aiHint")} disabled={isSubmitting} />
            {errors.aiHint && <p className="text-sm text-destructive">{errors.aiHint.message}</p>}
          </div>

           <div className="space-y-2">
            <Label htmlFor="link">Lien de la conférence (Zoom, Meet, etc.)</Label>
            <Input id="link" {...register("link")} disabled={isSubmitting} />
            {errors.link && <p className="text-sm text-destructive">{errors.link.message}</p>}
          </div>

            <div className="space-y-2">
                <Label>Date</Label>
                 <Controller
                    control={control}
                    name="date"
                    render={({ field }) => (
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className="w-full justify-start text-left font-normal"
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(new Date(field.value), "PPP", { locale: fr }) : <span>Choisir une date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={field.value ? new Date(field.value) : undefined}
                                    onSelect={(date) => {
                                        if (date) {
                                            const formattedDate = format(date, "d MMMM yyyy", { locale: fr });
                                            setValue('date', formattedDate, { shouldValidate: true });
                                        }
                                    }}
                                    initialFocus
                                    locale={fr}
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                />
                {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                  <Label>Type</Label>
                  <Controller
                      control={control}
                      name="type"
                      render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="À venir">À venir</SelectItem>
                                  <SelectItem value="Replay">Replay</SelectItem>
                              </SelectContent>
                          </Select>
                      )}
                  />
                  {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
              </div>
              <div className="space-y-2">
                  <Label>Statut</Label>
                  <Controller
                      control={control}
                      name="status"
                      render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="upcoming">Upcoming</SelectItem>
                                  <SelectItem value="replay">Replay</SelectItem>
                              </SelectContent>
                          </Select>
                      )}
                  />
                  {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
              </div>
          </div>
          
           <div className="space-y-2">
                <Label>Faculté</Label>
                <Controller
                    control={control}
                    name="faculty"
                    render={({ field }) => (
                         <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                            <SelectTrigger><SelectValue placeholder="Sélectionnez une faculté" /></SelectTrigger>
                            <SelectContent>
                                {faculties.map((faculty) => (
                                    <SelectItem key={faculty} value={faculty}>{faculty}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.faculty && <p className="text-sm text-destructive">{errors.faculty.message}</p>}
            </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? 'Enregistrer les modifications' : 'Ajouter la conférence'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
