/**
 * ProfileService Refactored - Unit Tests
 * 
 * SSOT: Testes do service desacoplado usando mocks do repository
 * Demonstra como testar services sem banco de dados
 * 
 * @version 1.0.0
 * @since Sprint 1 - Repository Pattern
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileServiceRefactored } from '../ProfileService.refactored';
import { ProfileRepository } from '@/core/infrastructure/database';
import { DatabaseError, DatabaseErrorCode } from '@/core/infrastructure/database';

describe('ProfileServiceRefactored', () => {
  let service: ProfileServiceRefactored;
  let mockRepo: ProfileRepository;

  beforeEach(() => {
    // Mock do repository
    mockRepo = {
      findById: vi.fn(),
      findByIds: vi.fn(),
      findByUsername: vi.fn(),
      findByUserId: vi.fn(),
      isUsernameAvailable: vi.fn(),
      count: vi.fn(),
      findVerified: vi.fn(),
      findPendingVerification: vi.fn(),
      countByVerificationStatus: vi.fn(),
      findByCity: vi.fn(),
      findByNeighborhood: vi.fn(),
      findTopByPoints: vi.fn(),
      incrementPoints: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      exists: vi.fn(),
    } as any;

    service = new ProfileServiceRefactored(mockRepo);
  });

  describe('getProfileById', () => {
    it('should return profile when found', async () => {
      const mockProfile = {
        id: '123',
        user_id: 'user-1',
        name: 'Test User',
        username: 'testuser',
        pontos: 100,
      };

      vi.mocked(mockRepo.findById).mockResolvedValue(mockProfile as any);

      const result = await service.getProfileById('123');

      expect(result).toEqual(mockProfile);
      expect(mockRepo.findById).toHaveBeenCalledWith('123');
    });

    it('should return null when not found', async () => {
      vi.mocked(mockRepo.findById).mockResolvedValue(null);

      const result = await service.getProfileById('999');

      expect(result).toBeNull();
      expect(mockRepo.findById).toHaveBeenCalledWith('999');
    });

    it('should return null when DatabaseError.NOT_FOUND', async () => {
      const error = new DatabaseError({
        code: DatabaseErrorCode.NOT_FOUND,
        message: 'Profile not found',
        table: 'profiles',
        operation: 'findById',
      });

      vi.mocked(mockRepo.findById).mockRejectedValue(error);

      const result = await service.getProfileById('999');

      expect(result).toBeNull();
    });

    it('should throw on other database errors', async () => {
      const error = new DatabaseError({
        code: DatabaseErrorCode.QUERY_ERROR,
        message: 'Database error',
        table: 'profiles',
        operation: 'findById',
      });

      vi.mocked(mockRepo.findById).mockRejectedValue(error);

      await expect(service.getProfileById('123')).rejects.toThrow();
    });
  });

  describe('getProfilesByIds', () => {
    it('should return profiles for valid ids', async () => {
      const mockProfiles = [
        { id: '1', name: 'User 1' },
        { id: '2', name: 'User 2' },
      ];

      vi.mocked(mockRepo.findByIds).mockResolvedValue(mockProfiles as any);

      const result = await service.getProfilesByIds(['1', '2']);

      expect(result).toEqual(mockProfiles);
      expect(mockRepo.findByIds).toHaveBeenCalledWith(['1', '2']);
    });

    it('should return empty array on error', async () => {
      vi.mocked(mockRepo.findByIds).mockRejectedValue(new Error('DB error'));

      const result = await service.getProfilesByIds(['1', '2']);

      expect(result).toEqual([]);
    });
  });

  describe('getByUsername', () => {
    it('should return profile when username exists', async () => {
      const mockProfile = {
        id: '123',
        username: 'testuser',
        name: 'Test User',
      };

      vi.mocked(mockRepo.findByUsername).mockResolvedValue(mockProfile as any);

      const result = await service.getByUsername('testuser');

      expect(result).toEqual(mockProfile);
      expect(mockRepo.findByUsername).toHaveBeenCalledWith('testuser');
    });

    it('should return null when username not found', async () => {
      vi.mocked(mockRepo.findByUsername).mockResolvedValue(null);

      const result = await service.getByUsername('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('isUsernameAvailable', () => {
    it('should return true when username is available', async () => {
      vi.mocked(mockRepo.isUsernameAvailable).mockResolvedValue(true);

      const result = await service.isUsernameAvailable('newuser');

      expect(result).toBe(true);
      expect(mockRepo.isUsernameAvailable).toHaveBeenCalledWith('newuser', undefined);
    });

    it('should return false when username is taken', async () => {
      vi.mocked(mockRepo.isUsernameAvailable).mockResolvedValue(false);

      const result = await service.isUsernameAvailable('existinguser');

      expect(result).toBe(false);
    });

    it('should exclude profile id when provided', async () => {
      vi.mocked(mockRepo.isUsernameAvailable).mockResolvedValue(true);

      await service.isUsernameAvailable('username', 'profile-123');

      expect(mockRepo.isUsernameAvailable).toHaveBeenCalledWith('username', 'profile-123');
    });

    it('should return false on error', async () => {
      vi.mocked(mockRepo.isUsernameAvailable).mockRejectedValue(new Error('DB error'));

      const result = await service.isUsernameAvailable('username');

      expect(result).toBe(false);
    });
  });

  describe('getTotalProfilesCount', () => {
    it('should return count from repository', async () => {
      vi.mocked(mockRepo.count).mockResolvedValue(42);

      const result = await service.getTotalProfilesCount();

      expect(result).toBe(42);
      expect(mockRepo.count).toHaveBeenCalled();
    });

    it('should return 0 on error', async () => {
      vi.mocked(mockRepo.count).mockRejectedValue(new Error('DB error'));

      const result = await service.getTotalProfilesCount();

      expect(result).toBe(0);
    });
  });

  describe('getVerifiedProfiles', () => {
    it('should return verified profiles', async () => {
      const mockProfiles = [
        { id: '1', verification_status: 'verified' },
        { id: '2', verification_status: 'verified' },
      ];

      vi.mocked(mockRepo.findVerified).mockResolvedValue(mockProfiles as any);

      const result = await service.getVerifiedProfiles();

      expect(result).toEqual(mockProfiles);
      expect(mockRepo.findVerified).toHaveBeenCalled();
    });
  });

  describe('countByVerificationStatus', () => {
    it('should count profiles by status', async () => {
      vi.mocked(mockRepo.countByVerificationStatus).mockResolvedValue(10);

      const result = await service.countByVerificationStatus('pending');

      expect(result).toBe(10);
      expect(mockRepo.countByVerificationStatus).toHaveBeenCalledWith('pending');
    });
  });

  describe('getRanking', () => {
    it('should return top profiles by points', async () => {
      const mockProfiles = [
        { id: '1', pontos: 1000 },
        { id: '2', pontos: 900 },
      ];

      vi.mocked(mockRepo.findTopByPoints).mockResolvedValue(mockProfiles as any);

      const result = await service.getRanking(10);

      expect(result).toEqual(mockProfiles);
      expect(mockRepo.findTopByPoints).toHaveBeenCalledWith(10);
    });

    it('should use default limit of 50', async () => {
      vi.mocked(mockRepo.findTopByPoints).mockResolvedValue([]);

      await service.getRanking();

      expect(mockRepo.findTopByPoints).toHaveBeenCalledWith(50);
    });
  });

  describe('incrementPoints', () => {
    it('should increment profile points', async () => {
      const mockProfile = { id: '123', pontos: 150 };

      vi.mocked(mockRepo.incrementPoints).mockResolvedValue(mockProfile as any);

      const result = await service.incrementPoints('123', 50);

      expect(result).toEqual(mockProfile);
      expect(mockRepo.incrementPoints).toHaveBeenCalledWith('123', 50);
    });

    it('should throw on error', async () => {
      vi.mocked(mockRepo.incrementPoints).mockRejectedValue(new Error('DB error'));

      await expect(service.incrementPoints('123', 50)).rejects.toThrow();
    });
  });

  describe('createProfile', () => {
    it('should create profile successfully', async () => {
      const createData = {
        user_id: 'user-1',
        name: 'New User',
        username: 'newuser',
      };

      const mockProfile = { id: '123', ...createData };

      vi.mocked(mockRepo.create).mockResolvedValue(mockProfile as any);

      const result = await service.createProfile(createData as any);

      expect(result).toEqual(mockProfile);
      expect(mockRepo.create).toHaveBeenCalledWith(createData);
    });

    it('should throw error when username exists', async () => {
      const error = new DatabaseError({
        code: DatabaseErrorCode.DUPLICATE,
        message: 'Duplicate username',
        table: 'profiles',
        operation: 'create',
      });

      vi.mocked(mockRepo.create).mockRejectedValue(error);

      await expect(
        service.createProfile({ username: 'existing' } as any)
      ).rejects.toThrow('Username already exists');
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const updates = { name: 'Updated Name' };
      const mockProfile = { id: '123', name: 'Updated Name' };

      vi.mocked(mockRepo.update).mockResolvedValue(mockProfile as any);

      const result = await service.updateProfile('123', updates);

      expect(result).toEqual(mockProfile);
      expect(mockRepo.update).toHaveBeenCalledWith('123', updates);
    });

    it('should throw error when profile not found', async () => {
      const error = new DatabaseError({
        code: DatabaseErrorCode.NOT_FOUND,
        message: 'Profile not found',
        table: 'profiles',
        operation: 'update',
      });

      vi.mocked(mockRepo.update).mockRejectedValue(error);

      await expect(
        service.updateProfile('999', { name: 'Test' })
      ).rejects.toThrow('Profile not found');
    });
  });

  describe('deleteProfile', () => {
    it('should delete profile successfully', async () => {
      vi.mocked(mockRepo.delete).mockResolvedValue(undefined);

      await service.deleteProfile('123');

      expect(mockRepo.delete).toHaveBeenCalledWith('123');
    });

    it('should ignore not found error', async () => {
      const error = new DatabaseError({
        code: DatabaseErrorCode.NOT_FOUND,
        message: 'Profile not found',
        table: 'profiles',
        operation: 'delete',
      });

      vi.mocked(mockRepo.delete).mockRejectedValue(error);

      // Não deve lançar erro
      await service.deleteProfile('999');

      expect(mockRepo.delete).toHaveBeenCalledWith('999');
    });
  });

  describe('profileExists', () => {
    it('should return true when profile exists', async () => {
      vi.mocked(mockRepo.exists).mockResolvedValue(true);

      const result = await service.profileExists('123');

      expect(result).toBe(true);
      expect(mockRepo.exists).toHaveBeenCalledWith('123');
    });

    it('should return false when profile does not exist', async () => {
      vi.mocked(mockRepo.exists).mockResolvedValue(false);

      const result = await service.profileExists('999');

      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      vi.mocked(mockRepo.exists).mockRejectedValue(new Error('DB error'));

      const result = await service.profileExists('123');

      expect(result).toBe(false);
    });
  });
});
