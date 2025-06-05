
import { db } from '../db';
import { datasetsTable } from '../db/schema';
import { type CreateDatasetInput, type Dataset } from '../schema';

export const createDataset = async (input: CreateDatasetInput): Promise<Dataset> => {
  try {
    // Insert dataset record
    const result = await db.insert(datasetsTable)
      .values({
        name: input.name,
        description: input.description,
        file_type: input.file_type,
        file_path: input.file_path,
        file_size: input.file_size,
        columns: input.columns, // JSONB column - no conversion needed
        row_count: input.row_count,
        metadata: input.metadata
      })
      .returning()
      .execute();

    const dataset = result[0];
    return {
      ...dataset,
      columns: dataset.columns as string[], // Cast JSONB back to string array
      metadata: dataset.metadata as Record<string, any> | null // Cast JSONB metadata
    };
  } catch (error) {
    console.error('Dataset creation failed:', error);
    throw error;
  }
};
