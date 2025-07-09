import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix for API routes
  app.setGlobalPrefix("api");

  // Enable CORS
  app.enableCors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://url-shortener-eosin-eight.vercel.app"]
        : ["http://localhost:3000"],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // For Vercel serverless, we need to return the app instance
  if (process.env.VERCEL) {
    await app.init();
    return app.getHttpAdapter().getInstance();
  }

  // For local development
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

// For local development
if (require.main === module) {
  bootstrap();
}

// Export for Vercel
export default bootstrap;
