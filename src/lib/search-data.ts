// src/lib/search-data.ts
import { FacultyName, ResourceType } from "./constants";
import { BookCopy, FileText, BrainCircuit, Users, Library, Bot, LayoutDashboard, HelpCircle } from 'lucide-react';
import React from "react";
import { getDocs, collection, Timestamp } from "firebase/firestore";
import { db } from "./firebase";

export interface Resource {
    id: string;
    title: string;
    type: ResourceType;
    description: string;
    author: string;
    courseId: string;
    faculty: FacultyName;
    semester: 'semestre-1' | 'semestre-2';
    createdAt: string | Timestamp; 
    fileUrl: string;
    premium: boolean;
    rating?: number;
    ratingCount?: number;
    favoritesCount?: number;
    commentsCount?: number;
}

export interface Discussion {
    id: string;
    title: string;
    content: string;
    author: string;
    authorId: string;
    avatar: string;
    category: string;
    replies: number;
    lastReply: string;
    createdAt: string | Timestamp; 
    lastReplyTimestamp?: Timestamp; 
    faculty: FacultyName;
}

export interface DiscussionCreationData {
    title: string;
    content: string;
    category: string;
    faculty: FacultyName;
}

export interface Reply {
    id: string;
    content: string;
    author: string;
    authorId: string;
    avatar: string;
    createdAt: string | Timestamp; 
    createdAtTimestamp?: Timestamp;
}

export interface Conference {
    id: string;
    title: string;
    speaker: string;
    image: string;
    aiHint: string;
    description: string;
    date: string;
    type: "À venir" | "Replay";
    status: "upcoming" | "replay";
    link: string;
    faculty: FacultyName;
    createdAt?: Timestamp;
}

export interface Training {
    id: string;
    title: string;
    description: string;
    author: string;
    avatar: string;
    image: string;
    aiHint: string;
    date: string;
    price: number;
    faculty: FacultyName;
}


export interface Comment {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar: string;
    content: string;
    createdAt: Timestamp;
}


export interface SearchResult {
    title: string;
    href: string;
    icon: React.ElementType;
    category: string;
}

// ---- Données Statiques des Pages ----
const staticPages: SearchResult[] = [
    { title: 'Tableau de bord', href: '/', icon: LayoutDashboard, category: 'Page' },
    { title: 'Cours', href: '/courses', icon: BookCopy, category: 'Page' },
    { title: 'Bibliothèque', href: '/library', icon: Library, category: 'Page' },
    { title: 'Parcours IA', href: '/ai-path', icon: BrainCircuit, category: 'Outil IA'},
    { title: 'Assistant IA', href: '/assistant', icon: Bot, category: 'Outil IA' },
    { title: 'Communauté', href: '/community', icon: Users, category: 'Page'},
    { title: 'Quiz', href: '/quiz', icon: HelpCircle, category: 'Outil IA' },
];

/**
 * Récupère toutes les ressources depuis Firestore.
 */
async function getFirestoreResources(): Promise<Resource[]> {
    const querySnapshot = await getDocs(collection(db, "library"));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
}


/**
 * Retourne une liste combinée de toutes les données consultables.
 */
export async function getAllSearchResults(): Promise<SearchResult[]> {
    let resourceResults: SearchResult[] = [];
    try {
        const resources = await getFirestoreResources();
        resourceResults = resources.map(resource => ({
            title: resource.title,
            href: `/library/${resource.id}`, // Lien vers la nouvelle page de détail
            icon: FileText,
            category: 'Ressource'
        }));
    } catch (error) {
        console.error("Could not fetch resources for search:", error);
    }
    
    return [...staticPages, ...resourceResults];
}
