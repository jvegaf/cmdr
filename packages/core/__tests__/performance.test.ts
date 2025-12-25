import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseTsiFile, serializeTsiFile, type TsiFileData } from '../src/models/TsiFile';

describe('Performance Tests', () => {
  const fixturesDir = path.join(__dirname, 'fixtures');
  
  // Helper to get all devices from a TsiFile
  const getAllDevices = (tsi: TsiFileData) => [...tsi.controllerDevices, ...tsi.keyboardDevices];
  
  it('should measure performance for largest file (PIONEER_DDJ-T1_V103.tsi - 792KB)', () => {
    const filePath = path.join(fixturesDir, 'PIONEER_DDJ-T1_V103.tsi');
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Warm-up
    const warmup = parseTsiFile(content);
    serializeTsiFile(warmup);
    
    // Measure parse time (5 iterations)
    const parseTimes: number[] = [];
    let tsi: TsiFileData | undefined;
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      tsi = parseTsiFile(content);
      parseTimes.push(performance.now() - start);
    }
    
    // Measure write time (5 iterations)
    const writeTimes: number[] = [];
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      serializeTsiFile(tsi as TsiFileData);
      writeTimes.push(performance.now() - start);
    }
    
    const avgParse = parseTimes.reduce((a, b) => a + b) / parseTimes.length;
    const avgWrite = writeTimes.reduce((a, b) => a + b) / writeTimes.length;
    
    const devices = getAllDevices(tsi as TsiFileData);
    const totalMappings = devices.reduce((sum, d) => sum + (d.data.mappings?.mappings.length ?? 0), 0);
    
    console.log('\n=== Performance Test: PIONEER_DDJ-T1_V103.tsi (792KB) ===');
    console.log('Parse times (ms):', parseTimes.map(t => t.toFixed(2)).join(', '));
    console.log('Average parse time:', avgParse.toFixed(2), 'ms');
    console.log('Write times (ms):', writeTimes.map(t => t.toFixed(2)).join(', '));  
    console.log('Average write time:', avgWrite.toFixed(2), 'ms');
    console.log('Devices:', devices.length);
    console.log('Total mappings:', totalMappings);
    
    // Performance assertions (generous thresholds)
    expect(avgParse).toBeLessThan(500); // Parse should be under 500ms
    expect(avgWrite).toBeLessThan(500); // Write should be under 500ms
  });
  
  it('should measure memory usage', () => {
    const filePath = path.join(fixturesDir, 'PIONEER_DDJ-T1_V103.tsi');
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Force GC if available
    if (global.gc) global.gc();
    
    const memBefore = process.memoryUsage().heapUsed;
    const tsi = parseTsiFile(content);
    const memAfter = process.memoryUsage().heapUsed;
    
    const devices = getAllDevices(tsi);
    const memUsedMB = (memAfter - memBefore) / 1024 / 1024;
    console.log('\n=== Memory Usage ===');
    console.log('Memory used for parsing:', memUsedMB.toFixed(2), 'MB');
    console.log('File size ratio:', (memUsedMB * 1024 / 792).toFixed(2), 'x file size');
    
    // Keep reference to prevent GC
    expect(devices.length).toBeGreaterThan(0);
  });
});
