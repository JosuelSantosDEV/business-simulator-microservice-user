import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request } from "express";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("GlobalExceptionFilter");

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = "Internal server error";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === "string") {
        message = res;
      } else if (typeof res === "object" && res !== null) {
        const r = res as any;
        message = r.message || r.error || message;
      }
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      const { method, url, ip } = request;

      this.logger.error(
        `${method} ${url} - Error: ${typeof message === "string" ? message : JSON.stringify(message)} (IP: ${ip})`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    if (Array.isArray(message)) {
      message = message.join(", ");
    }

    response.status(status).json({
      success: false,
      data: null,
      meta: null,
      error: {
        statusCode: status,
        message,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
