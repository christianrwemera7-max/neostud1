// src/components/ai-path-generator.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { generateLearningPath, type SuggestLearningPathOutput, type WeeklyPlan } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { BrainCircuit, Lightbulb, Loader2, AlertTriangle, BookCopy, Calendar, Clock, Sparkles, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { topicsByCourse, ProgressTopic } from '@/lib/constants';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Separator } from './ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { PremiumLock } from './premium-lock';

type State = {
  status: 'initial' | 'pending' | 'success' | 'error';
  message: string;
  data: SuggestLearningPathOutput | null;
};

const initialState: State = {
  status: 'initial',
  message: '',
  data: null,
};

const defaultObjectives = 'Je veux réussir mes examens de fin d\'année en approfondissant mes connaissances sur les matières fondamentales. Mon objectif est d\'obtenir une mention pour faciliter mon accès en Master.';

export function AiPathGenerator() {
  const { userData, featureFlags } = useAuth();
  const [state, setState] = useState<State>(initialState);
  const [isPending, setIsPending] = useState(false);
  const [targetSemester, setTargetSemester] = useState<'semestre-1' | 'semestre-2' | 'annee-complete'>('annee-complete');
  
  const hasPremiumAccess = userData?.role === 'admin' || userData?.role === 'premium_student';
  const isFeaturePremium = featureFlags?.isPathPremium ?? false;
  
  const courseId = userData?.studyLevel;

  const progressTopicsForCourse: ProgressTopic[] = useMemo(() => {
    if (!userData?.faculty || !courseId) return [];
    const facultyTopics = topicsByCourse[userData.faculty];
    return facultyTopics ? (facultyTopics[courseId] || []) : [];
  }, [userData?.faculty, courseId]);


  const { semester1Topics, semester2Topics } = useMemo(() => {
    const s1 = progressTopicsForCourse.filter(t => t.semester === 'semestre-1');
    const s2 = progressTopicsForCourse.filter(t => t.semester === 'semestre-2');
    return { semester1Topics: s1, semester2Topics: s2 };
  }, [progressTopicsForCourse]);
  
  const [progressValues, setProgressValues] = useState<Record<string, number>>({});
  const [learningObjectives, setLearningObjectives] = useState(defaultObjectives);

  useEffect(() => {
    if (progressTopicsForCourse.length > 0) {
      setProgressValues(
        progressTopicsForCourse.reduce((acc, topic) => ({ ...acc, [topic.id]: topic.defaultValue }), {})
      );
    } else {
      setProgressValues({});
    }
    setState(initialState);
  }, [progressTopicsForCourse]);

  const handleSliderChange = (id: string, value: number[]) => {
    setProgressValues(prev => ({ ...prev, [id]: value[0] }));
  };
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userData || !courseId) return;

    setIsPending(true);
    setState({ ...initialState, status: 'pending' });

    // Transformer les progressValues pour envoyer le nom de la matière au lieu de l'ID
    const progressWithLabels = Object.entries(progressValues).reduce((acc, [id, value]) => {
        const topic = progressTopicsForCourse.find(t => t.id === id);
        if (topic) {
            acc[topic.label] = value;
        }
        return acc;
    }, {} as Record<string, number>);

    try {
      const result = await generateLearningPath({
        studentId: userData.uid,
        faculty: userData.faculty,
        courseId: courseId,
        learningObjectives: [learningObjectives],
        currentProgress: JSON.stringify(progressWithLabels),
        targetSemester,
      });

      setState({
        status: 'success',
        message: 'Parcours généré avec succès.',
        data: result,
      });

    } catch (error) {
       const errorMessage = error instanceof Error ? error.message : 'Une erreur inattendue est survenue.';
       setState({
        status: 'error',
        message: errorMessage,
        data: null,
      });
    } finally {
      setIsPending(false);
    }
  };

  const renderTopics = (topics: ProgressTopic[]) => {
    if (topics.length === 0) return null;
    return topics.map(topic => (
      <div key={topic.id} className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor={`slider-${topic.id}`} className="text-sm font-normal">{topic.label}</Label>
          <span className="text-sm text-muted-foreground">
              {progressValues[topic.id] || 0}%
          </span>
        </div>
        <Slider
          id={`slider-${topic.id}`}
          value={[progressValues[topic.id] || 0]}
          max={100}
          step={10}
          onValueChange={(value) => handleSliderChange(topic.id, value)}
        />
      </div>
    ));
  }

  if (!userData) {
    return (
       <Card className="h-full flex flex-col items-center justify-center text-center p-8">
            <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
            <h3 className="text-xl font-semibold">Accès non autorisé</h3>
            <p className="text-muted-foreground mt-2">Vous devez être connecté pour utiliser le générateur de parcours.</p>
        </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {isFeaturePremium && !hasPremiumAccess ? (
        <div className="lg:col-span-2">
            <PremiumLock featureName="Générateur de Parcours IA" />
        </div>
      ) : (
        <Card>
            <form onSubmit={handleSubmit}>
            <CardHeader>
                <CardTitle>Votre Profil de {userData.faculty}</CardTitle>
                <CardDescription>Ajustez les curseurs pour refléter votre progression et choisissez votre objectif principal pour ce plan d'étude.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                
                <div className="space-y-3 rounded-md border p-4">
                  <Label className="font-semibold">Quel est votre objectif principal ?</Label>
                  <RadioGroup
                      value={targetSemester}
                      onValueChange={(value) => setTargetSemester(value as any)}
                      className="flex flex-col sm:flex-row gap-4"
                  >
                      <div className="flex items-center space-x-2">
                      <RadioGroupItem value="semestre-1" id="s1" />
                      <Label htmlFor="s1" className="font-normal cursor-pointer">Premier Semestre</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                      <RadioGroupItem value="semestre-2" id="s2" />
                      <Label htmlFor="s2" className="font-normal cursor-pointer">Deuxième Semestre</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                      <RadioGroupItem value="annee-complete" id="s-all" />
                      <Label htmlFor="s-all" className="font-normal cursor-pointer">Année Complète</Label>
                      </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-6">
                {semester1Topics.length > 0 && (
                    <div className="space-y-4 rounded-md border p-4">
                    <Label className="font-semibold">Progression - Premier Semestre</Label>
                    {renderTopics(semester1Topics)}
                    </div>
                )}

                {semester2Topics.length > 0 && (
                    <div className="space-y-4 rounded-md border p-4">
                    <Label className="font-semibold">Progression - Deuxième Semestre</Label>
                    {renderTopics(semester2Topics)}
                    </div>
                )}

                {progressTopicsForCourse.length === 0 && (
                    <div className="text-center text-muted-foreground p-4">
                      Aucune matière n'est définie pour votre promotion ({userData.studyLevel}).
                    </div>
                )}
                </div>

                <div className="space-y-2">
                <Label htmlFor="learningObjectives">Objectifs d'apprentissage (optionnel)</Label>
                <Textarea
                    id="learningObjectives"
                    name="learningObjectives"
                    placeholder="Ex: Je veux préparer le concours de la magistrature."
                    value={learningObjectives}
                    onChange={(e) => setLearningObjectives(e.target.value)}
                    rows={5}
                    className="bg-background"
                />
                </div>

            </CardContent>
            <CardFooter>
                <Button type="submit" disabled={isPending || progressTopicsForCourse.length === 0} className="w-full md:w-auto">
                    {isPending ? (
                        <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Génération en cours...
                        </>
                    ) : (
                        <>
                        <BrainCircuit className="mr-2 h-4 w-4" />
                        Générer mon plan d'étude
                        </>
                    )}
                </Button>
            </CardFooter>
            </form>
        </Card>
      )}
      
      <div className="space-y-4">
        {(isFeaturePremium && !hasPremiumAccess) ? null :
        state.status === 'initial' && !isPending ? (
          <Card className="h-full flex flex-col items-center justify-center text-center p-8">
            <BrainCircuit className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">Votre plan d'étude personnalisé vous attend</h3>
            <p className="text-muted-foreground mt-2">Ajustez votre profil et cliquez sur "Générer" pour commencer.</p>
          </Card>
        ) : null}
        
        {isPending && (
          <Card className="h-full flex flex-col items-center justify-center text-center p-8">
            <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
            <h3 className="text-xl font-semibold">Création de votre plan sur mesure...</h3>
            <p className="text-muted-foreground mt-2">Notre IA analyse votre profil pour bâtir la meilleure stratégie.</p>
          </Card>
        )}

        {state.status === 'error' && !isPending && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erreur de Génération</AlertTitle>
            <AlertDescription>
                {state.message || "L'IA n'a pas pu générer de parcours. Veuillez réessayer plus tard."}
            </AlertDescription>
          </Alert>
        )}

        {state.status === 'success' && state.data && !isPending && (
            <div className="space-y-6">
                <Card className="bg-primary/5 border-primary/20 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3"><Lightbulb className="h-6 w-6 text-primary"/>Stratégie de l'IA</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <p className="text-muted-foreground">{state.data.overallReasoning}</p>
                    </CardContent>
                </Card>
                
                <Separator />

                <div>
                    <h3 className="text-xl font-bold mb-4">Votre Plan d'Action sur 4 Semaines</h3>
                    <Accordion type="single" collapsible defaultValue="week-1" className="w-full">
                         {state.data.weeklyPlan.map((week) => (
                             <AccordionItem value={`week-${week.week}`} key={week.week}>
                                <AccordionTrigger>
                                    <div className="flex items-center gap-3 text-lg">
                                        <div className="p-2 bg-primary/10 rounded-full">
                                            <Calendar className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            Semaine {week.week}: <span className="font-normal text-muted-foreground">{week.focus}</span>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pl-4 border-l-2 border-primary/50 ml-5">
                                    <div className="space-y-4 pt-2">
                                        {week.steps.map((step, index) => (
                                            <div key={index} className="p-4 rounded-lg border bg-background/50">
                                                <h4 className="font-semibold text-base">{step.topicName}</h4>
                                                <p className="text-sm text-muted-foreground mt-1">{step.justification}</p>
                                                <Separator className="my-3" />
                                                <div className="flex flex-col sm:flex-row justify-between gap-2 text-sm">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Clock className="h-4 w-4"/>
                                                        <span>Durée suggérée: <span className="font-medium text-foreground">{step.suggestedDuration}</span></span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-primary">
                                                        <Sparkles className="h-4 w-4" />
                                                        <span className="font-medium">Conseil: {step.practicalTips}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                             </AccordionItem>
                         ))}
                    </Accordion>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
