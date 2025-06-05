
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { datasetsTable } from '../db/schema';
import { type CreateDatasetInput, type UpdateDatasetStatusInput } from '../schema';
import { updateDatasetStatus } from '../handlers/update_dataset_status';
import { eq } from 'drizzle-orm';

// Test data
const testDataset: CreateDatasetInput = {
  name: 'Test Dataset',
  description: 'A dataset for testing',
  file_type: 'csv',
  file_path: '/path/to/test.csv',
  file_size: 1024,
  columns: ['col1', 'col2', 'col3'],
  row_count: 100,
  metadata: { source: 'test' }
};

describe('updateDatasetStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update dataset status', async () => {
    // Create test dataset
    const created = await db.insert(datasetsTable)
      .values({
        ...testDataset,
        columns: testDataset.columns,
        status: 'uploading'
      })
      .returning()
      .execute();

    const datasetId = created[0].id;

    const updateInput: UpdateDatasetStatusInput = {
      id: datasetId,
      status: 'ready'
    };

    const result = await updateDatasetStatus(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(datasetId);
    expect(result.status).toEqual('ready');
    expect(result.name).toEqual('Test Dataset');
    expect(result.columns).toEqual(['col1', 'col2', 'col3']);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update dataset status with metadata', async () => {
    // Create test dataset
    const created = await db.insert(datasetsTable)
      .values({
        ...testDataset,
        columns: testDataset.columns,
        status: 'processing'
      })
      .returning()
      .execute();

    const datasetId = created[0].id;

    const updateInput: UpdateDatasetStatusInput = {
      id: datasetId,
      status: 'error',
      metadata: { error_message: 'File corrupted', processed_rows: 50 }
    };

    const result = await updateDatasetStatus(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(datasetId);
    expect(result.status).toEqual('error');
    expect(result.metadata).toEqual({ error_message: 'File corrupted', processed_rows: 50 });
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated dataset to database', async () => {
    // Create test dataset
    const created = await db.insert(datasetsTable)
      .values({
        ...testDataset,
        columns: testDataset.columns,
        status: 'uploading'
      })
      .returning()
      .execute();

    const datasetId = created[0].id;

    const updateInput: UpdateDatasetStatusInput = {
      id: datasetId,
      status: 'ready',
      metadata: { processing_time: 120 }
    };

    await updateDatasetStatus(updateInput);

    // Query database to verify update
    const datasets = await db.select()
      .from(datasetsTable)
      .where(eq(datasetsTable.id, datasetId))
      .execute();

    expect(datasets).toHaveLength(1);
    expect(datasets[0].status).toEqual('ready');
    expect(datasets[0].metadata).toEqual({ processing_time: 120 });
    expect(datasets[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent dataset', async () => {
    const updateInput: UpdateDatasetStatusInput = {
      id: 99999,
      status: 'ready'
    };

    await expect(updateDatasetStatus(updateInput)).rejects.toThrow(/dataset with id 99999 not found/i);
  });

  it('should handle null metadata update', async () => {
    // Create test dataset with existing metadata
    const created = await db.insert(datasetsTable)
      .values({
        ...testDataset,
        columns: testDataset.columns,
        status: 'uploading',
        metadata: { initial: 'data' }
      })
      .returning()
      .execute();

    const datasetId = created[0].id;

    const updateInput: UpdateDatasetStatusInput = {
      id: datasetId,
      status: 'ready',
      metadata: null
    };

    const result = await updateDatasetStatus(updateInput);

    // Verify metadata was set to null
    expect(result.metadata).toBeNull();
    expect(result.status).toEqual('ready');
  });
});
