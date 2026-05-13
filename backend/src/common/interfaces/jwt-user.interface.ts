// src/common/interfaces/jwt-user.interface.ts
// Це те що повертає jwt.strategy.ts -> validate()
// і що @CurrentUser() дає в resolvers
export class JwtUser {
  id: string;  // payload.sub
  email: string;
  role: string;    // UserRole enum value
}