import { defineConfig } from 'vitest/config';
export default defineConfig({test:{environment:'node',exclude:['e2e/**','node_modules/**','**/dist/**'],coverage:{provider:'v8',reporter:['text','html'],thresholds:{lines:70,functions:70,statements:70,branches:60}}}});
