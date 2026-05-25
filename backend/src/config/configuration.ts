import * as dotenv from 'dotenv';
dotenv.config();

export const configuration = () => ({
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    type: process.env.DB_TYPE || 'sqlite',
    path: process.env.DB_PATH || './data/webaudit.db',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'webaudit',
    password: process.env.DB_PASSWORD || 'webaudit',
    database: process.env.DB_NAME || 'webaudit',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  openwa: {
    apiUrl: process.env.OPENWA_API_URL || 'http://localhost:2785/api',
    apiKey: process.env.OPENWA_API_KEY || '',
    sessionId: process.env.OPENWA_SESSION_ID || 'default',
  },
  whatsapp: {
    enabled: process.env.WHATSAPP_ENABLED === 'true',
    notifyChatId: process.env.WHATSAPP_NOTIFY_CHAT_ID || '',
  },
  audit: {
    scriptPath: process.env.AUDIT_SCRIPT_PATH || '',
  },
  lighthouse: {
    path: process.env.LIGHTHOUSE_PATH || 'npx lighthouse',
  },
  intervals: {
    uptime: parseInt(process.env.DEFAULT_UPTIME_INTERVAL || '5', 10),
    change: parseInt(process.env.DEFAULT_CHANGE_INTERVAL || '60', 10),
    audit: parseInt(process.env.DEFAULT_AUDIT_INTERVAL || '1440', 10),
    lighthouse: parseInt(process.env.DEFAULT_LIGHTHOUSE_INTERVAL || '1440', 10),
  },
  reports: {
    dailyHour: parseInt(process.env.DAILY_REPORT_HOUR || '8', 10),
    weeklyDay: parseInt(process.env.WEEKLY_REPORT_DAY || '1', 10),
    weeklyHour: parseInt(process.env.WEEKLY_REPORT_HOUR || '9', 10),
  },
});
