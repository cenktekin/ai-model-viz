
import { db } from '../db';
import { datasetsTable } from '../db/schema';
import { type Dataset } from '../schema';
import { eq } from 'drizzle-orm';

export const getDatasetById = async (id: number): Promise<Dataset | null> => {
  try {
    const results = await db.select()
      .from(datasetsTable)
      .where(eq(datasetsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const dataset = results[0];
    return {
      ...dataset,
      columns: dataset.columns as string[], // Cast JSONB to string array
      metadata: dataset.metadata as Record<string, any> | null // Cast JSONB to proper type
    };
  } catch (error) {
    console.error('Dataset retrieval failed:', error);
    throw error;
  }
};
