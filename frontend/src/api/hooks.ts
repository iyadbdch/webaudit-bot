import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { DashboardData, Site, UptimeLog, AuditResult, LighthouseReport, ChangeLog } from './client';

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then((r) => r.data),
    refetchInterval: 30000,
  });
}

export function useSites() {
  return useQuery<Site[]>({
    queryKey: ['sites'],
    queryFn: () => api.get('/sites').then((r) => r.data),
  });
}

export function useSite(id: string) {
  return useQuery<Site>({
    queryKey: ['site', id],
    queryFn: () => api.get(`/sites/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Site>) => api.post('/sites', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sites'] }),
  });
}

export function useUpdateSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Site>) =>
      api.patch(`/sites/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sites'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}

export function useDeleteSite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/sites/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sites'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}

export function useUptimeLogs(siteId: string) {
  return useQuery<UptimeLog[]>({
    queryKey: ['uptime', siteId],
    queryFn: () => api.get(`/sites/${siteId}/uptime?limit=50`).then((r) => r.data),
    enabled: !!siteId,
    refetchInterval: 30000,
  });
}

export function useAudits(siteId: string) {
  return useQuery<AuditResult[]>({
    queryKey: ['audits', siteId],
    queryFn: () => api.get(`/sites/${siteId}/audits`).then((r) => r.data),
    enabled: !!siteId,
  });
}

export function useLighthouse(siteId: string) {
  return useQuery<LighthouseReport[]>({
    queryKey: ['lighthouse', siteId],
    queryFn: () => api.get(`/sites/${siteId}/lighthouse`).then((r) => r.data),
    enabled: !!siteId,
  });
}

export function useChanges(siteId: string) {
  return useQuery<ChangeLog[]>({
    queryKey: ['changes', siteId],
    queryFn: () => api.get(`/sites/${siteId}/changes`).then((r) => r.data),
    enabled: !!siteId,
  });
}

export function useRunUptimeCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (siteId: string) => api.post(`/sites/${siteId}/uptime/check`),
    onSuccess: (_data, siteId) => qc.invalidateQueries({ queryKey: ['uptime', siteId] }),
  });
}

export function useRunAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (siteId: string) => api.post(`/sites/${siteId}/audits/run`),
    onSuccess: (_data, siteId) => qc.invalidateQueries({ queryKey: ['audits', siteId] }),
  });
}

export function useRunLighthouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (siteId: string) => api.post(`/sites/${siteId}/lighthouse/run`),
    onSuccess: (_data, siteId) => qc.invalidateQueries({ queryKey: ['lighthouse', siteId] }),
  });
}
