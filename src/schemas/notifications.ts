import { z } from 'zod';

// Schema for structured notification streaming with useObject
export const notificationSchema = z.object({
  category: z.string().describe('Category or theme of the notification batch, e.g. System Alerts, Social, Finals Week.'),
  notifications: z.array(
    z.object({
      name: z.string().describe('Sender or service name, e.g. Alex Chen, DevOps Sentinel, Dr. Martinez.'),
      message: z.string().describe('Notification text content without links or emojis.'),
      timeAgo: z.string().describe('Relative time like "Just now", "2m ago", "15m ago".'),
      priority: z.enum(['low', 'medium', 'high']).describe('Priority level of the notification.'),
    })
  ),
});

export type NotificationBatch = z.infer<typeof notificationSchema>;
