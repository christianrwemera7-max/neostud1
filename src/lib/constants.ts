import { FileText, Mic, Video, HelpCircle, BookCheck } from "lucide-react";

export const resourceIcons = {
  'Notes de cours': FileText,
  'Podcast': Mic,
  'Vidéo explicative': Video,
  'Quiz': HelpCircle,
  'Fiche de révision': BookCheck,
};

export type ResourceType = keyof typeof resourceIcons;

export const courseNames: { [key: string]: string } = {
    'annee-preparatoire': 'Année Préparatoire',
    'l1': 'Licence 1',
    'l2': 'Licence 2',
    'l3': 'Licence 3',
    'm1': 'Master 1',
    'm2': 'Master 2',
    'doctorat': 'Doctorat (Internat)',
};

export const FACULTY_NAMES = [
    "Droit",
    "Economie",
    "Informatique",
    "Medecine",
    "Science Politique"
] as const;
export type FacultyName = typeof FACULTY_NAMES[number];

export interface University {
    id: string;
    name: string;
    studentCount?: number;
}

export interface Faculty {
    id: string;
    name: FacultyName;
    universityId: string;
    studentCount?: number;
}

interface CoursePromotion {
    id: string;
    title: string;
    description: string;
    subjects: string[];
    image: string;
    aiHint: string;
    className: string;
}

// Exemple pour la faculté de Droit
const droitCourses: CoursePromotion[] = [
    {
        id: "l1",
        title: "Licence 1",
        description: "Explorez les matières fondamentales et maîtrisez les bases du raisonnement juridique.",
        subjects: ["Droit constitutionnel", "Histoire du droit", "Théorie de l'État", "Anglais juridique"],
        image: "https://picsum.photos/seed/droit1/600/400",
        aiHint: "law constitution",
        className: "from-primary/10 to-transparent",
    },
    {
        id: "l2",
        title: "Licence 2",
        description: "Approfondissez vos connaissances dans les grandes branches du droit public et privé.",
        subjects: ["Droit pénal", "Droit civil", "Finances publiques", "Droit commercial"],
        image: "https://picsum.photos/seed/droit2/600/400",
        aiHint: "legal books",
        className: "from-primary/10 to-transparent",
    }
];

export const coursesByFaculty: Record<FacultyName, CoursePromotion[]> = {
    "Droit": droitCourses,
    "Economie": [],
    "Informatique": [],
    "Medecine": [],
    "Science Politique": [],
};

export interface ProgressTopic {
    id: string;
    label: string;
    defaultValue: number;
    semester: 'semestre-1' | 'semestre-2';
}

export const topicsByCourse: Record<FacultyName, Record<string, ProgressTopic[]>> = {
    "Droit": {
        'l1': [
            { id: 'drt-l1-s1-const', label: "Droit constitutionnel", defaultValue: 50, semester: 'semestre-1' },
            { id: 'drt-l1-s1-hist', label: "Histoire du droit", defaultValue: 40, semester: 'semestre-1' },
        ]
    },
    "Economie": {},
    "Informatique": {},
    "Medecine": {},
    "Science Politique": {},
};
