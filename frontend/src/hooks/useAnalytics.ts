import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../constants/routes'
import { analyticsService } from '../services/analyticsService'

export function useAnalyticsSummary() { return useQuery({ queryKey: queryKeys.analyticsSummary, queryFn: analyticsService.summary }) }
export function useDailyAnalytics() { return useQuery({ queryKey: queryKeys.analyticsDaily, queryFn: analyticsService.daily }) }
export function useWeeklyAnalytics() { return useQuery({ queryKey: queryKeys.analyticsWeekly, queryFn: analyticsService.weekly }) }
export function useMonthlyAnalytics() { return useQuery({ queryKey: queryKeys.analyticsMonthly, queryFn: analyticsService.monthly }) }
export function useVideoAnalytics(id: string | null) { return useQuery({ queryKey: queryKeys.analyticsVideo(id || ''), queryFn: () => analyticsService.video(id!), enabled: Boolean(id) }) }