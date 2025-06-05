
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { datasetsTable } from '../db/schema';
import { type CreateDatasetInput } from '../schema';
import { createDataset } from '../handlers/create_dataset';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateDatasetInput = {
  name: 'Test Dataset',
  description: 'A dataset for testing',
  file_type: 'csv',
  file_path: '/uploads/test-dataset.csv',
  file_size: 1024,
  columns: ['feature1', 'feature2', 'target'],
  row_count: 100,
  metadata: { source: 'test', version: '1.0' }
};

describe('createDataset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a dataset', async () => {
    const result = await createDataset(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Dataset');
    expect(result.description).toEqual(testInput.description);
    expect(result.file_type).toEqual('csv');
    expect(result.file_path).toEqual('/uploads/test-dataset.csv');
    expect(result.file_size).toEqual(1024);
    expect(result.columns).toEqual(['feature1', 'feature2', 'target']);
    expect(result.row_count).toEqual(100);
    expect(result.metadata).toEqual({ source: 'test', version: '1.0' });
    expect(result.status).toEqual('uploading'); // Default status
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save dataset to database', async () => {
    const result = await createDataset(testInput);

    // Query using proper drizzle syntax
    const datasets = await db.select()
      .from(datasetsTable)
      .where(eq(datasetsTable.id, result.id))
      .execute();

    expect(datasets).toHaveLength(1);
    expect(datasets[0].name).toEqual('Test Dataset');
    expect(datasets[0].description).toEqual(testInput.description);
    expect(datasets[0].file_type).toEqual('csv');
    expect(datasets[0].file_path).toEqual('/uploads/test-dataset.csv');
    expect(datasets[0].file_size).toEqual(1024);
    expect(datasets[0].columns).toEqual(['feature1', 'feature2', 'target']);
    expect(datasets[0].row_count).toEqual(100);
    expect(datasets[0].metadata).toEqual({ source: 'test', version: '1.0' });
    expect(datasets[0].status).toEqual('uploading');
    expect(datasets[0].created_at).toBeInstanceOf(Date);
    expect(datasets[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle null description and metadata', async () => {
    const minimalInput: CreateDatasetInput = {
      name: 'Minimal Dataset',
      description: null,
      file_type: 'json',
      file_path: '/uploads/minimal.json',
      file_size: 512,
      columns: ['id', 'value'],
      row_count: 50,
      metadata: null
    };

    const result = await createDataset(minimalInput);

    expect(result.name).toEqual('Minimal Dataset');
    expect(result.description).toBeNull();
    expect(result.metadata).toBeNull();
    expect(result.file_type).toEqual('json');
    expect(result.columns).toEqual(['id', 'value']);
    expect(result.row_count).toEqual(50);
  });

  it('should handle empty columns array', async () => {
    const emptyColumnsInput: CreateDatasetInput = {
      name: 'Empty Columns Dataset',
      description: 'Dataset with no columns',
      file_type: 'csv',
      file_path: '/uploads/empty.csv',
      file_size: 100,
      columns: [],
      row_count: 0,
      metadata: null
    };

    const result = await createDataset(emptyColumnsInput);

    expect(result.columns).toEqual([]);
    expect(result.row_count).toEqual(0);
    expect(result.name).toEqual('Empty Columns Dataset');
  });
});
