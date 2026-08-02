import { describe, it, expect, vi, beforeEach } from 'vitest';
import { F5iControlClient } from '../icontrol-client';

describe('F5iControlClient', () => {
	let client: F5iControlClient;

	beforeEach(() => {
		client = new F5iControlClient(
			'https://test-bigip.example.com',
			'test-user',
			'test-pass'
		);
		vi.clearAllMocks();
	});

	describe('constructor', () => {
		it('should initialize with provided credentials', () => {
			expect(client).toBeDefined();
		});

		it('should handle trailing slash in host URL', () => {
			const clientWithSlash = new F5iControlClient(
				'https://test-bigip.example.com/',
				'test-user',
				'test-pass'
			);
			expect(clientWithSlash).toBeDefined();
		});
	});

	describe('authenticate', () => {
		it('should successfully authenticate and store token', async () => {
			const mockResponse = {
				token: {
					token: 'test-token-123',
					timeout: 3600
				}
			};

			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => mockResponse
			} as Response);

			const result = await client.authenticate();

			expect(result.token).toBe('test-token-123');
			expect(result.expiry).toBeGreaterThan(Date.now());
		});

		it('should throw error on authentication failure', async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: false,
				status: 401
			} as Response);

			await expect(client.authenticate()).rejects.toThrow('Authentication failed');
		});
	});

	describe('request', () => {
		it('should make authenticated request', async () => {
			// First authenticate
			vi.mocked(fetch)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						token: { token: 'test-token', timeout: 3600 }
					})
				} as Response)
				// Then make the actual request
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ kind: 'test', selfLink: 'https://test' })
				} as Response);

			await client.authenticate();
			const result = await client.get('test-endpoint');

			expect(result).toEqual({ kind: 'test', selfLink: 'https://test' });
		});

		it('should handle 204 No Content response', async () => {
			vi.mocked(fetch)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						token: { token: 'test-token', timeout: 3600 }
					})
				} as Response)
				.mockResolvedValueOnce({
					ok: true,
					status: 204
				} as Response);

			await client.authenticate();
			const result = await client.delete('test-endpoint');

			expect(result.kind).toBe('tm:util:empty');
		});
	});

	describe('HTTP methods', () => {
		beforeEach(async () => {
			vi.mocked(fetch).mockResolvedValue({
				ok: true,
				json: async () => ({
					token: { token: 'test-token', timeout: 3600 }
				})
			} as Response);
			await client.authenticate();
			vi.clearAllMocks();
		});

		it('should make GET request', async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ items: [] })
			} as Response);

			await client.get('tm/ltm/virtual');
			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('tm/ltm/virtual'),
				expect.objectContaining({ method: 'GET' })
			);
		});

		it('should make POST request with data', async () => {
			vi.mocked(fetch).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ name: 'test' })
			} as Response);

			const data = { name: 'test-vs', destination: '10.0.0.1:80' };
			await client.post('tm/ltm/virtual', data);

			expect(fetch).toHaveBeenCalledWith(
				expect.stringContaining('tm/ltm/virtual'),
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify(data)
				})
			);
		});
	});
});
