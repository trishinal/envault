import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  addLabelToKey,
  removeLabelFromKey,
  getLabelsForKey,
  getKeysByLabel,
  clearLabelsForKey,
  renameLabelKey,
  readLabels,
} from './label-hooks';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-label-'));
}

describe('label-hooks', () => {
  let dir: string;

  beforeEach(() => {
    dir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('returns empty map when no label file exists', () => {
    expect(readLabels(dir)).toEqual({});
  });

  it('adds a label to a key', () => {
    addLabelToKey(dir, 'API_KEY', 'production');
    expect(getLabelsForKey(dir, 'API_KEY')).toContain('production');
  });

  it('does not duplicate labels', () => {
    addLabelToKey(dir, 'API_KEY', 'production');
    addLabelToKey(dir, 'API_KEY', 'production');
    expect(getLabelsForKey(dir, 'API_KEY')).toHaveLength(1);
  });

  it('removes a label from a key', () => {
    addLabelToKey(dir, 'API_KEY', 'staging');
    removeLabelFromKey(dir, 'API_KEY', 'staging');
    expect(getLabelsForKey(dir, 'API_KEY')).not.toContain('staging');
  });

  it('cleans up empty label arrays on removal', () => {
    addLabelToKey(dir, 'API_KEY', 'staging');
    removeLabelFromKey(dir, 'API_KEY', 'staging');
    expect(readLabels(dir)['API_KEY']).toBeUndefined();
  });

  it('gets keys by label', () => {
    addLabelToKey(dir, 'API_KEY', 'production');
    addLabelToKey(dir, 'DB_URL', 'production');
    addLabelToKey(dir, 'SECRET', 'staging');
    expect(getKeysByLabel(dir, 'production').sort()).toEqual(['API_KEY', 'DB_URL']);
  });

  it('clears all labels for a key', () => {
    addLabelToKey(dir, 'API_KEY', 'production');
    addLabelToKey(dir, 'API_KEY', 'staging');
    clearLabelsForKey(dir, 'API_KEY');
    expect(getLabelsForKey(dir, 'API_KEY')).toEqual([]);
  });

  it('renames a label key', () => {
    addLabelToKey(dir, 'OLD_KEY', 'production');
    renameLabelKey(dir, 'OLD_KEY', 'NEW_KEY');
    expect(getLabelsForKey(dir, 'NEW_KEY')).toContain('production');
    expect(getLabelsForKey(dir, 'OLD_KEY')).toEqual([]);
  });
});
