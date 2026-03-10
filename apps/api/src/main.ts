import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";
import cors from "@fastify/cors";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

  // Load environment variables
  const configService = app.get(ConfigService);

  await app.register(cors, {
    origin: ["http://localhost:3001", "http://localhost:3002", "http://localhost:3004", "http://localhost:3003"],
    credentials: true,
  });

  await app.listen(3000);
}

bootstrap();