
import { db } from '../db';
import { datasetsTable } from '../db/schema';
import { type Dataset } from '../schema';

export const getDatasets = async (): Promise<Dataset[]> => {
  try {
    const results = await db.select()
      .from(datasetsTable)
      .execute();

    return results.map(dataset => ({
      ...dataset,
      columns: dataset.columns as string[], // Cast jsonb to string array
      metadata: dataset.metadata as Record<string, any> | null
    }));
  } catch (error) {
    console.error('Get datasets failed:', error);
    throw error;
  }
};
