
import { db } from '../db';
import { modelsTable } from '../db/schema';
import { type UpdateModelStatusInput, type Model } from '../schema';
import { eq } from 'drizzle-orm';

export const updateModelStatus = async (input: UpdateModelStatusInput): Promise<Model> => {
  try {
    // Build update values object
    const updateValues: any = {
      status: input.status,
      updated_at: new Date()
    };

    // Add metadata if provided
    if (input.metadata !== undefined) {
      updateValues.metadata = input.metadata;
    }

    // Update model record
    const result = await db.update(modelsTable)
      .set(updateValues)
      .where(eq(modelsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Model with id ${input.id} not found`);
    }

    // Type cast the metadata to match the schema expectation
    const model = result[0];
    return {
      ...model,
      metadata: model.metadata as Record<string, any> | null
    };
  } catch (error) {
    console.error('Model status update failed:', error);
    throw error;
  }
};
