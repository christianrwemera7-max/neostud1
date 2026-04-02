import { FacultyName } from "@/lib/constants";

interface FacultyContent {
    title: string;
    description: string;
    cta: string;
    imageHint: string;
}

const defaultContent: FacultyContent = {
    title: "Bienvenue sur NeoStud !",
    description: "Votre plateforme pour exceller dans vos études. Explorez des cours spécialisés, plongez dans notre bibliothèque ou laissez notre IA construire votre parcours de révision personnalisé.",
    cta: "Découvrir les parcours",
    imageHint: "e-learning platform"
};

const contentByFaculty: Partial<Record<FacultyName, FacultyContent>> = {
    "Droit": {
        title: "Bienvenue sur votre Espace Droit !",
        description: "Votre parcours pour exceller en droit commence ici. Explorez des cours spécialisés, plongez dans notre bibliothèque juridique ou laissez notre IA construire votre parcours de révision personnalisé.",
        cta: "Obtenez votre parcours d'IA",
        imageHint: "law books constitution"
    },
    "Economie": {
        title: "Bienvenue sur votre Espace Économie !",
        description: "Analysez les marchés, comprenez les politiques monétaires et maîtrisez les théories économiques. Votre avenir en économie se construit aujourd'hui.",
        cta: "Optimisez votre stratégie",
        imageHint: "stock market chart"
    },
    "Informatique": {
        title: "Bienvenue sur votre Espace Informatique !",
        description: "Compilez vos connaissances, débuggez vos difficultés et déployez votre potentiel. Que ce soit pour le code, les réseaux ou les systèmes, votre parcours de développeur commence ici.",
        cta: "Générez votre roadmap de dev",
        imageHint: "code on screen"
    },
    "Medecine": {
        title: "Bienvenue sur votre Espace Médecine !",
        description: "Du premier cycle aux ECN, accédez à des ressources précises pour maîtriser chaque aspect de la science médicale. Préparez vos diagnostics, vos gardes et votre avenir.",
        cta: "Structurez votre apprentissage",
        imageHint: "doctor stethoscope"
    },
    "Science Politique": {
        title: "Bienvenue sur votre Espace Sc. Politique !",
        description: "Analysez les dynamiques du pouvoir, les relations internationales et les politiques publiques. Forgez votre esprit critique et préparez-vous à comprendre les enjeux du monde contemporain.",
        cta: "Élaborez votre stratégie d'étude",
        imageHint: "government building"
    }
};

export function getFacultyContent(faculty?: FacultyName): FacultyContent {
    if (faculty && contentByFaculty[faculty]) {
        return contentByFaculty[faculty]!;
    }
    return defaultContent;
}
