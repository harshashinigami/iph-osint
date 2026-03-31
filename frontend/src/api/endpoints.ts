import api from './client';
import type { DashboardStats, VolumeData, PlatformData, SentimentData, GeoData, EntityItem, GraphData, AlertItem, AlertRule, TopicData, ThreatLevel, SourceItem, ReportItem, PostItem } from '../types';

// Auth
export const login = (username: string, password: string) =>
  api.post('/auth/login', { username, password });

// Dashboard
export const getStats = () => api.get<DashboardStats>('/api/v1/dashboard/stats');
export const getVolumeTimeline = (days = 30) => api.get<VolumeData[]>('/api/v1/dashboard/volume-timeline', { params: { days } });
export const getPlatformBreakdown = () => api.get<PlatformData[]>('/api/v1/dashboard/platform-breakdown');
export const getSentimentOverview = () => api.get<SentimentData[]>('/api/v1/dashboard/sentiment-overview');
export const getThreatLevel = () => api.get<ThreatLevel>('/api/v1/dashboard/threat-level');
export const getTopEntities = (limit = 10) => api.get<EntityItem[]>('/api/v1/dashboard/top-entities', { params: { limit } });
export const getGeoData = () => api.get<GeoData[]>('/api/v1/dashboard/geo-data');
export const getRecentAlerts = (limit = 20) => api.get<AlertItem[]>('/api/v1/dashboard/recent-alerts', { params: { limit } });
export const getTrendingTopics = () => api.get<TopicData[]>('/api/v1/dashboard/trending-topics');

// Entities
export const getEntities = (params?: Record<string, unknown>) => api.get<EntityItem[]>('/api/v1/entities', { params });
export const getEntity = (id: string) => api.get('/api/v1/entities/' + id);
export const getGraphData = (params?: Record<string, unknown>) => api.get<GraphData>('/api/v1/entities/graph/data', { params });
export const getShortestPath = (sourceId: string, targetId: string) =>
  api.get('/api/v1/entities/graph/shortest-path', { params: { source_id: sourceId, target_id: targetId } });

// Alerts
export const getAlerts = (params?: Record<string, unknown>) => api.get<AlertItem[]>('/api/v1/alerts', { params });
export const acknowledgeAlert = (id: string) => api.patch(`/api/v1/alerts/${id}/acknowledge`);
export const getAlertRules = () => api.get<AlertRule[]>('/api/v1/alerts/rules');
export const createAlertRule = (data: Record<string, unknown>) => api.post('/api/v1/alerts/rules', data);
export const getAlertStats = () => api.get('/api/v1/alerts/stats');

// Ingestion
export const getSources = () => api.get<SourceItem[]>('/api/v1/ingestion/sources');
export const getPosts = (params?: { platform?: string; limit?: number; offset?: number }) =>
  api.get<PostItem[]>('/api/v1/ingestion/posts', { params });
export const toggleSource = (id: string, isActive: boolean) => api.patch(`/api/v1/ingestion/sources/${id}`, { is_active: isActive });

// Reports
export const getReports = () => api.get<ReportItem[]>('/api/v1/reports');
export const generateReport = (data: Record<string, unknown>) => api.post('/api/v1/reports/generate', data);

// Seed
export const runSeed = () => api.post('/api/v1/seed/run');
export const resetSeed = () => api.post('/api/v1/seed/reset');
