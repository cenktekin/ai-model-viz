
import { db } from '../db';
import { analysesTable } from '../db/schema';
import { type Analysis } from '../schema';

export const getAnalyses = async (): Promise<Analysis[]> => {
  try {
    const results = await db.select()
      .from(analysesTable)
      .execute();

    return results.map(analysis => ({
      ...analysis,
      parameters: analysis.parameters as Record<string, any> | null,
      results: analysis.results as Record<string, any> | null,
      created_at: analysis.created_at,
      updated_at: analysis.updated_at
    }));
  } catch (error) {
    console.error('Get analyses failed:', error);
    throw error;
  }
};
