import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Load environment variables
  const configService = app.get(ConfigService);

  // Enable CORS
  app.enableCors({
    origin: ["http://localhost:3001", "http://localhost:3002", "http://localhost:3004", "http://localhost:3003"],
    credentials: true,
  });

  await app.listen(3000);
}

bootstrap();