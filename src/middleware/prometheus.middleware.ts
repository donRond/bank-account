// src/middleware/prometheus.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { collectDefaultMetrics, Counter, Histogram } from 'prom-client';

@Injectable()
export class PrometheusMiddleware implements NestMiddleware {
  private readonly httpRequestsTotal: Counter<string>;
  private readonly httpResponseTime: Histogram<string>;
  private readonly httpErrorsTotal: Counter<string>;

  constructor() {
    collectDefaultMetrics();

    // Contador para requisições HTTP
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'status'],
    });

    // Histograma para tempo de resposta
    this.httpResponseTime = new Histogram({
      name: 'http_response_time_seconds',
      help: 'Histogram of response time in seconds',
      labelNames: ['method', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    });

    // Contador para erros HTTP
    this.httpErrorsTotal = new Counter({
      name: 'http_errors_total',
      help: 'Total number of HTTP errors',
      labelNames: ['method', 'status'],
    });
  }

  use(req: Request, res: Response, next: (error?: any) => void): void {
    const start = Date.now();

    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000; // Duração em segundos
      this.httpRequestsTotal.inc({
        method: req.method,
        status: res.statusCode,
      });
      this.httpResponseTime.observe(
        { method: req.method, status: res.statusCode },
        duration,
      );

      // Incrementar contador de erros
      if (res.statusCode >= 400) {
        this.httpErrorsTotal.inc({
          method: req.method,
          status: res.statusCode,
        });
      }
    });

    next();
  }
}
