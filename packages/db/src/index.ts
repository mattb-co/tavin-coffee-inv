export { PrismaClient } from "@prisma/client";
export type { Prisma } from "@prisma/client";

// Role and SaleSource are now String types (SQLite doesn't support enums)
export const Role = {
  OWNER: "OWNER",
  STAFF: "STAFF",
} as const;

export const SaleSource = {
  MANUAL: "MANUAL",
  POS: "POS",
} as const;

export type Role = typeof Role[keyof typeof Role];
export type SaleSource = typeof SaleSource[keyof typeof SaleSource];
