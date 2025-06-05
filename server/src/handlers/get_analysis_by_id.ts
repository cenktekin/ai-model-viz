
import { db } from '../db';
import { analysesTable } from '../db/schema';
import { type Analysis } from '../schema';
import { eq } from 'drizzle-orm';

export const getAnalysisById = async (id: number): Promise<Analysis | null> => {
  try {
    const results = await db.select()
      .from(analysesTable)
      .where(eq(analysesTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const analysis = results[0];
    return {
      ...analysis,
      // Convert jsonb fields from database format to expected types
      parameters: analysis.parameters as Record<string, any> | null,
      results: analysis.results as Record<string, any> | null
    };
  } catch (error) {
    console.error('Analysis retrieval failed:', error);
    throw error;
  }
};
