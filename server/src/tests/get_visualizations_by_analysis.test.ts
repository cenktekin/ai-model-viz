
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { modelsTable, datasetsTable, analysesTable, visualizationsTable } from '../db/schema';
import { type GetVisualizationsByAnalysisInput } from '../schema';
import { getVisualizationsByAnalysis } from '../handlers/get_visualizations_by_analysis';

describe('getVisualizationsByAnalysis', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get visualizations by analysis ID', async () => {
    // Create model
    const [model] = await db.insert(modelsTable)
      .values({
        name: 'Test Model',
        description: 'Test model description',
        model_type: 'traditional_ml',
        framework: 'scikit-learn',
        file_path: '/path/to/model',
        file_size: 1024,
        status: 'ready'
      })
      .returning()
      .execute();

    // Create dataset
    const [dataset] = await db.insert(datasetsTable)
      .values({
        name: 'Test Dataset',
        description: 'Test dataset description',
        file_type: 'csv',
        file_path: '/path/to/dataset',
        file_size: 2048,
        columns: ['col1', 'col2'],
        row_count: 100,
        status: 'ready'
      })
      .returning()
      .execute();

    // Create analysis
    const [analysis] = await db.insert(analysesTable)
      .values({
        name: 'Test Analysis',
        model_id: model.id,
        dataset_id: dataset.id,
        analysis_type: 'feature_importance',
        status: 'completed'
      })
      .returning()
      .execute();

    // Create visualizations
    const [visualization1] = await db.insert(visualizationsTable)
      .values({
        analysis_id: analysis.id,
        chart_type: 'bar_chart',
        config: { title: 'Feature Importance' },
        data: { features: ['f1', 'f2'], values: [0.8, 0.6] }
      })
      .returning()
      .execute();

    const [visualization2] = await db.insert(visualizationsTable)
      .values({
        analysis_id: analysis.id,
        chart_type: 'heatmap',
        config: { title: 'Correlation Matrix' },
        data: { matrix: [[1, 0.5], [0.5, 1]] }
      })
      .returning()
      .execute();

    const input: GetVisualizationsByAnalysisInput = {
      analysis_id: analysis.id
    };

    const result = await getVisualizationsByAnalysis(input);

    expect(result).toHaveLength(2);
    
    const resultVisualization1 = result.find(v => v.id === visualization1.id);
    const resultVisualization2 = result.find(v => v.id === visualization2.id);

    expect(resultVisualization1).toBeDefined();
    expect(resultVisualization1!.analysis_id).toEqual(analysis.id);
    expect(resultVisualization1!.chart_type).toEqual('bar_chart');
    expect(resultVisualization1!.config).toEqual({ title: 'Feature Importance' });
    expect(resultVisualization1!.data).toEqual({ features: ['f1', 'f2'], values: [0.8, 0.6] });
    expect(resultVisualization1!.created_at).toBeInstanceOf(Date);

    expect(resultVisualization2).toBeDefined();
    expect(resultVisualization2!.analysis_id).toEqual(analysis.id);
    expect(resultVisualization2!.chart_type).toEqual('heatmap');
    expect(resultVisualization2!.config).toEqual({ title: 'Correlation Matrix' });
    expect(resultVisualization2!.data).toEqual({ matrix: [[1, 0.5], [0.5, 1]] });
    expect(resultVisualization2!.created_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no visualizations exist for analysis', async () => {
    // Create model
    const [model] = await db.insert(modelsTable)
      .values({
        name: 'Test Model',
        description: 'Test model description',
        model_type: 'traditional_ml',
        framework: 'scikit-learn',
        file_path: '/path/to/model',
        file_size: 1024,
        status: 'ready'
      })
      .returning()
      .execute();

    // Create dataset
    const [dataset] = await db.insert(datasetsTable)
      .values({
        name: 'Test Dataset',
        description: 'Test dataset description',
        file_type: 'csv',
        file_path: '/path/to/dataset',
        file_size: 2048,
        columns: ['col1', 'col2'],
        row_count: 100,
        status: 'ready'
      })
      .returning()
      .execute();

    // Create analysis without any visualizations
    const [analysis] = await db.insert(analysesTable)
      .values({
        name: 'Test Analysis',
        model_id: model.id,
        dataset_id: dataset.id,
        analysis_type: 'feature_importance',
        status: 'completed'
      })
      .returning()
      .execute();

    const input: GetVisualizationsByAnalysisInput = {
      analysis_id: analysis.id
    };

    const result = await getVisualizationsByAnalysis(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent analysis ID', async () => {
    const input: GetVisualizationsByAnalysisInput = {
      analysis_id: 999999
    };

    const result = await getVisualizationsByAnalysis(input);

    expect(result).toHaveLength(0);
  });
});
