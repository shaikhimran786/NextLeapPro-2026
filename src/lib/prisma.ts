import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

async function connectWithRetry(client: PrismaClient, maxRetries = 5): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await client.$connect();
      console.log(`Prisma connected to database (attempt ${attempt})`);
      return;
    } catch (err: any) {
      const isEndpointDisabled = err?.message?.includes("endpoint has been disabled") ||
        err?.message?.includes("terminating connection");
      const isConnectionError = err?.message?.includes("Can't reach database") ||
        err?.message?.includes("Connection refused") ||
        err?.message?.includes("ECONNREFUSED") ||
        isEndpointDisabled;

      if (isConnectionError && attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 15000);
        console.warn(
          `Prisma connect attempt ${attempt}/${maxRetries} failed: ${err?.message?.substring(0, 120)}. Retrying in ${delay}ms...`
        );
        await new Promise((r) => setTimeout(r, delay));
      } else {
        console.error(`Prisma connect failed after ${attempt} attempts:`, err?.message?.substring(0, 200));
        throw err;
      }
    }
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;

if (process.env.NODE_ENV === "production") {
  connectWithRetry(prisma).catch((err: unknown) => {
    console.error("Prisma pre-connect failed after all retries:", err);
  });
}

export default prisma;
