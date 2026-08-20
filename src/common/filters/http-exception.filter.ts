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
      const body = exception.getResponse();

      if (typeof body === 'object' && body !== null && 'message' in body) {
        const { message } = body as { message: string | string[] };
        const isValidationError = Array.isArray(message);

        return res.status(status).json({
          success: false,
          message: isValidationError ? 'Validation failed' : message,
          ...(isValidationError && {
            errors: (message as string[]).map((msg) => ({ message: msg })),
          }),
        });
      }

      return res.status(status).json({ success: false, message: String(body) });
    }

    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
    });
  }
}
