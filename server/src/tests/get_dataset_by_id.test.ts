
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { datasetsTable } from '../db/schema';
import { type CreateDatasetInput } from '../schema';
import { getDatasetById } from '../handlers/get_dataset_by_id';

// Test dataset input
const testDatasetInput: CreateDatasetInput = {
  name: 'Test Dataset',
  description: 'A dataset for testing',
  file_type: 'csv',
  file_path: '/path/to/test.csv',
  file_size: 1024,
  columns: ['id', 'name', 'age', 'email'],
  row_count: 100,
  metadata: { source: 'test', version: '1.0' }
};

describe('getDatasetById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return dataset when it exists', async () => {
    // Create test dataset
    const insertResult = await db.insert(datasetsTable)
      .values({
        ...testDatasetInput,
        columns: testDatasetInput.columns, // JSONB field
        metadata: testDatasetInput.metadata // JSONB field
      })
      .returning()
      .execute();

    const datasetId = insertResult[0].id;

    // Retrieve dataset
    const result = await getDatasetById(datasetId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(datasetId);
    expect(result!.name).toEqual('Test Dataset');
    expect(result!.description).toEqual('A dataset for testing');
    expect(result!.file_type).toEqual('csv');
    expect(result!.file_path).toEqual('/path/to/test.csv');
    expect(result!.file_size).toEqual(1024);
    expect(result!.columns).toEqual(['id', 'name', 'age', 'email']);
    expect(result!.row_count).toEqual(100);
    expect(result!.status).toEqual('uploading'); // Default status
    expect(result!.metadata).toEqual({ source: 'test', version: '1.0' });
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when dataset does not exist', async () => {
    const result = await getDatasetById(999);
    expect(result).toBeNull();
  });

  it('should handle dataset with null description and metadata', async () => {
    // Create dataset with null optional fields
    const insertResult = await db.insert(datasetsTable)
      .values({
        name: 'Minimal Dataset',
        description: null,
        file_type: 'json',
        file_path: '/path/to/minimal.json',
        file_size: 512,
        columns: ['field1', 'field2'],
        row_count: 50,
        metadata: null
      })
      .returning()
      .execute();

    const datasetId = insertResult[0].id;

    // Retrieve dataset
    const result = await getDatasetById(datasetId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(datasetId);
    expect(result!.name).toEqual('Minimal Dataset');
    expect(result!.description).toBeNull();
    expect(result!.file_type).toEqual('json');
    expect(result!.columns).toEqual(['field1', 'field2']);
    expect(result!.row_count).toEqual(50);
    expect(result!.metadata).toBeNull();
  });

  it('should handle different dataset statuses correctly', async () => {
    // Create dataset with 'ready' status
    const insertResult = await db.insert(datasetsTable)
      .values({
        ...testDatasetInput,
        columns: testDatasetInput.columns,
        metadata: testDatasetInput.metadata,
        status: 'ready'
      })
      .returning()
      .execute();

    const datasetId = insertResult[0].id;

    // Retrieve dataset
    const result = await getDatasetById(datasetId);

    expect(result).not.toBeNull();
    expect(result!.status).toEqual('ready');
    expect(result!.columns).toEqual(['id', 'name', 'age', 'email']);
    expect(typeof result!.columns).toBe('object');
    expect(Array.isArray(result!.columns)).toBe(true);
  });
});
