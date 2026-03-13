import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./index";

export const createDb = (url: string) => {
  const queryClient = postgres(url, { max: 1 });
  return drizzle(queryClient, { schema });
};

export type DatabaseClient = ReturnType<typeof createDb>;
