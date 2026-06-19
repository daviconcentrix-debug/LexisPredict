'use server';
/**
 * @fileOverview A Genkit flow for analyzing legal case details to generate a risk score, priority level, and technical summary.
 *
 * - caseRiskAnalysis - A function that handles the case risk analysis process.
 * - CaseRiskAnalysisInput - The input type for the caseRiskAnalysis function.
 * - CaseRiskAnalysisOutput - The return type for the caseRiskAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CaseRiskAnalysisInputSchema = z.object({
  clientName: z.string().describe('The name of the client.'),
  protocolNumber: z
    .string()
    .describe('The unique protocol number of the legal case (CNJ format).'),
  caseSituation: z.string().describe('The current situation or status of the legal case.'),
  nextDeadline: z
    .string()
    .optional()
    .describe('The next important deadline for the case, in DD/MM/YYYY format.'),
  responsibleLawyer: z.string().optional().describe('The lawyer responsible for the case.'),
  caseDetails: z
    .string()
    .optional()
    .describe('Any additional relevant details or observations about the case.'),
});
export type CaseRiskAnalysisInput = z.infer<typeof CaseRiskAnalysisInputSchema>;

const CaseRiskAnalysisOutputSchema = z.object({
  riskScore: z
    .number()
    .min(0)
    .max(100)
    .describe('A numerical risk score for the case, from 0 (low risk) to 100 (high risk).'),
  priorityLevel: z
    .enum(['Low', 'Medium', 'High', 'Critical'])
    .describe('The priority level of the case based on its risk and deadlines.'),
  technicalSummary: z.string().describe(
    "A concise technical summary of the case's current status and potential implications."
  ),
});
export type CaseRiskAnalysisOutput = z.infer<typeof CaseRiskAnalysisOutputSchema>;

export async function caseRiskAnalysis(input: CaseRiskAnalysisInput): Promise<CaseRiskAnalysisOutput> {
  return caseRiskAnalysisFlow(input);
}

const caseRiskAnalysisPrompt = ai.definePrompt({
  name: 'caseRiskAnalysisPrompt',
  input: {schema: CaseRiskAnalysisInputSchema},
  output: {schema: CaseRiskAnalysisOutputSchema},
  prompt: `You are an expert legal analyst for LexisPredict, specializing in Brazilian judicial processes. Your task is to analyze the provided legal case details and generate a comprehensive risk assessment.

Based on the following information, determine a numerical risk score (0-100, where 0 is low risk and 100 is critical), assign a priority level ('Low', 'Medium', 'High', 'Critical'), and provide a concise technical summary of the case's status and implications.

Case Details:
Client Name: {{{clientName}}}
Protocol Number (CNJ): {{{protocolNumber}}}
Case Situation: {{{caseSituation}}}
{{#if nextDeadline}}Next Deadline: {{{nextDeadline}}}{{/if}}
{{#if responsibleLawyer}}Responsible Lawyer: {{{responsibleLawyer}}}{{/if}}
{{#if caseDetails}}Additional Details: {{{caseDetails}}}{{/if}}

Consider the following for your analysis:
- The CNJ protocol number often indicates the court, which can influence complexity.
- Deadlines are crucial: a missed or very near deadline significantly increases risk.
- The case situation (e.g., 'EM ANDAMENTO', 'SUSPENSO', 'VENCIDO', 'ARQUIVADO') directly impacts risk and priority.
- 'Critical' priority should be reserved for cases with imminent negative outcomes or very high risk scores (e.g., >80).
- 'High' priority for cases with significant risk or upcoming deadlines (e.g., 60-80).
- 'Medium' priority for standard active cases with manageable risk (e.g., 30-59).
- 'Low' priority for routine or archived cases with minimal immediate concern (e.g., <30).

Output ONLY a JSON object conforming to the specified schema, do not include any other text or explanation outside of the JSON.
`,
});

const caseRiskAnalysisFlow = ai.defineFlow(
  {
    name: 'caseRiskAnalysisFlow',
    inputSchema: CaseRiskAnalysisInputSchema,
    outputSchema: CaseRiskAnalysisOutputSchema,
  },
  async input => {
    // Use the DeepSeek R1 model via Vertex AI as specified by the user.
    const {output} = await ai.generate({
      model: 'googleai/deepseek-ai/deepseek-r1-0528-maas',
      prompt: caseRiskAnalysisPrompt(input),
      config: {
        // Optionally add safety settings if needed for this specific model/task
        // safetySettings: [],
      },
    });

    if (!output) {
      throw new Error('DeepSeek Legal Analyst did not return a valid output.');
    }

    return output;
  }
);
