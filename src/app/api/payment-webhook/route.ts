// src/app/api/payment-webhook/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

// Ceci est un exemple de webhook. La structure exacte du payload de Lygos
// peut varier. Il faudra l'ajuster en fonction de leur documentation.
interface LygosWebhookPayload {
    event: 'checkout.session.completed';
    data: {
        object: {
            id: string; // ID de la session de paiement
            status: 'succeeded';
            metadata: {
                userId: string;
            };
            // ... autres champs
        }
    }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json() as LygosWebhookPayload;
    
    // 1. Vérifier l'authenticité du webhook (important en production)
    // const signature = request.headers.get('lygos-signature');
    // if (!isValidSignature(payload, signature)) {
    //     return new NextResponse('Invalid signature', { status: 400 });
    // }
    
    // 2. Traiter l'événement
    if (payload.event === 'checkout.session.completed' && payload.data.object.status === 'succeeded') {
        const { userId } = payload.data.object.metadata;

        if (!userId) {
            console.warn('Webhook reçu sans userId dans les métadonnées.');
            return new NextResponse('Webhook traité, mais sans userId.', { status: 200 });
        }

        // 3. Mettre à jour la base de données
        console.log(`Mise à jour du rôle pour l'utilisateur ${userId} vers premium_student.`);
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, {
            role: 'premium_student',
        });
        console.log(`Utilisateur ${userId} mis à jour avec succès.`);
    } else {
        console.log(`Webhook reçu pour l'événement ${payload.event}, ignoré.`);
    }

    // 4. Renvoyer une réponse de succès à Lygos
    return new NextResponse('Webhook traité avec succès.', { status: 200 });

  } catch (error) {
    console.error('Erreur lors du traitement du webhook Lygos:', error);
    if (error instanceof Error) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }
    return new NextResponse('Erreur interne du serveur', { status: 500 });
  }
}

export async function GET(request: Request) {
    console.log("Le Webhook a reçu une requête GET. Ignorée.");
    const destinationURL = new URL('/library', request.url);
    destinationURL.searchParams.set('payment', 'success');
    return NextResponse.redirect(destinationURL);
}
