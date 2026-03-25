import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";
import { join } from "path";
import { NestExpressApplication } from "@nestjs/platform-express";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Load environment variables
  const configService = app.get(ConfigService);

  // Enable CORS
  app.enableCors({
    origin: ["http://localhost:3001", "http://localhost:3002", "http://localhost:3004", "http://localhost:3003", "http://localhost:3000"],
    credentials: true,
  });

  // Serve static files from uploads directory
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  await app.listen(3000);
}

bootstrap();