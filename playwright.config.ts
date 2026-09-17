import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'./e2e',use:{baseURL:'http://127.0.0.1:4173',browserName:'chromium',launchOptions:{executablePath:'/usr/local/bin/chromium',args:['--no-sandbox']}},webServer:{command:'npm run preview -w @mailpilot/web -- --host 127.0.0.1',url:'http://127.0.0.1:4173',reuseExistingServer:true}});
