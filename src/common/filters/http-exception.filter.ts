import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse() as Record<string, unknown>;

      if (typeof body === 'object' && body !== null && Array.isArray(body.message)) {
        const errors = (body.message as Array<{ field?: string; constraints?: Record<string, string>; property?: string } | string>).map((item) => {
          if (typeof item === 'string') return { message: item };
          const field = item.property ?? item.field ?? 'unknown';
          const message = item.constraints
            ? Object.values(item.constraints)[0]
            : String(item);
          return { field, message };
        });

        return res.status(status).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
      }

      const message =
        typeof body === 'object' && typeof body.message === 'string'
          ? body.message
          : String(body);

      return res.status(status).json({ success: false, message });
    }

    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
