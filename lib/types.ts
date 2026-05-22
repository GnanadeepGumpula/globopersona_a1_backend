export type CampaignStatus = 'draft' | 'scheduled' | 'live' | 'archived';
export type ContactStatus = 'engaged' | 'nurture' | 'active';
export type NotificationReadState = 'read' | 'unread';
export type ActivityEntityType = 'campaign' | 'contact' | 'segment' | 'settings' | 'notification';
export type ActivityType =
  | 'campaign.created'
  | 'campaign.updated'
  | 'campaign.deleted'
  | 'campaign.scheduled'
  | 'campaign.sent'
  | 'contact.created'
  | 'contact.updated'
  | 'contact.deleted'
  | 'segment.created'
  | 'settings.updated'
  | 'notification.read';

export type WorkspaceSettings = {
  id: string;
  workspace_id: string;
  company_name: string;
  reply_to_email: string;
  default_sender_name: string;
  sending_domain: string | null;
  timezone: string;
  logo_url: string | null;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CampaignRecord = {
  id: string;
  workspace_id: string;
  name: string;
  subject: string;
  preview_text: string | null;
  content: Record<string, unknown>;
  status: CampaignStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ContactRecord = {
  id: string;
  workspace_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  status: ContactStatus;
  segment_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type SegmentRecord = {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  rules: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type NotificationRecord = {
  id: string;
  workspace_id: string;
  user_id: string;
  title: string;
  body: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

export type ActivityRecord = {
  id: string;
  workspace_id: string;
  actor_user_id: string | null;
  entity_type: ActivityEntityType;
  entity_id: string | null;
  type: ActivityType;
  title: string;
  details: Record<string, unknown>;
  created_at: string;
};