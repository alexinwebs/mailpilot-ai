import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

const configuredPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;

const browserPaths = configuredPath
  ? [
      configuredPath,
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/local/bin/chromium',
    ]
  : [
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/local/bin/chromium',
    ];

const executablePath = browserPaths.find((path) => existsSync(path));

const launchOptions = executablePath
  ? {
      executablePath,
      args: ['--no-sandbox'],
    }
  : {
      args: ['--no-sandbox'],
    };

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    launchOptions,
  },
  webServer: {
    command:
      'npm run preview -w @mailpilot/web -- --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
  },
});
