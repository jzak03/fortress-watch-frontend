'use server';
/**
 * @fileOverview Enhances vulnerability scan reports with AI-powered analysis.
 *
 * - enhanceScanWithAi - A function that enhances a scan report with AI analysis.
 * - EnhanceScanWithAiInput - The input type for the enhanceScanWithAi function.
 * - EnhanceScanWithAiOutput - The return type for the enhanceScanWithAi function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceScanWithAiInputSchema = z.object({
  scanReport: z.string().describe('The vulnerability scan report to analyze.'),
});
export type EnhanceScanWithAiInput = z.infer<typeof EnhanceScanWithAiInputSchema>;

const EnhanceScanWithAiOutputSchema = z.object({
  executiveSummary: z.string().describe('An executive summary of the scan report.'),
  prioritizedRecommendations: z
    .string()
    .describe('Prioritized recommendations for addressing the identified vulnerabilities.'),
  confidenceScore: z
    .number()
    .describe('A confidence score (0-1) indicating the reliability of the AI analysis.'),
});
export type EnhanceScanWithAiOutput = z.infer<typeof EnhanceScanWithAiOutputSchema>;

export async function enhanceScanWithAi(input: EnhanceScanWithAiInput): Promise<EnhanceScanWithAiOutput> {
  return enhanceScanWithAiFlow(input);
}

const enhanceScanWithAiPrompt = ai.definePrompt({
  name: 'enhanceScanWithAiPrompt',
  input: {schema: EnhanceScanWithAiInputSchema},
  output: {schema: EnhanceScanWithAiOutputSchema},
  prompt: `You are a security expert reviewing a vulnerability scan report.

  Report:
  {{scanReport}}

  Provide an executive summary of the report, and prioritized recommendations for addressing the identified vulnerabilities.  Also, provide a confidence score (0-1) indicating the reliability of your analysis.`,
});

const enhanceScanWithAiFlow = ai.defineFlow(
  {
    name: 'enhanceScanWithAiFlow',
    inputSchema: EnhanceScanWithAiInputSchema,
    outputSchema: EnhanceScanWithAiOutputSchema,
  },
  async input => {
    const {output} = await enhanceScanWithAiPrompt(input);
    return output!;
  }
);
