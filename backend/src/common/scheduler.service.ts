import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';

type Task = {
  id: string;
  name: string;
  interval: number;
  handler: () => Promise<void>;
  lastRun: number;
  running: boolean;
};

@Injectable()
export class SchedulerService implements OnModuleDestroy {
  private readonly logger = new Logger(SchedulerService.name);
  private tasks: Map<string, Task> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();

  register(id: string, name: string, intervalMs: number, handler: () => Promise<void>) {
    if (this.tasks.has(id)) {
      this.unregister(id);
    }

    const task: Task = {
      id,
      name,
      interval: intervalMs,
      handler,
      lastRun: 0,
      running: false,
    };

    this.tasks.set(id, task);
    this.logger.log(`Registered task: ${name} (every ${intervalMs / 60000}min)`);
  }

  start(id: string) {
    const task = this.tasks.get(id);
    if (!task) return;

    if (this.timers.has(id)) {
      clearInterval(this.timers.get(id));
    }

    const run = async () => {
      if (task.running) return;
      task.running = true;
      try {
        await task.handler();
        task.lastRun = Date.now();
      } catch (err) {
        this.logger.error(`Task ${task.name} failed: ${err.message}`);
      } finally {
        task.running = false;
      }
    };

    this.timers.set(id, setInterval(run, task.interval));
    this.logger.log(`Started task: ${task.name}`);
  }

  stop(id: string) {
    if (this.timers.has(id)) {
      clearInterval(this.timers.get(id));
      this.timers.delete(id);
      this.logger.log(`Stopped task: ${id}`);
    }
  }

  unregister(id: string) {
    this.stop(id);
    this.tasks.delete(id);
  }

  getStatus() {
    const result: any[] = [];
    this.tasks.forEach((task, id) => {
      result.push({
        id,
        name: task.name,
        interval: task.interval,
        running: task.running,
        lastRun: task.lastRun ? new Date(task.lastRun).toISOString() : null,
      });
    });
    return result;
  }

  onModuleDestroy() {
    this.timers.forEach((timer) => clearInterval(timer));
    this.timers.clear();
  }
}
