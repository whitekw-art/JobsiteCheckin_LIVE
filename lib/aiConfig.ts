import { prisma } from '@/lib/prisma'

export interface AiConfig {
  jobDescriptionEnabled: boolean
  jobDescriptionPerJobCap: number
  jobDescriptionDailyOrgCap: number
  websiteScanEnabled: boolean
  websiteScanCap: number
  websiteScanWindowDays: number
}

const DEFAULTS: AiConfig = {
  jobDescriptionEnabled: true,
  jobDescriptionPerJobCap: 3,
  jobDescriptionDailyOrgCap: 20,
  websiteScanEnabled: true,
  websiteScanCap: 2,
  websiteScanWindowDays: 7,
}

const KEYS = [
  'ai_job_description_enabled',
  'ai_job_description_per_job_cap',
  'ai_job_description_daily_org_cap',
  'ai_website_scan_enabled',
  'ai_website_scan_cap',
  'ai_website_scan_window_days',
] as const

export async function getAiConfig(): Promise<AiConfig> {
  const rows = await prisma.adminConfig.findMany({ where: { key: { in: [...KEYS] } } })
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]))

  return {
    jobDescriptionEnabled: map['ai_job_description_enabled'] !== 'false',
    jobDescriptionPerJobCap: parseInt(map['ai_job_description_per_job_cap'] ?? '') || DEFAULTS.jobDescriptionPerJobCap,
    jobDescriptionDailyOrgCap: parseInt(map['ai_job_description_daily_org_cap'] ?? '') || DEFAULTS.jobDescriptionDailyOrgCap,
    websiteScanEnabled: map['ai_website_scan_enabled'] !== 'false',
    websiteScanCap: parseInt(map['ai_website_scan_cap'] ?? '') || DEFAULTS.websiteScanCap,
    websiteScanWindowDays: parseInt(map['ai_website_scan_window_days'] ?? '') || DEFAULTS.websiteScanWindowDays,
  }
}

export { DEFAULTS as AI_CONFIG_DEFAULTS }
