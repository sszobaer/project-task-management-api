import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((payload) => {
        if (payload && typeof payload === 'object' && 'pagination' in payload) {
          const { pagination, data } = payload as Record<string, unknown>;
          return { success: true, data, pagination };
        }
        return { success: true, data: payload };
      }),
    );
  }
}
