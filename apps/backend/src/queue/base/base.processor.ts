import { Logger } from '@nestjs/common';
import { OnWorkerEvent, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';

/**
 * Abstract base class for all BullMQ processors.
 *
 * Extend this class, apply `@Processor(QUEUE_NAME)`, and implement `process()`.
 * Completion and failure events are logged automatically.
 *
 * @example
 * @Processor(EMAIL_QUEUE)
 * export class EmailProcessor extends BaseProcessor<EmailJobData> {
 *   protected readonly logger = new Logger(EmailProcessor.name);
 *
 *   async process(job: Job<EmailJobData>): Promise<void> {
 *     await this.mailer.send(job.data);
 *   }
 * }
 */
export abstract class BaseProcessor<
  TData = unknown,
  TReturn = void,
> extends WorkerHost {
  protected abstract readonly logger: Logger;

  abstract process(job: Job<TData, TReturn>): Promise<TReturn>;

  @OnWorkerEvent('completed')
  onCompleted(job: Job<TData, TReturn>): void {
    this.logger.debug(
      `Job completed [queue=${job.queueName}, id=${job.id}, name=${job.name}]`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<TData, TReturn> | undefined, error: Error): void {
    this.logger.error(
      `Job failed [queue=${job?.queueName}, id=${job?.id}, name=${job?.name}, attempts=${job?.attemptsMade}]`,
      error.stack,
    );
  }

  @OnWorkerEvent('active')
  onActive(job: Job<TData, TReturn>): void {
    this.logger.debug(
      `Job started [queue=${job.queueName}, id=${job.id}, name=${job.name}]`,
    );
  }
}
