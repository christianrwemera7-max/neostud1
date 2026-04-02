// src/components/add-resource-dialog.tsx
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
import { Loader2, PlusCircle, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { courseNames, resourceIcons, ResourceType, faculties } from '@/lib/constants';
import { Switch } from '@/components/ui/switch';

const resourceTypeList = Object.keys(resourceIcons) as [ResourceType, ...ResourceType[]];

// Schéma de validation pour le formulaire
const resourceSchema = z.object({
  title: z.string().min(3, "Le titre est requis."),
  description: z.string().min(10, "La description est requise."),
  type: z.enum(resourceTypeList, {
    required_error: "Le type de ressource est requis.",
  }),
  courseId: z.enum(Object.keys(courseNames) as [string, ...string[]], {
      required_error: "Le niveau d'étude est requis."
  }),
  faculty: z.enum(faculties, {
      required_error: "La faculté est requise."
  }),
  semester: z.enum(['semestre-1', 'semestre-2'], {
      required_error: "Le semestre est requis."
  }),
  fileUrl: z.string().url({ message: "Veuillez entrer une URL valide." }),
  premium: z.boolean().default(false),
});

// Le type des valeurs du formulaire
export type ResourceFormValues = z.infer<typeof resourceSchema>;


interface AddResourceDialogProps {
    onResourceAdded: (data: ResourceFormValues) => Promise<void>;
}

export function AddResourceDialog({ onResourceAdded }: AddResourceDialogProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();


  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, control } = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
        title: '',
        description: '',
        fileUrl: '',
        premium: false,
    }
  });

  const onSubmit: SubmitHandler<ResourceFormValues> = async (data) => {
    if (!user) {
      toast({ variant: "destructive", title: "Erreur", description: "Vous devez être connecté." });
      return;
    }
    
    await onResourceAdded(data);

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
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Ajouter une ressource
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Nouvelle ressource</DialogTitle>
          <DialogDescription>
            Remplissez les informations ci-dessous pour ajouter une nouvelle ressource à la bibliothèque.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-2">
          <div className="space-y-2">
            <Label htmlFor="title">Titre</Label>
            <Input id="title" {...register("title")} disabled={isSubmitting} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register("description")} disabled={isSubmitting} />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Type</Label>
                <Controller
                    control={control}
                    name="type"
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                            <SelectTrigger><SelectValue placeholder="Sélectionnez un type" /></SelectTrigger>
                            <SelectContent>
                                {Object.keys(resourceIcons).map(type => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
            </div>
             <div className="space-y-2">
                <Label>Niveau d'étude</Label>
                <Controller
                    control={control}
                    name="courseId"
                    render={({ field }) => (
                         <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                            <SelectTrigger><SelectValue placeholder="Sélectionnez un niveau" /></SelectTrigger>
                            <SelectContent>
                                {Object.entries(courseNames).map(([id, name]) => (
                                    <SelectItem key={id} value={id}>{name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.courseId && <p className="text-sm text-destructive">{errors.courseId.message}</p>}
            </div>
          </div>

           <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label>Semestre</Label>
                 <Controller
                    control={control}
                    name="semester"
                    render={({ field }) => (
                         <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                            <SelectTrigger><SelectValue placeholder="Sélectionnez un semestre" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="semestre-1">Premier Semestre</SelectItem>
                                <SelectItem value="semestre-2">Deuxième Semestre</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
                {errors.semester && <p className="text-sm text-destructive">{errors.semester.message}</p>}
              </div>
            </div>
          
           <div className="space-y-2">
                <Label htmlFor="fileUrl">Lien de la ressource</Label>
                <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="fileUrl" type="url" {...register("fileUrl")} disabled={isSubmitting} className="pl-8" placeholder="https://..." />
                </div>
                {errors.fileUrl && <p className="text-sm text-destructive">{errors.fileUrl.message}</p>}
           </div>
            <div className="flex items-center gap-4 pt-2">
                <Controller
                    control={control}
                    name="premium"
                    render={({ field }) => (
                        <Switch
                            id="premium"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSubmitting}
                        />
                    )}
                />
                <Label htmlFor="premium" className="cursor-pointer">
                    Ressource Premium
                    <p className="text-xs font-normal text-muted-foreground">Cochez si cette ressource nécessite un abonnement.</p>
                </Label>
            </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Ajout en cours...' : 'Ajouter la ressource'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

    