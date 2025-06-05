
import { db } from '../db';
import { analysesTable } from '../db/schema';
import { type UpdateAnalysisStatusInput, type Analysis } from '../schema';
import { eq } from 'drizzle-orm';

export const updateAnalysisStatus = async (input: UpdateAnalysisStatusInput): Promise<Analysis> => {
  try {
    // Build update values
    const updateValues: any = {
      status: input.status,
      updated_at: new Date()
    };

    // Add results if provided
    if (input.results !== undefined) {
      updateValues.results = input.results;
    }

    // Update analysis record
    const result = await db.update(analysesTable)
      .set(updateValues)
      .where(eq(analysesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Analysis with id ${input.id} not found`);
    }

    const analysis = result[0];
    return {
      ...analysis,
      parameters: analysis.parameters as Record<string, any> | null,
      results: analysis.results as Record<string, any> | null
    };
  } catch (error) {
    console.error('Analysis status update failed:', error);
    throw error;
  }
};
