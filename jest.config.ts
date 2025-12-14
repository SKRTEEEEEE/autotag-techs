import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',            // usar ts-jest para TypeScript
  testEnvironment: 'node',      // entorno Node
  moduleFileExtensions: ['ts', 'js', 'json'],
  roots: ['test'],    // carpeta donde están tus tests
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testMatch: ['**/*.test.ts', '**/*.e2e-spec.ts'], // reconocer unit y e2e
};

export default config;
