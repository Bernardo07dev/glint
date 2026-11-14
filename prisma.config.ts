import { defineConfig, env } from "prisma/config";

try {
  process.loadEnvFile();
} catch (error) {
  console.error("Erro ao carregar .env:", error);
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DIRECT_URL"),
  },
});

