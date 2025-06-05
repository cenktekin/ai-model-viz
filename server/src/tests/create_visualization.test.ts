
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { visualizationsTable, modelsTable, datasetsTable, analysesTable } from '../db/schema';
import { type CreateVisualizationInput } from '../schema';
import { createVisualization } from '../handlers/create_visualization';
import { eq } from 'drizzle-orm';

describe('createVisualization', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a visualization', async () => {
    // Create prerequisite model
    const modelResult = await db.insert(modelsTable)
      .values({
        name: 'Test Model',
        description: 'A test model',
        model_type: 'traditional_ml',
        framework: 'scikit-learn',
        file_path: '/path/to/model.pkl',
        file_size: 1024
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
        columns: ['feature1', 'feature2', 'target'],
        row_count: 100
      })
      .returning()
      .execute();

    // Create prerequisite analysis
    const analysisResult = await db.insert(analysesTable)
      .values({
        name: 'Test Analysis',
        model_id: modelResult[0].id,
        dataset_id: datasetResult[0].id,
        analysis_type: 'feature_importance'
      })
      .returning()
      .execute();

    const testInput: CreateVisualizationInput = {
      analysis_id: analysisResult[0].id,
      chart_type: 'bar_chart',
      config: {
        title: 'Feature Importance',
        x_axis: 'Features',
        y_axis: 'Importance'
      },
      data: {
        features: ['feature1', 'feature2'],
        importance: [0.8, 0.6]
      }
    };

    const result = await createVisualization(testInput);

    expect(result.analysis_id).toEqual(analysisResult[0].id);
    expect(result.chart_type).toEqual('bar_chart');
    expect(result.config).toEqual({
      title: 'Feature Importance',
      x_axis: 'Features',
      y_axis: 'Importance'
    });
    expect(result.data).toEqual({
      features: ['feature1', 'feature2'],
      importance: [0.8, 0.6]
    });
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save visualization to database', async () => {
    // Create prerequisite model
    const modelResult = await db.insert(modelsTable)
      .values({
        name: 'Test Model',
        description: 'A test model',
        model_type: 'deep_learning',
        framework: 'tensorflow',
        file_path: '/path/to/model.h5',
        file_size: 5120
      })
      .returning()
      .execute();

    // Create prerequisite dataset
    const datasetResult = await db.insert(datasetsTable)
      .values({
        name: 'Test Dataset',
        description: 'A test dataset',
        file_type: 'json',
        file_path: '/path/to/data.json',
        file_size: 3072,
        columns: ['input1', 'input2', 'output'],
        row_count: 500
      })
      .returning()
      .execute();

    // Create prerequisite analysis
    const analysisResult = await db.insert(analysesTable)
      .values({
        name: 'Bias Detection Analysis',
        model_id: modelResult[0].id,
        dataset_id: datasetResult[0].id,
        analysis_type: 'bias_detection'
      })
      .returning()
      .execute();

    const testInput: CreateVisualizationInput = {
      analysis_id: analysisResult[0].id,
      chart_type: 'heatmap',
      config: {
        title: 'Bias Detection Heatmap',
        colormap: 'viridis'
      },
      data: {
        matrix: [[0.1, 0.2], [0.3, 0.4]],
        labels: ['group1', 'group2']
      }
    };

    const result = await createVisualization(testInput);

    const visualizations = await db.select()
      .from(visualizationsTable)
      .where(eq(visualizationsTable.id, result.id))
      .execute();

    expect(visualizations).toHaveLength(1);
    expect(visualizations[0].analysis_id).toEqual(analysisResult[0].id);
    expect(visualizations[0].chart_type).toEqual('heatmap');
    expect(visualizations[0].config).toEqual({
      title: 'Bias Detection Heatmap',
      colormap: 'viridis'
    });
    expect(visualizations[0].data).toEqual({
      matrix: [[0.1, 0.2], [0.3, 0.4]],
      labels: ['group1', 'group2']
    });
    expect(visualizations[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle complex visualization data structures', async () => {
    // Create prerequisite model
    const modelResult = await db.insert(modelsTable)
      .values({
        name: 'Complex Model',
        description: 'A complex model',
        model_type: 'traditional_ml',
        framework: 'pytorch',
        file_path: '/path/to/complex_model.pth',
        file_size: 8192
      })
      .returning()
      .execute();

    // Create prerequisite dataset
    const datasetResult = await db.insert(datasetsTable)
      .values({
        name: 'Complex Dataset',
        description: 'A complex dataset',
        file_type: 'csv',
        file_path: '/path/to/complex_data.csv',
        file_size: 10240,
        columns: ['feature1', 'feature2', 'feature3', 'target'],
        row_count: 1000
      })
      .returning()
      .execute();

    // Create prerequisite analysis
    const analysisResult = await db.insert(analysesTable)
      .values({
        name: 'Decision Path Analysis',
        model_id: modelResult[0].id,
        dataset_id: datasetResult[0].id,
        analysis_type: 'decision_path'
      })
      .returning()
      .execute();

    const testInput: CreateVisualizationInput = {
      analysis_id: analysisResult[0].id,
      chart_type: 'decision_tree',
      config: {
        title: 'Decision Tree Visualization',
        max_depth: 5,
        node_size: 'medium',
        edge_labels: true
      },
      data: {
        nodes: [
          { id: 1, feature: 'feature1', threshold: 0.5, samples: 1000 },
          { id: 2, feature: 'feature2', threshold: 0.3, samples: 600 },
          { id: 3, feature: 'feature3', threshold: 0.7, samples: 400 }
        ],
        edges: [
          { from: 1, to: 2, condition: 'left' },
          { from: 1, to: 3, condition: 'right' }
        ]
      }
    };

    const result = await createVisualization(testInput);

    expect(result.chart_type).toEqual('decision_tree');
    expect(result.config).toEqual({
      title: 'Decision Tree Visualization',
      max_depth: 5,
      node_size: 'medium',
      edge_labels: true
    });
    expect(result.data['nodes']).toHaveLength(3);
    expect(result.data['edges']).toHaveLength(2);
    expect(result.data['nodes'][0]).toEqual({
      id: 1,
      feature: 'feature1',
      threshold: 0.5,
      samples: 1000
    });
  });
});
