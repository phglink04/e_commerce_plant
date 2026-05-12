/**
 * Address Service
 * API calls for user address management
 */

import { BaseApiService } from "./base-api.service";
import {
  Address,
  CreateAddressPayload,
  UpdateAddressPayload,
} from "@/types";
import { API_ENDPOINTS } from "@/constants";

class AddressService extends BaseApiService {
  /**
   * Get all addresses for current user
   */
  async getMyAddresses(): Promise<Address[]> {
    const response = await this.get<{ addresses: Address[] }>(
      API_ENDPOINTS.addresses.myAddresses,
    );
    return response.data.addresses || [];
  }

  /**
   * Create a new address
   */
  async createAddress(payload: CreateAddressPayload): Promise<Address> {
    const response = await this.post<{ address: Address }>(
      API_ENDPOINTS.addresses.create,
      payload,
    );
    return response.data.address;
  }

  /**
   * Update an address
   */
  async updateAddress(id: string, payload: UpdateAddressPayload): Promise<Address> {
    const response = await this.patch<{ address: Address }>(
      API_ENDPOINTS.addresses.update(id),
      payload,
    );
    return response.data.address;
  }

  /**
   * Delete an address
   */
  async deleteAddress(id: string): Promise<void> {
    await this.delete(API_ENDPOINTS.addresses.delete(id));
  }
}

export const addressService = new AddressService();
