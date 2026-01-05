'use server';

/**
 * @fileOverview Flow to generate a formatted PDF report from inspection data and attached photos.
 *
 * - generatePdfReport - Generates a PDF report based on inspection data and photos.
 * - GeneratePdfReportInput - The input type for the generatePdfReport function.
 * - GeneratePdfReportOutput - The return type for the generatePdfReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePdfReportInputSchema = z.object({
  inspectionData: z.string().describe('JSON string containing inspection data.'),
  photos: z.array(z.string()).describe('Array of data URIs for attached photos.'),
});
export type GeneratePdfReportInput = z.infer<typeof GeneratePdfReportInputSchema>;

const GeneratePdfReportOutputSchema = z.object({
  pdfReport: z.string().describe('Base64 encoded PDF report.'),
});
export type GeneratePdfReportOutput = z.infer<typeof GeneratePdfReportOutputSchema>;

export async function generatePdfReport(input: GeneratePdfReportInput): Promise<GeneratePdfReportOutput> {
  return generatePdfReportFlow(input);
}

const generatePdfReportPrompt = ai.definePrompt({
  name: 'generatePdfReportPrompt',
  input: {schema: GeneratePdfReportInputSchema},
  output: {schema: GeneratePdfReportOutputSchema},
  prompt: `You are an expert at generating technical reports.

  Based on the inspection data and attached photos, generate a formatted PDF report.

  Inspection Data: {{{inspectionData}}}
  Photos: {{#each photos}}{{media url=this}}{{/each}}

  Return the PDF as a base64 encoded string.
  `,
});

const generatePdfReportFlow = ai.defineFlow(
  {
    name: 'generatePdfReportFlow',
    inputSchema: GeneratePdfReportInputSchema,
    outputSchema: GeneratePdfReportOutputSchema,
  },
  async input => {
    // TODO: Implement the logic to convert the inspection data and photos to a PDF report.
    // This is a placeholder, replace with actual PDF generation logic.
    // For now, just return a dummy PDF report.
    const {output} = await generatePdfReportPrompt(input);
    return output!;
  }
);
