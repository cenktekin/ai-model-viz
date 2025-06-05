
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { analysesTable, modelsTable, datasetsTable } from '../db/schema';
import { type CreateAnalysisInput } from '../schema';
import { createAnalysis } from '../handlers/create_analysis';
import { eq } from 'drizzle-orm';

describe('createAnalysis', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an analysis', async () => {
    // Create prerequisite model
    const modelResult = await db.insert(modelsTable)
      .values({
        name: 'Test Model',
        description: 'A test model',
        model_type: 'traditional_ml',
        framework: 'scikit-learn',
        file_path: '/path/to/model.pkl',
        file_size: 1024,
        metadata: null
      })
      .returning()
      .execute();

    // Create prerequisite dataset
    const datasetResult = await db.insert(datasetsTable)
      .values({
        name: 'Test Dataset',
        description: 'A test dataset',
        file_type: 'csv',
        file_path: '/path/to/data.csv',
        file_size: 2048,
        columns: ['col1', 'col2'],
        row_count: 100,
        metadata: null
      })
      .returning()
      .execute();

    const testInput: CreateAnalysisInput = {
      name: 'Feature Importance Analysis',
      model_id: modelResult[0].id,
      dataset_id: datasetResult[0].id,
      analysis_type: 'feature_importance',
      parameters: { max_features: 10 }
    };

    const result = await createAnalysis(testInput);

    // Basic field validation
    expect(result.name).toEqual('Feature Importance Analysis');
    expect(result.model_id).toEqual(modelResult[0].id);
    expect(result.dataset_id).toEqual(datasetResult[0].id);
    expect(result.analysis_type).toEqual('feature_importance');
    expect(result.parameters).toEqual({ max_features: 10 });
    expect(result.status).toEqual('pending');
    expect(result.results).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save analysis to database', async () => {
    // Create prerequisite model
    const modelResult = await db.insert(modelsTable)
      .values({
        name: 'Test Model',
        description: null,
        model_type: 'deep_learning',
        framework: 'tensorflow',
        file_path: '/path/to/model.h5',
        file_size: 5120,
        metadata: null
      })
      .returning()
      .execute();

    // Create prerequisite dataset
    const datasetResult = await db.insert(datasetsTable)
      .values({
        name: 'Test Dataset',
        description: null,
        file_type: 'json',
        file_path: '/path/to/data.json',
        file_size: 1536,
        columns: ['feature1', 'feature2', 'target'],
        row_count: 500,
        metadata: null
      })
      .returning()
      .execute();

    const testInput: CreateAnalysisInput = {
      name: 'Bias Detection Analysis',
      model_id: modelResult[0].id,
      dataset_id: datasetResult[0].id,
      analysis_type: 'bias_detection',
      parameters: null
    };

    const result = await createAnalysis(testInput);

    // Query database to verify save
    const analyses = await db.select()
      .from(analysesTable)
      .where(eq(analysesTable.id, result.id))
      .execute();

    expect(analyses).toHaveLength(1);
    expect(analyses[0].name).toEqual('Bias Detection Analysis');
    expect(analyses[0].model_id).toEqual(modelResult[0].id);
    expect(analyses[0].dataset_id).toEqual(datasetResult[0].id);
    expect(analyses[0].analysis_type).toEqual('bias_detection');
    expect(analyses[0].parameters).toBeNull();
    expect(analyses[0].status).toEqual('pending');
    expect(analyses[0].created_at).toBeInstanceOf(Date);
    expect(analyses[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when model does not exist', async () => {
    // Create prerequisite dataset
    const datasetResult = await db.insert(datasetsTable)
      .values({
        name: 'Test Dataset',
        description: null,
        file_type: 'csv',
        file_path: '/path/to/data.csv',
        file_size: 1024,
        columns: ['col1'],
        row_count: 50,
        metadata: null
      })
      .returning()
      .execute();

    const testInput: CreateAnalysisInput = {
      name: 'Test Analysis',
      model_id: 999, // Non-existent model ID
      dataset_id: datasetResult[0].id,
      analysis_type: 'decision_path',
      parameters: null
    };

    await expect(createAnalysis(testInput)).rejects.toThrow(/model with id 999 not found/i);
  });

  it('should throw error when dataset does not exist', async () => {
    // Create prerequisite model
    const modelResult = await db.insert(modelsTable)
      .values({
        name: 'Test Model',
        description: null,
        model_type: 'traditional_ml',
        framework: 'pytorch',
        file_path: '/path/to/model.pth',
        file_size: 2048,
        metadata: null
      })
      .returning()
      .execute();

    const testInput: CreateAnalysisInput = {
      name: 'Test Analysis',
      model_id: modelResult[0].id,
      dataset_id: 999, // Non-existent dataset ID
      analysis_type: 'input_output_relationship',
      parameters: { threshold: 0.5 }
    };

    await expect(createAnalysis(testInput)).rejects.toThrow(/dataset with id 999 not found/i);
  });
});
