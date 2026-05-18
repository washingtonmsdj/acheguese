/**
 * Business Management Service - Stub
 */

export interface BusinessSection {
  id: string;
  title: string;
  type: string;
}

export interface BusinessSectionConfig {
  sections: BusinessSection[];
}

export interface BusinessEditData {
  name?: string;
  description?: string;
  category?: string;
  [key: string]: any;
}

class BusinessManagementServiceClass {
  async getBusinessSections(_profileId: string): Promise<BusinessSection[]> {
    return [];
  }
  async updateBusinessSections(
    _profileId: string,
    _config: BusinessSectionConfig,
  ): Promise<boolean> {
    return true;
  }
  async updateBusinessSection(
    _profileId: string,
    _sectionId: string,
    _data: any,
  ): Promise<boolean> {
    return true;
  }
  async getBusinessInfo(_profileId: string): Promise<Record<string, unknown> | null> {
    return null;
  }
  async updateBusinessInfo(
    _profileId: string,
    _data: BusinessEditData,
  ): Promise<boolean> {
    return true;
  }
  async getBusinessStats(
    _profileId: string,
  ): Promise<Record<string, unknown> | null> {
    return null;
  }
  async updateBusinessStatus(
    _profileId: string,
    _status: string,
  ): Promise<boolean> {
    return true;
  }
  async uploadBusinessImage(
    _profileId: string,
    _file: File,
    _imageType: "logo" | "banner" | "gallery",
  ): Promise<string> {
    return "";
  }
}

export const businessManagementService = new BusinessManagementServiceClass();
