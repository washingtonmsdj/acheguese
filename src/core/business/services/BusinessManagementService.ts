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
  async updateBusinessSection(
    _profileId: string,
    _sectionId: string,
    _data: any,
  ): Promise<boolean> {
    return false;
  }
}

export const businessManagementService = new BusinessManagementServiceClass();
