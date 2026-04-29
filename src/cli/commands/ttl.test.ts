import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, it, expect, beforeEach } from 'vitest';
import { getTtlFilePath, readTtl, writeTtl, isTtlExpired, pruneTtl, TtlMap } from './ttl';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-ttl-'));
}

describe('getTtlFilePath', () => {
  it('returns .ttl.json inside vault dir', () => {
    expect(getTtlFilePath('/some/dir')).toBe('/some/dir/.ttl.json');
  });
});

describe('readTtl', () => {
  it('returns empty object when file does not exist', () => {
    const dir = makeTempDir();
    expect(readTtl(dir)).toEqual({});
  });

  it('reads existing ttl file', () => {
    const dir = makeTempDir();
    const data: TtlMap = { FOO: Date.now() + 10000 };
    fs.writeFileSync(getTtlFilePath(dir), JSON.stringify(data));
    expect(readTtl(dir)).toEqual(data);
  });
});

describe('writeTtl', () => {
  it('writes ttl map to file', () => {
    const dir = makeTempDir();
    const data: TtlMap = { BAR: Date.now() + 5000 };
    writeTtl(dir, data);
    const read = JSON.parse(fs.readFileSync(getTtlFilePath(dir), 'utf-8'));
    expect(read).toEqual(data);
  });
});

describe('isTtlExpired', () => {
  it('returns false when key has no TTL', () => {
    expect(isTtlExpired({}, 'MISSING')).toBe(false);
  });

  it('returns false when TTL is in the future', () => {
    const ttl: TtlMap = { KEY: Date.now() + 60000 };
    expect(isTtlExpired(ttl, 'KEY')).toBe(false);
  });

  it('returns true when TTL is in the past', () => {
    const ttl: TtlMap = { KEY: Date.now() - 1000 };
    expect(isTtlExpired(ttl, 'KEY')).toBe(true);
  });
});

describe('pruneTtl', () => {
  it('returns only expired keys', () => {
    const ttl: TtlMap = {
      ALIVE: Date.now() + 60000,
      DEAD1: Date.now() - 1000,
      DEAD2: Date.now() - 5000,
    };
    const expired = pruneTtl(ttl);
    expect(expired).toContain('DEAD1');
    expect(expired).toContain('DEAD2');
    expect(expired).not.toContain('ALIVE');
  });

  it('returns empty array when nothing expired', () => {
    const ttl: TtlMap = { ALIVE: Date.now() + 60000 };
    expect(pruneTtl(ttl)).toEqual([]);
  });

  it('returns empty array for empty map', () => {
    expect(pruneTtl({})).toEqual([]);
  });
});
