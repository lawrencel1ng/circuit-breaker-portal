import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// Mock global fetch
global.fetch = vi.fn();

// Mock environment variables
vi.stubGlobal('process', {
	env: {
		F5_HOST: 'https://test-bigip.example.com',
		F5_USERNAME: 'test-user',
		F5_PASSWORD: 'test-pass',
		DATABASE_URL: 'file:./test.db',
		JWT_SECRET: 'test-jwt-secret-for-testing-only-do-not-use-in-production-64-characters-long'
	}
});

// Reset mocks before each test
beforeEach(() => {
	vi.clearAllMocks();
});
