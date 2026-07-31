import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Start background reactive monitoring engine on server startup using dynamic import to prevent circular dependencies
if (typeof window === "undefined") {
  import("./monitoring-engine")
    .then(({ startMonitoringEngine }) => {
      startMonitoringEngine();
    })
    .catch((err) => {
      console.error("Failed to start monitoring engine:", err);
    });
}

