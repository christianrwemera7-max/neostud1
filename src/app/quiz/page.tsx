// src/app/quiz/page.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Header } from '@/components/layout/header';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { createQuiz } from '@/lib/actions';
import { type GenerateQuizOutput } from '@/ai/flows/generate-quiz-flow';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { coursesByFaculty } from '@/lib/constants';
import { Loader2, BrainCircuit, HelpCircle, Check, X, Award, Info } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { PremiumLock } from '@/components/premium-lock';

type QuizState = {
  status: 'idle' | 'loading' | 'generated' | 'submitted' | 'error';
  quizData: GenerateQuizOutput | null;
  userAnswers: Record<number, string>;
  error?: string;
};

const initialState: QuizState = {
  status: 'idle',
  quizData: null,
  userAnswers: {},
  error: undefined,
};

export default function QuizPage() {
  const { userData, featureFlags } = useAuth();
  const [courseContext, setCourseContext] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [state, setState] = useState<QuizState>(initialState);
  
  const hasPremiumAccess = userData?.role === 'admin' || userData?.role === 'premium_student';
  const isFeaturePremium = featureFlags?.isQuizPremium ?? false;

  const coursesForFaculty = userData?.faculty ? coursesByFaculty[userData.faculty] : [];

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseContext || !selectedCourseId) return;

    setState({ ...initialState, status: 'loading' });

    try {
      const quiz = await createQuiz({ courseContext });
      setState(prevState => ({ ...prevState, status: 'generated', quizData: quiz, error: undefined }));
    } catch (error: any) {
      setState(prevState => ({ ...prevState, status: 'error', error: error.message }));
    }
  };

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setState(prevState => ({
      ...prevState,
      userAnswers: { ...prevState.userAnswers, [questionIndex]: answer },
    }));
  };

  const handleSubmitQuiz = () => {
    setState(prevState => ({ ...prevState, status: 'submitted' }));
  };

  const handleRetry = () => {
    setState(initialState);
    setCourseContext('');
    setSelectedCourseId('');
  };

  const score = state.quizData
    ? state.quizData.questions.reduce((acc, question, index) => {
        return state.userAnswers[index] === question.correctAnswer ? acc + 1 : acc;
      }, 0)
    : 0;
    
  const totalQuestions = state.quizData?.questions.length || 0;
  const scorePercentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

  const renderContent = () => {
    if (isFeaturePremium && !hasPremiumAccess) {
        return <PremiumLock featureName="Générateur de Quiz IA" />;
    }
    
    switch (state.status) {
        case 'loading':
            return (
                <Card className="flex flex-col items-center justify-center p-12">
                    <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
                    <h3 className="text-xl font-semibold">Génération du quiz en cours...</h3>
                    <p className="text-muted-foreground mt-2 text-center">Notre IA prépare des questions pertinentes sur "{courseContext}".</p>
                </Card>
            );
        case 'generated':
            if (!state.quizData) return null;
            return (
               <Card>
                 <CardHeader>
                    <CardTitle>{state.quizData.title}</CardTitle>
                    <CardDescription>Répondez aux questions ci-dessous.</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-8">
                    {state.quizData.questions.map((q, index) => (
                        <div key={index}>
                            <p className="font-semibold mb-4">{index + 1}. {q.question}</p>
                            <RadioGroup onValueChange={(value) => handleAnswerChange(index, value)}>
                                <div className="space-y-2">
                                {q.options.map((option, optIndex) => (
                                    <Label key={optIndex} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                                        <RadioGroupItem value={option} id={`q${index}-opt${optIndex}`} />
                                        <span>{option}</span>
                                    </Label>
                                ))}
                                </div>
                            </RadioGroup>
                        </div>
                    ))}
                 </CardContent>
                 <CardFooter>
                    <Button onClick={handleSubmitQuiz} disabled={Object.keys(state.userAnswers).length !== totalQuestions}>
                        <Check className="mr-2 h-4 w-4" />
                        Voir mes résultats
                    </Button>
                 </CardFooter>
               </Card>
            );
        case 'submitted':
            if (!state.quizData) return null;
            return (
                <Card>
                    <CardHeader className="text-center">
                        <Award className="h-12 w-12 text-amber-500 mx-auto mb-2"/>
                        <CardTitle className="text-2xl">Résultats du Quiz</CardTitle>
                        <CardDescription>{state.quizData.title}</CardDescription>
                         <div className="pt-4">
                            <p className="text-4xl font-bold">{score} / {totalQuestions}</p>
                            <Progress value={scorePercentage} className="w-full mt-2"/>
                         </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {state.quizData.questions.map((q, index) => {
                            const userAnswer = state.userAnswers[index];
                            const isCorrect = userAnswer === q.correctAnswer;
                            return (
                                <div key={index} className="p-4 rounded-lg border">
                                    <p className="font-semibold mb-3">{index + 1}. {q.question}</p>
                                    <div className="space-y-2 text-sm">
                                        {q.options.map((option, optIndex) => {
                                            const isUserChoice = userAnswer === option;
                                            const isCorrectAnswer = q.correctAnswer === option;
                                            return (
                                                <div 
                                                    key={optIndex}
                                                    className={cn(
                                                        "flex items-center gap-3 p-2 rounded-md",
                                                        isUserChoice && !isCorrect && "bg-destructive/10 text-destructive",
                                                        isCorrectAnswer && "bg-green-500/10 text-green-700 font-medium"
                                                    )}
                                                >
                                                    {isUserChoice ? (
                                                        isCorrect ? <Check className="h-4 w-4 text-green-600"/> : <X className="h-4 w-4 text-destructive"/>
                                                    ) : (
                                                        <div className="w-4 h-4" />
                                                    )}
                                                    <span>{option}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {!isCorrect && (
                                        <p className="text-xs text-green-700 mt-2">La bonne réponse était : <span className="font-semibold">{q.correctAnswer}</span></p>
                                    )}
                                </div>
                            )
                        })}
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleRetry}>
                            <HelpCircle className="mr-2 h-4 w-4"/>
                            Faire un autre quiz
                        </Button>
                    </CardFooter>
                </Card>
            );
        case 'idle':
        case 'error':
        default:
          return (
              <Card>
                <form onSubmit={handleGenerateQuiz}>
                  <CardHeader>
                    <CardTitle>Configurer votre Quiz</CardTitle>
                    <CardDescription>
                      Choisissez votre promotion et entrez le sujet précis que vous souhaitez réviser.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {state.error && (
                        <Alert variant="destructive">
                            <AlertTitle>Erreur</AlertTitle>
                            <AlertDescription>{state.error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="courseId">Promotion / Année d'étude</Label>
                      <Select value={selectedCourseId} onValueChange={setSelectedCourseId} required>
                        <SelectTrigger id="courseId">
                          <SelectValue placeholder="Sélectionnez votre promotion" />
                        </SelectTrigger>
                        <SelectContent>
                          {coursesForFaculty.map(course => (
                            <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="courseContext">Sujet du Quiz</Label>
                      <Input
                        id="courseContext"
                        placeholder="Ex: Le Droit des Contrats Spéciaux, Chapitre 3"
                        value={courseContext}
                        onChange={(e) => setCourseContext(e.target.value)}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit">
                      <BrainCircuit className="mr-2 h-4 w-4" />
                      Générer le Quiz
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            );
        }
  }


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarNav />
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="p-4 lg:p-6">
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tight">Générateur de Quiz IA</h1>
              <Alert className="bg-primary/5 border-primary/20">
                <Info className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary font-bold">Service bientôt disponible</AlertTitle>
                <AlertDescription className="text-muted-foreground text-xs">
                  Le générateur de quiz interactif est en phase finale de tests. Vous pourrez bientôt générer des quiz sur mesure pour vos révisions.
                </AlertDescription>
              </Alert>
              <p className="text-muted-foreground mt-2">
                Testez vos connaissances sur n'importe quel sujet de votre cursus.
              </p>
            </div>
             {renderContent()}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
