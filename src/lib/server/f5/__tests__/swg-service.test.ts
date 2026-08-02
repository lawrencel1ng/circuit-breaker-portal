import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SWGService } from '../swg-service';
import { F5iControlClient } from '../icontrol-client';

// Mock the F5 client
vi.mock('../icontrol-client', () => ({
	F5iControlClient: vi.fn().mockImplementation(function() {
		const mockPost = vi.fn();
		return {
			get: vi.fn(),
			post: mockPost,
			patch: vi.fn(),
			delete: vi.fn(),
			getDeviceInfo: vi.fn(),
			createDataGroup: vi.fn().mockImplementation((name: string, type: string, records: any[]) => {
				return mockPost('tm/ltm/data-group/internal', { name, type, records });
			})
		};
	})
}));

describe('SWGService', () => {
	let service: SWGService;
	let mockClient: any;

	beforeEach(() => {
		mockClient = new F5iControlClient();
		service = new SWGService(mockClient);
	});

	describe('getExplicitProxyConfig', () => {
		it('should return explicit proxy configuration', async () => {
			mockClient.get.mockResolvedValueOnce({
				destination: '10.1.10.51:8080',
				enabled: 'true',
				vlans: ['/Common/vlan30', '/Common/vlan40']
			});

			const config = await service.getExplicitProxyConfig();

			expect(config.ip).toBe('10.1.10.51');
			expect(config.port).toBe(8080);
			expect(config.enabled).toBe(true);
			expect(config.vlans).toContain('vlan30');
		});

		it('should return default config on error', async () => {
			mockClient.get.mockRejectedValueOnce(new Error('Not found'));

			const config = await service.getExplicitProxyConfig();

			expect(config.ip).toBe('10.1.10.51');
			expect(config.port).toBe(8080);
		});
	});

	describe('updateExplicitProxyConfig', () => {
		it('should update proxy configuration', async () => {
			mockClient.get.mockResolvedValueOnce({
				destination: '10.1.10.51:8080',
				enabled: 'true'
			});
			mockClient.patch.mockResolvedValueOnce({});

			await service.updateExplicitProxyConfig({ port: 9090 });

			expect(mockClient.patch).toHaveBeenCalledWith(
				expect.stringContaining('vs_swg_explicit'),
				expect.objectContaining({ destination: expect.stringContaining('9090') })
			);
		});
	});

	describe('getBlockedUrls', () => {
		it('should return list of blocked URLs', async () => {
			mockClient.get.mockResolvedValueOnce({
				records: [
					{ name: 'malware.com', data: '' },
					{ name: 'phishing.net', data: '' }
				]
			});

			const urls = await service.getBlockedUrls();

			expect(urls).toHaveLength(2);
			expect(urls).toContain('malware.com');
		});

		it('should return empty array on error', async () => {
			mockClient.get.mockRejectedValueOnce(new Error('Not found'));

			const urls = await service.getBlockedUrls();

			expect(urls).toEqual([]);
		});
	});

	describe('updateBlockedUrls', () => {
		it('should update blocked URLs data group', async () => {
			mockClient.patch.mockResolvedValueOnce({});

			await service.updateBlockedUrls(['site1.com', 'site2.com']);

			expect(mockClient.patch).toHaveBeenCalledWith(
				expect.stringContaining('dg-blocked-urls'),
				expect.objectContaining({
					records: expect.arrayContaining([
						expect.objectContaining({ name: 'site1.com' })
					])
				})
			);
		});

		it('should create data group if not exists', async () => {
			mockClient.patch.mockRejectedValueOnce({ message: 'not found' });
			mockClient.post.mockResolvedValueOnce({});

			await service.updateBlockedUrls(['site1.com']);

			expect(mockClient.post).toHaveBeenCalled();
		});
	});

	describe('testConnectivity', () => {
		it('should return success on valid connection', async () => {
			mockClient.getDeviceInfo.mockResolvedValueOnce({
				kind: 'shared:resolver:device-groups:devicegroupstate'
			});

			const result = await service.testConnectivity();

			expect(result.success).toBe(true);
		});

		it('should return failure on error', async () => {
			mockClient.getDeviceInfo.mockRejectedValueOnce(new Error('Connection failed'));

			const result = await service.testConnectivity();

			expect(result.success).toBe(false);
		});
	});
});
