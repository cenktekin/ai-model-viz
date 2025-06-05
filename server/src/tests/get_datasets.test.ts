
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { datasetsTable } from '../db/schema';
import { type CreateDatasetInput } from '../schema';
import { getDatasets } from '../handlers/get_datasets';

// Test dataset inputs
const testDataset1: CreateDatasetInput = {
  name: 'Sales Dataset',
  description: 'Monthly sales data',
  file_type: 'csv',
  file_path: '/data/sales.csv',
  file_size: 1024,
  columns: ['date', 'amount', 'product'],
  row_count: 500,
  metadata: { source: 'internal', version: '1.0' }
};

const testDataset2: CreateDatasetInput = {
  name: 'Customer Data',
  description: null,
  file_type: 'json',
  file_path: '/data/customers.json',
  file_size: 2048,
  columns: ['id', 'name', 'email'],
  row_count: 200,
  metadata: null
};

describe('getDatasets', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no datasets exist', async () => {
    const result = await getDatasets();
    expect(result).toEqual([]);
  });

  it('should return all datasets', async () => {
    // Create test datasets
    await db.insert(datasetsTable)
      .values([
        {
          name: testDataset1.name,
          description: testDataset1.description,
          file_type: testDataset1.file_type,
          file_path: testDataset1.file_path,
          file_size: testDataset1.file_size,
          columns: testDataset1.columns,
          row_count: testDataset1.row_count,
          metadata: testDataset1.metadata
        },
        {
          name: testDataset2.name,
          description: testDataset2.description,
          file_type: testDataset2.file_type,
          file_path: testDataset2.file_path,
          file_size: testDataset2.file_size,
          columns: testDataset2.columns,
          row_count: testDataset2.row_count,
          metadata: testDataset2.metadata
        }
      ])
      .execute();

    const result = await getDatasets();

    expect(result).toHaveLength(2);

    // Check first dataset
    const dataset1 = result.find(d => d.name === 'Sales Dataset');
    expect(dataset1).toBeDefined();
    expect(dataset1!.description).toEqual('Monthly sales data');
    expect(dataset1!.file_type).toEqual('csv');
    expect(dataset1!.file_path).toEqual('/data/sales.csv');
    expect(dataset1!.file_size).toEqual(1024);
    expect(dataset1!.columns).toEqual(['date', 'amount', 'product']);
    expect(dataset1!.row_count).toEqual(500);
    expect(dataset1!.status).toEqual('uploading');
    expect(dataset1!.metadata).toEqual({ source: 'internal', version: '1.0' });
    expect(dataset1!.id).toBeDefined();
    expect(dataset1!.created_at).toBeInstanceOf(Date);
    expect(dataset1!.updated_at).toBeInstanceOf(Date);

    // Check second dataset
    const dataset2 = result.find(d => d.name === 'Customer Data');
    expect(dataset2).toBeDefined();
    expect(dataset2!.description).toBeNull();
    expect(dataset2!.file_type).toEqual('json');
    expect(dataset2!.file_path).toEqual('/data/customers.json');
    expect(dataset2!.file_size).toEqual(2048);
    expect(dataset2!.columns).toEqual(['id', 'name', 'email']);
    expect(dataset2!.row_count).toEqual(200);
    expect(dataset2!.status).toEqual('uploading');
    expect(dataset2!.metadata).toBeNull();
  });

  it('should handle datasets with different statuses', async () => {
    // Create datasets with different statuses
    await db.insert(datasetsTable)
      .values([
        {
          ...testDataset1,
          status: 'ready'
        },
        {
          ...testDataset2,
          status: 'error'
        }
      ])
      .execute();

    const result = await getDatasets();

    expect(result).toHaveLength(2);
    expect(result.find(d => d.name === 'Sales Dataset')!.status).toEqual('ready');
    expect(result.find(d => d.name === 'Customer Data')!.status).toEqual('error');
  });

  it('should properly handle jsonb columns', async () => {
    // Create dataset with complex metadata
    const complexMetadata = {
      preprocessing: {
        cleaned: true,
        normalized: false
      },
      tags: ['finance', 'quarterly'],
      version: 2.1
    };

    await db.insert(datasetsTable)
      .values({
        ...testDataset1,
        metadata: complexMetadata
      })
      .execute();

    const result = await getDatasets();

    expect(result).toHaveLength(1);
    expect(result[0].metadata).toEqual(complexMetadata);
    expect(Array.isArray(result[0].columns)).toBe(true);
    expect(result[0].columns).toEqual(['date', 'amount', 'product']);
  });
});
