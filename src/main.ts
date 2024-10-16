import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as swaggerUi from 'swagger-ui-express';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Definindo o caminho do arquivo swagger.json
  const swaggerFilePath = path.join(__dirname, '..', 'docs', 'swagger.json');

  // Lendo o arquivo swagger.json
  const swaggerDocument = JSON.parse(fs.readFileSync(swaggerFilePath, 'utf8'));

  // Configurando o Swagger UI
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  await app.listen(3000);
}
bootstrap();
