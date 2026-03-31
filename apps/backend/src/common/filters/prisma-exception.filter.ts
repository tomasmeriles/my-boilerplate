import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

interface ErrorBody {
  statusCode: number;
  message: string;
  error: string;
}

const KNOWN_ERROR_MAP: Record<string, { status: number; message: string }> = {
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

@Catch(
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientValidationError,
  Prisma.PrismaClientInitializationError,
)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    const body = this.buildBody(exception);
    res.status(body.statusCode).json(body);
  }

  private buildBody(exception: unknown): ErrorBody {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mapped = KNOWN_ERROR_MAP[exception.code];
      const status = mapped?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      const message = mapped?.message ?? 'Database error';
      this.logger.warn(`Prisma [${exception.code}]: ${exception.message}`);
      return { statusCode: status, message, error: exception.code };
    }

    if (exception instanceof Prisma.PrismaClientValidationError) {
      this.logger.warn(`Prisma validation: ${exception.message}`);
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid query parameters',
        error: 'PrismaValidationError',
      };
    }

    // PrismaClientInitializationError
    this.logger.error(`Prisma init error: ${String(exception)}`);
    return {
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      message: 'Database unavailable',
      error: 'PrismaInitializationError',
    };
  }
}
