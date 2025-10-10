import { WeaponsService, Weapon } from './weapons';

// Mock the apiClient to test the service logic
jest.mock('../config/authenticatedApiClient', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

import { apiClient } from '../config/authenticatedApiClient';

describe('WeaponsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return weapons array when API call is successful', async () => {
      const mockWeapons: Weapon[] = [
        { id: 1, name: 'Pistol' },
        { id: 2, name: 'Revolver' },
        { id: 3, name: 'Shotgun' },
      ];

      (apiClient.get as jest.Mock).mockResolvedValue(mockWeapons);

      const result = await WeaponsService.getAll();

      expect(apiClient.get).toHaveBeenCalledWith('/Weapons', undefined);
      expect(result).toEqual(mockWeapons);
    });

    it('should pass parameters to API call when provided', async () => {
      const params = { id: 1 };
      const mockWeapon: Weapon[] = [{ id: 1, name: 'Pistol' }];

      (apiClient.get as jest.Mock).mockResolvedValue(mockWeapon);

      const result = await WeaponsService.getAll(params);

      expect(apiClient.get).toHaveBeenCalledWith('/Weapons', params);
      expect(result).toEqual(mockWeapon);
    });

    it('should handle API response with nested data structure', async () => {
      const mockResponse = {
        data: [
          { id: 1, name: 'Pistol' },
          { id: 2, name: 'Revolver' },
        ],
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await WeaponsService.getAll();

      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API response with body structure', async () => {
      const mockResponse = {
        body: [
          { id: 1, name: 'Pistol' },
          { id: 2, name: 'Revolver' },
        ],
      };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await WeaponsService.getAll();

      expect(result).toEqual(mockResponse.body);
    });

    it('should return empty array when API response is not an array', async () => {
      const mockResponse = { message: 'No weapons found' };

      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await WeaponsService.getAll();

      expect(result).toEqual([]);
    });

    it('should throw error when API call fails', async () => {
      const errorMessage = 'Network error';
      (apiClient.get as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(WeaponsService.getAll()).rejects.toThrow(errorMessage);
    });
  });
});