import type { Queue, Job, JobsOptions } from 'bullmq';

/**
 * Per-job-name default options. Subclasses can override `jobOptions` to set
 * retries, delays, priority, etc. for each job type individually.
 *
 * @example
 * protected readonly jobOptions: JobOptionsMap<EmailJobName> = {
 *   'send-welcome':        { attempts: 5, priority: 1 },
 *   'send-reset-password': { attempts: 3, delay: 500 },
 * };
 */
export type JobOptionsMap<TName extends string> = Partial<
  Record<TName, JobsOptions>
>;

/**
 * Typed base class for services that enqueue BullMQ jobs.
 *
 * Inject the queue with `@InjectQueue(QUEUE_NAME)` in the subclass constructor
 * and pass it to `super()`. Optionally override `jobOptions` to set per-job
 * defaults that are merged with (and overridden by) call-site opts.
 *
 * @example
 * export const EMAIL_QUEUE = 'emails';
 *
 * export type EmailJobName = 'send-welcome' | 'send-reset-password';
 * export interface EmailJobData { to: string; templateId: string; vars: Record<string, string> }
 *
 * @Injectable()
 * export class EmailQueueService extends BaseQueueService<EmailJobName, EmailJobData> {
 *   constructor(@InjectQueue(EMAIL_QUEUE) queue: Queue<EmailJobData, void, EmailJobName>) {
 *     super(queue);
 *   }
 *
 *   protected readonly jobOptions: JobOptionsMap<EmailJobName> = {
 *     'send-welcome':        { attempts: 5 },
 *     'send-reset-password': { attempts: 3, delay: 500 },
 *   };
 * }
 */
export abstract class BaseQueueService<
  TName extends string,
  TData,
  TReturn = void,
> {
  // Cast to the unparameterised Queue to avoid BullMQ v5's complex
  // ExtractDataType / ExtractNameType conditional types conflicting with our
  // simpler generics. The public API is fully typed via the method signatures.
  private readonly _q: Queue;

  protected readonly jobOptions: JobOptionsMap<TName> = {};

  constructor(protected readonly queue: Queue<TData, TReturn, TName>) {
    this._q = queue as unknown as Queue;
  }

  add(
    name: TName,
    data: TData,
    opts?: JobsOptions,
  ): Promise<Job<TData, TReturn, TName>> {
    const merged: JobsOptions = { ...this.jobOptions[name], ...opts };
    return this._q.add(name, data, merged) as unknown as Promise<
      Job<TData, TReturn, TName>
    >;
  }

  addBulk(
    jobs: { name: TName; data: TData; opts?: JobsOptions }[],
  ): Promise<Job<TData, TReturn, TName>[]> {
    const merged = jobs.map((j) => ({
      ...j,
      opts: { ...this.jobOptions[j.name], ...j.opts },
    }));
    return this._q.addBulk(merged) as unknown as Promise<
      Job<TData, TReturn, TName>[]
    >;
  }

  pause(): Promise<void> {
    return this.queue.pause();
  }

  resume(): Promise<void> {
    return this.queue.resume();
  }
}
