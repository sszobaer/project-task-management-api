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
      map((data) => {
        if (data && typeof data === 'object' && 'pagination' in data) {
          const { pagination, ...rest } = data as Record<string, unknown>;
          const dataKey = Object.keys(rest)[0];
          return { success: true, data: rest[dataKey], pagination };
        }
        return { success: true, data };
      }),
    );
  }
}
