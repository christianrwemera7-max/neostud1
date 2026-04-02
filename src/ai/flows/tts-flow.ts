'use server';
/**
 * @fileOverview A flow for Text-to-Speech using Genkit and Gemini.
 * 
 * - speakText - A function that converts text to a base64 encoded WAV audio URI.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TTSInputSchema = z.string().describe('The text to convert to speech.');
const TTSOutputSchema = z.object({
  media: z.string().describe('The data URI of the generated WAV audio.'),
});

export async function speakText(text: string): Promise<{ media: string }> {
  return speakTextFlow(text);
}

const speakTextFlow = ai.defineFlow(
  {
    name: 'speakTextFlow',
    inputSchema: TTSInputSchema,
    outputSchema: TTSOutputSchema,
  },
  async (text) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: text,
    });

    if (!media) {
      throw new Error('No media returned from TTS model');
    }

    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );

    const wav = await import('wav');
    const wavBuffer = await toWav(audioBuffer, wav.default);

    return {
      media: 'data:audio/wav;base64,' + wavBuffer.toString('base64'),
    };
  }
);

/**
 * Convertit un buffer PCM brut en format WAV en ajoutant l'en-tête RIFF.
 * Gemini TTS retourne du PCM mono, 24000Hz, 16-bit (sample width 2).
 */
async function toWav(
  pcmData: Buffer,
  wavModule: any,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const writer = new wavModule.Writer({
      channels: numChannels,
      sampleRate: sampleRate,
      bitDepth: bitsPerSample,
    });

    const chunks: Buffer[] = [];
    writer.on('data', (chunk: Buffer) => chunks.push(chunk));
    writer.on('end', () => resolve(Buffer.concat(chunks)));
    writer.on('error', reject);

    writer.write(pcmData);
    writer.end();
  });
}
