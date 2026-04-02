'use client';

import React, { useState, useRef, useEffect } from 'react';
import { sendMessage, getVoiceResponse, type ChatState } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Loader2, Send, Sparkles, Mic, Volume2, Headset, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sidebar, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { Badge } from '@/components/ui/badge';

export default function AssistantPage() {
  const { userData, loading } = useAuth();
  const [state, setState] = useState<ChatState>({ messages: [] });
  const [isProcessing, setIsProcessing] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
        viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [state.messages]);

  if (loading) return null;

  return (
    <SidebarProvider>
      <Sidebar><SidebarNav /></Sidebar>
      <SidebarInset>
        <Header />
        <main className="p-4 lg:p-6 bg-muted/20 flex-1 flex flex-col h-[calc(100vh-4rem)] page-transition">
            <div className="max-w-4xl mx-auto w-full mb-4">
                <Alert className="bg-primary/5 border-primary/20">
                    <Info className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-primary font-bold">Service bientôt disponible</AlertTitle>
                    <AlertDescription className="text-muted-foreground text-xs">
                        L'assistant Neo est actuellement en phase finale de déploiement. L'accès complet sera activé prochainement.
                    </AlertDescription>
                </Alert>
            </div>

            <Card className="w-full max-w-4xl mx-auto flex-1 flex flex-col shadow-xl border-none overflow-hidden">
                <CardHeader className="border-b bg-card">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-xl">
                                <Bot className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Assistant Neo IA</CardTitle>
                                <CardDescription>Expert en <span className="font-bold text-primary">{userData?.faculty}</span></CardDescription>
                            </div>
                        </div>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Beta</Badge>
                    </div>
                </CardHeader>
                
                <CardContent className="flex-1 p-0 bg-muted/5">
                  <ScrollArea className="h-full" viewportRef={viewportRef}>
                    <div className="px-4 py-6 space-y-6 max-w-3xl mx-auto">
                      {state.messages.length === 0 ? (
                         <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                            <Bot className="h-16 w-16 mb-4 text-primary/40" />
                            <h3 className="text-xl font-bold">Neo est presque prêt !</h3>
                            <p className="max-w-xs mx-auto">Bientôt, vous pourrez poser toutes vos questions académiques et obtenir des réponses structurées.</p>
                        </div>
                      ) : (
                        state.messages.map((msg, index) => (
                          <div key={index} className={cn("flex gap-4", msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                            <Avatar className="h-9 w-9 border">
                                <AvatarFallback>{msg.role === 'assistant' ? 'N' : 'U'}</AvatarFallback>
                            </Avatar>
                            <div className={cn("max-w-[80%] p-4 rounded-2xl text-sm shadow-sm", msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-white border')}>
                                <MarkdownRenderer content={msg.content} />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
                
                <CardFooter className="p-4 border-t bg-card">
                    <div className="relative flex items-center gap-2 bg-muted/30 p-2 rounded-2xl border w-full">
                      <Button size="icon" variant="ghost" className="rounded-full" disabled><Mic className="h-5 w-5" /></Button>
                      <input 
                        disabled 
                        placeholder="Neo sera bientôt prêt à vous répondre..." 
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm"
                      />
                      <Button size="icon" className="rounded-full" disabled><Send className="h-5 w-5" /></Button>
                    </div>
                </CardFooter>
            </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}