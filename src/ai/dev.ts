import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-learning-path.ts';
import '@/ai/flows/assistant-flow.ts';
import '@/ai/flows/generate-quiz-flow.ts';
import '@/ai/flows/tts-flow.ts';
