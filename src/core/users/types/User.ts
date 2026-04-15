/**
 * User Entity - Canonical User Type
 *
 * This is the main account/authentication entity in the system.
 * All other profiles and domain-specific profiles reference this core User entity.
 *
 * @property {string} id - Unique identifier for the user
 * @property {string} email - User's email address
 * @property {Date} created_at - Timestamp when the user was created
 * @property {Date} updated_at - Timestamp when the user was last updated
 */
export interface User {
  id: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}
