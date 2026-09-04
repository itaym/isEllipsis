import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'isellipsis',
          root: 'packages/isellipsis',
          environment: 'happy-dom',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'react',
          root: 'packages/react',
          environment: 'happy-dom',
          globals: true,
          include: ['src/**/*.test.{ts,tsx}'],
        },
      },
    ],
  },
});
