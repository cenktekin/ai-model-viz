
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { modelsTable, datasetsTable, analysesTable } from '../db/schema';
import { getAnalysisById } from '../handlers/get_analysis_by_id';

// Test data setup
const testModel = {
  name: 'Test Model',
  description: 'A model for testing',
  model_type: 'traditional_ml' as const,
  framework: 'scikit-learn',
  file_path: '/models/test-model.pkl',
  file_size: 1024,
  metadata: { accuracy: 0.95 }
};

const testDataset = {
  name: 'Test Dataset',
  description: 'A dataset for testing',
  file_type: 'csv' as const,
  file_path: '/datasets/test-data.csv',
  file_size: 2048,
  columns: ['feature1', 'feature2', 'target'],
  row_count: 1000,
  metadata: { source: 'synthetic' }
};

describe('getAnalysisById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return analysis by id', async () => {
    // Create prerequisite model
    const modelResult = await db.insert(modelsTable)
      .values(testModel)
      .returning()
      .execute();
    const modelId = modelResult[0].id;

    // Create prerequisite dataset
    const datasetResult = await db.insert(datasetsTable)
      .values(testDataset)
      .returning()
      .execute();
    const datasetId = datasetResult[0].id;

    // Create test analysis
    const analysisData = {
      name: 'Feature Importance Analysis',
      model_id: modelId,
      dataset_id: datasetId,
      analysis_type: 'feature_importance' as const,
      parameters: { max_features: 10 },
      results: { importance_scores: [0.5, 0.3, 0.2] },
      status: 'completed' as const
    };

    const insertResult = await db.insert(analysesTable)
      .values(analysisData)
      .returning()
      .execute();
    const analysisId = insertResult[0].id;

    // Test retrieval
    const result = await getAnalysisById(analysisId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(analysisId);
    expect(result!.name).toEqual('Feature Importance Analysis');
    expect(result!.model_id).toEqual(modelId);
    expect(result!.dataset_id).toEqual(datasetId);
    expect(result!.analysis_type).toEqual('feature_importance');
    expect(result!.parameters).toEqual({ max_features: 10 });
    expect(result!.results).toEqual({ importance_scores: [0.5, 0.3, 0.2] });
    expect(result!.status).toEqual('completed');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent analysis', async () => {
    const result = await getAnalysisById(999);
    expect(result).toBeNull();
  });

  it('should handle analysis with null optional fields', async () => {
    // Create prerequisite model
    const modelResult = await db.insert(modelsTable)
      .values(testModel)
      .returning()
      .execute();
    const modelId = modelResult[0].id;

    // Create prerequisite dataset
    const datasetResult = await db.insert(datasetsTable)
      .values(testDataset)
      .returning()
      .execute();
    const datasetId = datasetResult[0].id;

    // Create analysis with minimal data (null optional fields)
    const analysisData = {
      name: 'Minimal Analysis',
      model_id: modelId,
      dataset_id: datasetId,
      analysis_type: 'bias_detection' as const,
      parameters: null,
      results: null
    };

    const insertResult = await db.insert(analysesTable)
      .values(analysisData)
      .returning()
      .execute();
    const analysisId = insertResult[0].id;

    // Test retrieval
    const result = await getAnalysisById(analysisId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(analysisId);
    expect(result!.name).toEqual('Minimal Analysis');
    expect(result!.parameters).toBeNull();
    expect(result!.results).toBeNull();
    expect(result!.status).toEqual('pending'); // Default status
  });
});
