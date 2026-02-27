// import { NestFactory } from "@nestjs/core";

// import { FastifyAdapter } from "@nestjs/platform-fastify";

// import { AppModule } from "./app.module";



// async function bootstrap() {

//   const app = await NestFactory.create(AppModule, new FastifyAdapter());

//   await app.listen(3000);

// }

// bootstrap();

import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";
import cors from "@fastify/cors";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

  await app.register(cors, {
    origin: ["http://localhost:3001", "http://localhost:3002"],
    credentials: true,
  });

  await app.listen(3000);
}
bootstrap();