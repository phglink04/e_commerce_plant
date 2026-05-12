/**
 * Profile Service
 * API calls for user profile management
 */

import { BaseApiService } from "./base-api.service";
import {
  UserProfile,
  UpdateProfilePayload,
  ChangePasswordPayload,
  TwoFactorSetupResponse,
  TwoFactorStatusResponse,
} from "@/types";
import { API_ENDPOINTS } from "@/constants";

class ProfileService extends BaseApiService {
  /**
   * Get current user profile
   */
  async getMe(): Promise<UserProfile> {
    const response = await this.get<{ user: UserProfile }>(
      API_ENDPOINTS.profile.me,
    );
    return response.data.user;
  }

  /**
   * Update profile info
   */
  async updateMe(payload: UpdateProfilePayload): Promise<UserProfile> {
    const response = await this.patch<{ user: UserProfile }>(
      API_ENDPOINTS.profile.updateMe,
      payload,
    );
    return response.data.user;
  }

  /**
   * Upload avatar
   */
  async updateAvatar(file: File): Promise<UserProfile> {
    const formData = new FormData();
    formData.append("avatar", file);
    const response = await this.uploadFilePatch<{ user: UserProfile }>(
      API_ENDPOINTS.profile.updateAvatar,
      formData,
    );
    return response.data.user;
  }

  /**
   * Change password
   */
  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await this.patch(API_ENDPOINTS.profile.changePassword, payload);
  }

  /**
   * Get 2FA status
   */
  async get2faStatus(): Promise<TwoFactorStatusResponse> {
    const response = await this.get<TwoFactorStatusResponse>(
      API_ENDPOINTS.twoFactor.status,
    );
    return response.data;
  }

  /**
   * Setup 2FA (get QR code)
   */
  async setup2fa(): Promise<TwoFactorSetupResponse> {
    const response = await this.post<TwoFactorSetupResponse>(
      API_ENDPOINTS.twoFactor.setup,
    );
    return response.data;
  }

  /**
   * Verify 2FA code to enable
   */
  async verify2fa(code: string): Promise<{ message: string; backupCodes?: string[] }> {
    const response = await this.post<{ message: string; backupCodes?: string[] }>(
      API_ENDPOINTS.twoFactor.verify,
      { code },
    );
    return response.data;
  }

  /**
   * Disable 2FA
   */
  async disable2fa(code: string): Promise<void> {
    await this.post(API_ENDPOINTS.twoFactor.disable, { code });
  }
}

export const profileService = new ProfileService();
