
import { db } from '../db';
import { analysesTable, modelsTable, datasetsTable } from '../db/schema';
import { type CreateAnalysisInput, type Analysis } from '../schema';
import { eq } from 'drizzle-orm';

export const createAnalysis = async (input: CreateAnalysisInput): Promise<Analysis> => {
  try {
    // Verify that model exists
    const modelExists = await db.select()
      .from(modelsTable)
      .where(eq(modelsTable.id, input.model_id))
      .execute();
    
    if (modelExists.length === 0) {
      throw new Error(`Model with id ${input.model_id} not found`);
    }

    // Verify that dataset exists
    const datasetExists = await db.select()
      .from(datasetsTable)
      .where(eq(datasetsTable.id, input.dataset_id))
      .execute();
    
    if (datasetExists.length === 0) {
      throw new Error(`Dataset with id ${input.dataset_id} not found`);
    }

    // Insert analysis record
    const result = await db.insert(analysesTable)
      .values({
        name: input.name,
        model_id: input.model_id,
        dataset_id: input.dataset_id,
        analysis_type: input.analysis_type,
        parameters: input.parameters
      })
      .returning()
      .execute();

    // Convert the database result to match the Analysis schema
    const analysis = result[0];
    return {
      id: analysis.id,
      name: analysis.name,
      model_id: analysis.model_id,
      dataset_id: analysis.dataset_id,
      analysis_type: analysis.analysis_type,
      parameters: analysis.parameters as Record<string, any> | null,
      results: analysis.results as Record<string, any> | null,
      status: analysis.status,
      created_at: analysis.created_at,
      updated_at: analysis.updated_at
    };
  } catch (error) {
    console.error('Analysis creation failed:', error);
    throw error;
  }
};
