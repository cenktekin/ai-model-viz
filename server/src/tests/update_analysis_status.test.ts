
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { modelsTable, datasetsTable, analysesTable } from '../db/schema';
import { type UpdateAnalysisStatusInput } from '../schema';
import { updateAnalysisStatus } from '../handlers/update_analysis_status';
import { eq } from 'drizzle-orm';

describe('updateAnalysisStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let modelId: number;
  let datasetId: number;
  let analysisId: number;

  beforeEach(async () => {
    // Create prerequisite model
    const modelResult = await db.insert(modelsTable)
      .values({
        name: 'Test Model',
        description: 'A model for testing',
        model_type: 'traditional_ml',
        framework: 'scikit-learn',
        file_path: '/path/to/model.pkl',
        file_size: 1024,
        status: 'ready',
        metadata: null
      })
      .returning()
      .execute();
    modelId = modelResult[0].id;

    // Create prerequisite dataset
    const datasetResult = await db.insert(datasetsTable)
      .values({
        name: 'Test Dataset',
        description: 'A dataset for testing',
        file_type: 'csv',
        file_path: '/path/to/data.csv',
        file_size: 2048,
        columns: ['feature1', 'feature2', 'target'],
        row_count: 1000,
        status: 'ready',
        metadata: null
      })
      .returning()
      .execute();
    datasetId = datasetResult[0].id;

    // Create analysis to update
    const analysisResult = await db.insert(analysesTable)
      .values({
        name: 'Test Analysis',
        model_id: modelId,
        dataset_id: datasetId,
        analysis_type: 'feature_importance',
        parameters: { max_features: 10 },
        results: null,
        status: 'pending'
      })
      .returning()
      .execute();
    analysisId = analysisResult[0].id;
  });

  it('should update analysis status', async () => {
    const input: UpdateAnalysisStatusInput = {
      id: analysisId,
      status: 'running'
    };

    const result = await updateAnalysisStatus(input);

    expect(result.id).toEqual(analysisId);
    expect(result.status).toEqual('running');
    expect(result.name).toEqual('Test Analysis');
    expect(result.model_id).toEqual(modelId);
    expect(result.dataset_id).toEqual(datasetId);
    expect(result.analysis_type).toEqual('feature_importance');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update analysis status with results', async () => {
    const input: UpdateAnalysisStatusInput = {
      id: analysisId,
      status: 'completed',
      results: {
        feature_scores: [0.8, 0.6, 0.4],
        feature_names: ['feature1', 'feature2', 'feature3']
      }
    };

    const result = await updateAnalysisStatus(input);

    expect(result.id).toEqual(analysisId);
    expect(result.status).toEqual('completed');
    expect(result.results).toEqual({
      feature_scores: [0.8, 0.6, 0.4],
      feature_names: ['feature1', 'feature2', 'feature3']
    });
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated analysis to database', async () => {
    const input: UpdateAnalysisStatusInput = {
      id: analysisId,
      status: 'failed'
    };

    await updateAnalysisStatus(input);

    const analyses = await db.select()
      .from(analysesTable)
      .where(eq(analysesTable.id, analysisId))
      .execute();

    expect(analyses).toHaveLength(1);
    expect(analyses[0].status).toEqual('failed');
    expect(analyses[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent analysis', async () => {
    const input: UpdateAnalysisStatusInput = {
      id: 99999,
      status: 'running'
    };

    expect(updateAnalysisStatus(input)).rejects.toThrow(/not found/i);
  });

  it('should update analysis to completed with complex results', async () => {
    const input: UpdateAnalysisStatusInput = {
      id: analysisId,
      status: 'completed',
      results: {
        accuracy: 0.95,
        precision: 0.92,
        recall: 0.88,
        feature_importance: {
          feature1: 0.45,
          feature2: 0.35,
          feature3: 0.20
        },
        confusion_matrix: [[80, 5], [10, 85]]
      }
    };

    const result = await updateAnalysisStatus(input);

    expect(result.status).toEqual('completed');
    expect(result.results).toEqual({
      accuracy: 0.95,
      precision: 0.92,
      recall: 0.88,
      feature_importance: {
        feature1: 0.45,
        feature2: 0.35,
        feature3: 0.20
      },
      confusion_matrix: [[80, 5], [10, 85]]
    });
  });
});
