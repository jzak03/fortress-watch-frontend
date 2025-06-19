// Summarizes scan findings using GenAI to provide key insights.
'use server';

/**
 * @fileOverview Summarizes scan findings using GenAI.
 *
 * - summarizeScanFindings - A function that summarizes scan findings.
 * - SummarizeScanFindingsInput - The input type for the summarizeScanFindings function.
 * - SummarizeScanFindingsOutput - The return type for the summarizeScanFindings function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeScanFindingsInputSchema = z.object({
  scanData: z
    .string()
    .describe('The scan data to be summarized. This is a JSON string.'),
});
export type SummarizeScanFindingsInput = z.infer<typeof SummarizeScanFindingsInputSchema>;

const SummarizeScanFindingsOutputSchema = z.object({
  summary: z.string().describe('A summary of the scan findings.'),
  keyInsights: z.string().describe('Key insights from the scan findings.'),
  confidenceScore: z.number().describe('A confidence score (0-1) indicating the reliability of the summary and insights.'),
});
export type SummarizeScanFindingsOutput = z.infer<typeof SummarizeScanFindingsOutputSchema>;

export async function summarizeScanFindings(input: SummarizeScanFindingsInput): Promise<SummarizeScanFindingsOutput> {
  return summarizeScanFindingsFlow(input);
}

const summarizeScanFindingsPrompt = ai.definePrompt({
  name: 'summarizeScanFindingsPrompt',
  input: {schema: SummarizeScanFindingsInputSchema},
  output: {schema: SummarizeScanFindingsOutputSchema},
  prompt: `You are a security analyst expert summarizing scan findings.

  Analyze the following scan data and provide a summary and key insights.
  Also, provide a confidence score (0-1) indicating the reliability of the summary and insights.

  Scan Data: {{{scanData}}}

  Respond in markdown format.
  `,
});

const summarizeScanFindingsFlow = ai.defineFlow(
  {
    name: 'summarizeScanFindingsFlow',
    inputSchema: SummarizeScanFindingsInputSchema,
    outputSchema: SummarizeScanFindingsOutputSchema,
  },
  async input => {
    const {output} = await summarizeScanFindingsPrompt(input);
    return output!;
  }
);
