/** تعريفات سكربت الرفع، ليستخدمه اختبار الاتفاق مع طبقة المتصفّح. */
import type { SystemState } from '../../src/domain/types'

export declare function readState(): SystemState
export declare function buildDocuments(
  state: SystemState,
): { path: string; id: string; data: Record<string, unknown> }[]
