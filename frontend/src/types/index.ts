export interface User {
  id: string;
  username: string;
  role: string;
  display_name: string;
}

export interface DashboardStats {
  total_posts: number;
  posts_24h: number;
  total_entities: number;
  active_alerts: number;
  active_sources: number;
}

export interface VolumeData {
  day: string;
  platform: string;
  count: number;
}

export interface PlatformData {
  platform: string;
  count: number;
}

export interface SentimentData {
  label: string;
  count: number;
}

export interface GeoData {
  lat: number;
  lon: number;
  label: string;
  count: number;
}

export interface EntityItem {
  id: string;
  entity_type: string;
  value: string;
  display_name: string;
  mention_count: number;
  risk_score: number;
  first_seen_at: string;
  last_seen_at: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  risk_score: number;
  mention_count: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: string;
  weight: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface AlertItem {
  id: string;
  title: string;
  description: string;
  severity: string;
  alert_type: string;
  is_read: boolean;
  is_acknowledged: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AlertRule {
  id: string;
  name: string;
  rule_type: string;
  config: Record<string, unknown>;
  severity: string;
  is_active: boolean;
}

export interface TopicData {
  topic: string;
  count: number;
}

export interface ThreatLevel {
  average_threat_score: number;
  high_threat_posts: number;
}

export interface SourceItem {
  id: string;
  name: string;
  platform: string;
  is_active: boolean;
  status: string;
  last_fetched_at: string | null;
  post_count: number;
  error_message: string | null;
}

export interface ReportItem {
  id: string;
  title: string;
  report_type: string;
  file_format: string;
  created_at: string;
}
