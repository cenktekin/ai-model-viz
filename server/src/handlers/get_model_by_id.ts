
import { db } from '../db';
import { modelsTable } from '../db/schema';
import { type Model } from '../schema';
import { eq } from 'drizzle-orm';

export const getModelById = async (id: number): Promise<Model | null> => {
  try {
    const results = await db.select()
      .from(modelsTable)
      .where(eq(modelsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const model = results[0];
    return {
      ...model,
      // Convert jsonb fields to proper types
      metadata: model.metadata as Record<string, any> | null
    };
  } catch (error) {
    console.error('Failed to get model by id:', error);
    throw error;
  }
};
