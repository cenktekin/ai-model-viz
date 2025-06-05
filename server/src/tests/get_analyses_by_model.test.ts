
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { modelsTable, datasetsTable, analysesTable } from '../db/schema';
import { type GetAnalysesByModelInput, type CreateModelInput, type CreateDatasetInput, type CreateAnalysisInput } from '../schema';
import { getAnalysesByModel } from '../handlers/get_analyses_by_model';

// Test input data
const testModelInput: CreateModelInput = {
  name: 'Test Model',
  description: 'A model for testing',
  model_type: 'traditional_ml',
  framework: 'scikit-learn',
  file_path: '/models/test_model.pkl',
  file_size: 1024,
  metadata: { accuracy: 0.95 }
};

const testDatasetInput: CreateDatasetInput = {
  name: 'Test Dataset',
  description: 'A dataset for testing',
  file_type: 'csv',
  file_path: '/datasets/test_data.csv',
  file_size: 2048,
  columns: ['feature1', 'feature2', 'target'],
  row_count: 1000,
  metadata: { source: 'test' }
};

const testAnalysisInput: CreateAnalysisInput = {
  name: 'Test Analysis',
  model_id: 1, // Will be updated with actual model ID
  dataset_id: 1, // Will be updated with actual dataset ID
  analysis_type: 'feature_importance',
  parameters: { n_features: 10 }
};

describe('getAnalysesByModel', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return analyses for a specific model', async () => {
    // Create model and dataset first
    const modelResult = await db.insert(modelsTable)
      .values(testModelInput)
      .returning()
      .execute();
    
    const datasetResult = await db.insert(datasetsTable)
      .values(testDatasetInput)
      .returning()
      .execute();

    const modelId = modelResult[0].id;
    const datasetId = datasetResult[0].id;

    // Create multiple analyses for the model
    await db.insert(analysesTable)
      .values([
        {
          ...testAnalysisInput,
          name: 'Feature Importance Analysis',
          model_id: modelId,
          dataset_id: datasetId,
          analysis_type: 'feature_importance'
        },
        {
          ...testAnalysisInput,
          name: 'Decision Path Analysis',
          model_id: modelId,
          dataset_id: datasetId,
          analysis_type: 'decision_path'
        }
      ])
      .execute();

    // Get analyses by model
    const input: GetAnalysesByModelInput = { model_id: modelId };
    const result = await getAnalysesByModel(input);

    // Verify results
    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Feature Importance Analysis');
    expect(result[0].model_id).toEqual(modelId);
    expect(result[0].dataset_id).toEqual(datasetId);
    expect(result[0].analysis_type).toEqual('feature_importance');
    expect(result[0].status).toEqual('pending');
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].name).toEqual('Decision Path Analysis');
    expect(result[1].model_id).toEqual(modelId);
    expect(result[1].analysis_type).toEqual('decision_path');
  });

  it('should return empty array when model has no analyses', async () => {
    // Create model without analyses
    const modelResult = await db.insert(modelsTable)
      .values(testModelInput)
      .returning()
      .execute();

    const modelId = modelResult[0].id;

    // Get analyses by model
    const input: GetAnalysesByModelInput = { model_id: modelId };
    const result = await getAnalysesByModel(input);

    // Should return empty array
    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent model', async () => {
    const input: GetAnalysesByModelInput = { model_id: 999 };
    const result = await getAnalysesByModel(input);

    expect(result).toHaveLength(0);
  });

  it('should only return analyses for the specified model', async () => {
    // Create two models and dataset
    const model1Result = await db.insert(modelsTable)
      .values({ ...testModelInput, name: 'Model 1' })
      .returning()
      .execute();
    
    const model2Result = await db.insert(modelsTable)
      .values({ ...testModelInput, name: 'Model 2' })
      .returning()
      .execute();
    
    const datasetResult = await db.insert(datasetsTable)
      .values(testDatasetInput)
      .returning()
      .execute();

    const model1Id = model1Result[0].id;
    const model2Id = model2Result[0].id;
    const datasetId = datasetResult[0].id;

    // Create analyses for both models
    await db.insert(analysesTable)
      .values([
        {
          ...testAnalysisInput,
          name: 'Analysis for Model 1',
          model_id: model1Id,
          dataset_id: datasetId
        },
        {
          ...testAnalysisInput,
          name: 'Analysis for Model 2',
          model_id: model2Id,
          dataset_id: datasetId
        }
      ])
      .execute();

    // Get analyses for model 1 only
    const input: GetAnalysesByModelInput = { model_id: model1Id };
    const result = await getAnalysesByModel(input);

    // Should only return analyses for model 1
    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Analysis for Model 1');
    expect(result[0].model_id).toEqual(model1Id);
  });
});
