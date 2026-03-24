import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { map, Observable } from "rxjs";
import { ApiResponse } from "../interfaces/api-response.interface";

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((response) => {
        if (response?.data !== undefined) {
          return {
            success: true,
            data: response.data ?? null,
            meta: response.meta ?? null,
            error: null,
            timestamp: new Date().toISOString(),
          };
        }

        return {
          success: true,
          data: response ?? null,
          meta: null,
          error: null,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
