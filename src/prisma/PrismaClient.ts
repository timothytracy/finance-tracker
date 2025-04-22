import { PrismaClient } from "@prisma/client";

export type TransactionClient = Omit<
  PrismaClient, 
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;
 
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
 
export const prisma = globalForPrisma.prisma || new PrismaClient()
 
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
export default prisma;