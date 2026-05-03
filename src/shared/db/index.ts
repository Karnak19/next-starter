export { client, type PbClient } from "./generated/client.gen";
export type {
  BaseRecord,
  AuthRecord,
  UsersRecord,
  UsersCreate,
  UsersUpdate,
} from "./generated/types.gen";

// Re-export SDK functions for convenience
export {
  getUser,
  getFirstUser,
  listUsers,
  getFullListUsers,
  createUser,
  updateUser,
  deleteUser,
  authUserWithPassword,
  authUserWithOAuth2,
  authUserWithOTP,
  requestUserPasswordReset,
  confirmUserPasswordReset,
  requestUserVerification,
  confirmUserVerification,
  type ListResult,
  type ListParams,
  type RequestOptions,
} from "./generated/sdk.gen";
