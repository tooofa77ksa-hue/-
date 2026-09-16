/*
  حارس المسارات.
  يحجب الواجهة عمّن لا يملك الدور، ويحتفظ بالمسار المقصود ليعود إليه
  بعد الدخول. هذا حارس واجهة فقط — البيانات محميّة في القواعد الأمنية.
*/
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { ClayObject } from "@/injazi/components/ClayObject";
import { EmptyState } from "@/injazi/components/EmptyState";
import { ClayButton } from "@/injazi/components/ClayButton";
import { useSession } from "@/injazi/hooks/useLive";
import type { Role } from "@/injazi/types/models";

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { profile, loading } = useSession();
  const location = useLocation();

  if (loading) {
    return (
      <div className="iz-page iz-center">
        <ClayObject name="star" tone="gold" size={72} />
        <p className="iz-field__meter">جارٍ التحقق من الصلاحية…</p>
      </div>
    );
  }

  if (!profile) {
    const to = roles.includes("admin") ? "/admin/login" : roles.includes("teacher") ? "/teacher/login" : "/login";
    return <Navigate to={to} replace state={{ from: location.pathname }} />;
  }

  if (!roles.includes(profile.role) || profile.active === false) {
    return (
      <div className="iz-page iz-page--narrow">
        <EmptyState
          object="crown"
          tone="apricot"
          title="هذه الصفحة ليست لحسابكِ"
          body={`حسابكِ مسجَّل بدور «${profile.role}»، وهذه الصفحة تحتاج صلاحية مختلفة.`}
          action={
            <ClayButton to="/" size="lg">
              العودة للرئيسية
            </ClayButton>
          }
        />
      </div>
    );
  }

  return <>{children}</>;
}
