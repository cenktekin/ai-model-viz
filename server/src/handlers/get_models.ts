
import { db } from '../db';
import { modelsTable } from '../db/schema';
import { type Model } from '../schema';

export const getModels = async (): Promise<Model[]> => {
  try {
    const results = await db.select()
      .from(modelsTable)
      .execute();

    return results.map(model => ({
      ...model,
      metadata: model.metadata as Record<string, any> | null
    }));
  } catch (error) {
    console.error('Get models failed:', error);
    throw error;
  }
};
