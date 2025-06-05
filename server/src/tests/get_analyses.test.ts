
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { modelsTable, datasetsTable, analysesTable } from '../db/schema';
import { type CreateModelInput, type CreateDatasetInput, type CreateAnalysisInput } from '../schema';
import { getAnalyses } from '../handlers/get_analyses';

// Test data
const testModel: CreateModelInput = {
  name: 'Test Model',
  description: 'A model for testing',
  model_type: 'traditional_ml',
  framework: 'scikit-learn',
  file_path: '/models/test_model.pkl',
  file_size: 1024,
  metadata: { accuracy: 0.95 }
};

const testDataset: CreateDatasetInput = {
  name: 'Test Dataset',
  description: 'A dataset for testing',
  file_type: 'csv',
  file_path: '/datasets/test_data.csv',
  file_size: 2048,
  columns: ['feature1', 'feature2', 'target'],
  row_count: 1000,
  metadata: { source: 'test' }
};

const testAnalysis: CreateAnalysisInput = {
  name: 'Test Analysis',
  model_id: 1,
  dataset_id: 1,
  analysis_type: 'feature_importance',
  parameters: { max_features: 10 }
};

describe('getAnalyses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no analyses exist', async () => {
    const result = await getAnalyses();
    
    expect(result).toEqual([]);
  });

  it('should return all analyses', async () => {
    // Create prerequisite model and dataset
    const modelResult = await db.insert(modelsTable)
      .values({
        name: testModel.name,
        description: testModel.description,
        model_type: testModel.model_type,
        framework: testModel.framework,
        file_path: testModel.file_path,
        file_size: testModel.file_size,
        metadata: testModel.metadata
      })
      .returning()
      .execute();

    const datasetResult = await db.insert(datasetsTable)
      .values({
        name: testDataset.name,
        description: testDataset.description,
        file_type: testDataset.file_type,
        file_path: testDataset.file_path,
        file_size: testDataset.file_size,
        columns: testDataset.columns,
        row_count: testDataset.row_count,
        metadata: testDataset.metadata
      })
      .returning()
      .execute();

    // Create test analysis
    await db.insert(analysesTable)
      .values({
        name: testAnalysis.name,
        model_id: modelResult[0].id,
        dataset_id: datasetResult[0].id,
        analysis_type: testAnalysis.analysis_type,
        parameters: testAnalysis.parameters
      })
      .execute();

    const result = await getAnalyses();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Test Analysis');
    expect(result[0].model_id).toEqual(modelResult[0].id);
    expect(result[0].dataset_id).toEqual(datasetResult[0].id);
    expect(result[0].analysis_type).toEqual('feature_importance');
    expect(result[0].status).toEqual('pending');
    expect(result[0].parameters).toEqual({ max_features: 10 });
    expect(result[0].results).toBeNull();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return multiple analyses', async () => {
    // Create prerequisite model and dataset
    const modelResult = await db.insert(modelsTable)
      .values({
        name: testModel.name,
        description: testModel.description,
        model_type: testModel.model_type,
        framework: testModel.framework,
        file_path: testModel.file_path,
        file_size: testModel.file_size,
        metadata: testModel.metadata
      })
      .returning()
      .execute();

    const datasetResult = await db.insert(datasetsTable)
      .values({
        name: testDataset.name,
        description: testDataset.description,
        file_type: testDataset.file_type,
        file_path: testDataset.file_path,
        file_size: testDataset.file_size,
        columns: testDataset.columns,
        row_count: testDataset.row_count,
        metadata: testDataset.metadata
      })
      .returning()
      .execute();

    // Create multiple test analyses
    await db.insert(analysesTable)
      .values([
        {
          name: 'Feature Analysis',
          model_id: modelResult[0].id,
          dataset_id: datasetResult[0].id,
          analysis_type: 'feature_importance',
          parameters: { max_features: 5 }
        },
        {
          name: 'Bias Analysis',
          model_id: modelResult[0].id,
          dataset_id: datasetResult[0].id,
          analysis_type: 'bias_detection',
          parameters: { threshold: 0.1 }
        }
      ])
      .execute();

    const result = await getAnalyses();

    expect(result).toHaveLength(2);
    
    const featureAnalysis = result.find(a => a.name === 'Feature Analysis');
    const biasAnalysis = result.find(a => a.name === 'Bias Analysis');
    
    expect(featureAnalysis).toBeDefined();
    expect(featureAnalysis?.analysis_type).toEqual('feature_importance');
    expect(featureAnalysis?.parameters).toEqual({ max_features: 5 });
    
    expect(biasAnalysis).toBeDefined();
    expect(biasAnalysis?.analysis_type).toEqual('bias_detection');
    expect(biasAnalysis?.parameters).toEqual({ threshold: 0.1 });
  });
});
