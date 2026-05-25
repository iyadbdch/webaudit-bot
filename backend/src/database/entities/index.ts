import { Site } from './site.entity';
import { UptimeLog } from './uptime-log.entity';
import { Snapshot } from './snapshot.entity';
import { ChangeLog } from './change-log.entity';
import { AuditResult } from './audit-result.entity';
import { LighthouseReport } from './lighthouse-report.entity';
import { AlertRule } from './alert-rule.entity';

export const entities = [
  Site,
  UptimeLog,
  Snapshot,
  ChangeLog,
  AuditResult,
  LighthouseReport,
  AlertRule,
];

export {
  Site,
  UptimeLog,
  Snapshot,
  ChangeLog,
  AuditResult,
  LighthouseReport,
  AlertRule,
};
