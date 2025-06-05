
import { db } from '../db';
import { modelsTable } from '../db/schema';
import { type CreateModelInput, type Model } from '../schema';

export const createModel = async (input: CreateModelInput): Promise<Model> => {
  try {
    // Insert model record
    const result = await db.insert(modelsTable)
      .values({
        name: input.name,
        description: input.description,
        model_type: input.model_type,
        framework: input.framework,
        file_path: input.file_path,
        file_size: input.file_size,
        metadata: input.metadata
      })
      .returning()
      .execute();

    // Convert the database result to match the schema type
    const model = result[0];
    return {
      ...model,
      metadata: model.metadata as Record<string, any> | null
    };
  } catch (error) {
    console.error('Model creation failed:', error);
    throw error;
  }
};
