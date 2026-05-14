'use server'

import {
  getOrCreateShareLink,
  type ReportType,
  type ShareLink,
} from '@/lib/db/share-links'

export async function createShareLinkAction(
  reportType: ReportType,
  reportId: string,
  clientId: string,
): Promise<ShareLink> {
  return getOrCreateShareLink(reportType, reportId, clientId)
}
