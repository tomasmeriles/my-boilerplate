import type { Job, JobsOptions } from 'bullmq';

/**
 * Strongly-typed alias for a BullMQ job.
 *
 * @example
 * type SendEmailJob = TypedJob<{ to: string; subject: string }>;
 */
export type TypedJob<TData, TReturn = void> = Job<TData, TReturn>;

export type { JobsOptions };
