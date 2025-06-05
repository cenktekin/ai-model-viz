
import { db } from '../db';
import { analysesTable } from '../db/schema';
import { type GetAnalysesByModelInput, type Analysis } from '../schema';
import { eq } from 'drizzle-orm';

export const getAnalysesByModel = async (input: GetAnalysesByModelInput): Promise<Analysis[]> => {
  try {
    const results = await db.select()
      .from(analysesTable)
      .where(eq(analysesTable.model_id, input.model_id))
      .execute();

    return results.map(analysis => ({
      ...analysis,
      parameters: analysis.parameters as Record<string, any> | null,
      results: analysis.results as Record<string, any> | null,
      created_at: new Date(analysis.created_at),
      updated_at: new Date(analysis.updated_at)
    }));
  } catch (error) {
    console.error('Failed to get analyses by model:', error);
    throw error;
  }
};
