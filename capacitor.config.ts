import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ricochetalchemy.forgefire',
  appName: 'Ricochet Alchemy',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
