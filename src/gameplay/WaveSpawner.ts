/**
 * Phase 4 Blueprint Stub: Procedural Crystal Wave & Boss Spawner
 */
export class WaveSpawner {
  public static isBossWave(waveNumber: number): boolean {
    return waveNumber > 0 && waveNumber % 10 === 0;
  }
}
