import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: [['html', { open: 'never' }]],
  ignoreSnapshots: false, 
  updateSnapshots: 'none', // Prevents silent baseline modifications
  
  use: {
    headless: true,
    viewport: { width: 1280, height: 1440 },
    launchOptions: {
      args: [
        '--force-device-scale-factor=1', // Locks uniform pixel density
        '--disable-gpu'                  // Disables GPU variance across machines
      ],
    },
  },
  snapshotPathTemplate: '{testDir}/__snapshots__/{arg}{ext}',
});
