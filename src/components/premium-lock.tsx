// src/components/premium-lock.tsx
'use client';

import Link from "next/link";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Sparkles, Lock } from "lucide-react";

export function PremiumLock({ featureName }: { featureName: string }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{featureName} - Fonctionnalité Premium</CardTitle>
                <CardDescription>Cette fonctionnalité est exclusivement réservée aux membres Premium.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                <Lock className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                <p className="text-muted-foreground mb-6">Passez à Premium pour débloquer cette fonctionnalité et bien plus encore.</p>
                <Button asChild className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                    <Link href="/subscribe">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Devenir Premium
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
