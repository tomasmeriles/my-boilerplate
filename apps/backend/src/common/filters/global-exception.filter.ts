import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

const PRISMA_ERROR_MAP: Record<string, { status: number; message: string }> = {
  P2000: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Value too long for column',
  },
  P2002: {
    status: HttpStatus.CONFLICT,
    message: 'Resource already exists',
  },
  P2003: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Foreign key constraint failed',
  },
  P2011: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Null constraint violation',
  },
  P2014: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Required relation violation',
  },
  P2025: {
    status: HttpStatus.NOT_FOUND,
    message: 'Resource not found',
  },
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { id?: string | number }>();
    const requestId = req.id ?? null;

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mapped = PRISMA_ERROR_MAP[exception.code];
      const status = mapped?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      const message = mapped?.message ?? 'Internal server error';
      this.logger.warn(`Prisma [${exception.code}]: ${exception.message}`);
      res.status(status).json({
        statusCode: status,
        message,
        error: mapped ? exception.code : 'Internal Server Error',
        requestId,
      });
      return;
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      this.logger.warn(`Prisma validation: ${exception.message}`);
      res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid query parameters',
        error: 'Bad Request',
        requestId,
      });
      return;
    }

    if (exception instanceof Prisma.PrismaClientUnknownRequestError) {
      this.logger.error(`Prisma unknown request error: ${exception.message}`);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        error: 'Internal Server Error',
        requestId,
      });
      return;
    }

    if (exception instanceof Prisma.PrismaClientInitializationError) {
      this.logger.error(`Prisma init error: ${exception.message}`);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        error: 'Internal Server Error',
        requestId,
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const raw = exception.getResponse();
      const body =
        typeof raw === 'string'
          ? { message: raw }
          : (raw as Record<string, unknown>);
      const message = (body.message as string | undefined) ?? exception.message;
      const error =
        (body.error as string | undefined) ?? (HttpStatus[status] as string);

      if (status >= 500) {
        this.logger.error(`HTTP ${status}: ${exception.message}`);
      }

      res
        .status(status)
        .json({ statusCode: status, message, error, requestId });
      return;
    }

    this.logger.error(
      'Unhandled exception',
      exception instanceof Error ? exception.stack : String(exception),
    );
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      error: 'InternalServerError',
      requestId,
    });
  }
}
