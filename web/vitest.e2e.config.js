import { defineConfig } from 'vite';
export default defineConfig({ test: { include: ['tests/e2e/**/*.e2e.js'], testTimeout: 60000, hookTimeout: 120000, fileParallelism: false } });
