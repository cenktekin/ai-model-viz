
import { db } from '../db';
import { datasetsTable } from '../db/schema';
import { type UpdateDatasetStatusInput, type Dataset } from '../schema';
import { eq } from 'drizzle-orm';

export const updateDatasetStatus = async (input: UpdateDatasetStatusInput): Promise<Dataset> => {
  try {
    // Build update values
    const updateValues: any = {
      status: input.status,
      updated_at: new Date()
    };

    // Include metadata if provided
    if (input.metadata !== undefined) {
      updateValues.metadata = input.metadata;
    }

    // Update dataset record
    const result = await db.update(datasetsTable)
      .set(updateValues)
      .where(eq(datasetsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Dataset with id ${input.id} not found`);
    }

    // Return the updated dataset with proper type casting
    const dataset = result[0];
    return {
      ...dataset,
      columns: dataset.columns as string[], // Cast jsonb to string array
      metadata: dataset.metadata as Record<string, any> | null // Cast jsonb to proper type
    };
  } catch (error) {
    console.error('Dataset status update failed:', error);
    throw error;
  }
};
