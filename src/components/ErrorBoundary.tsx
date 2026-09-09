import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * حاجز أخطاء جذري: بدلًا من شاشة بيضاء صامتة عند أي خطأ غير متوقع (أشهرها
 * إعداد Firebase غير صحيح في .env)، تظهر رسالة عربية واضحة. هذا لا يمنع
 * الخطأ نفسه - فقط يمنع أن تختفي الصفحة بالكامل بلا أي تفسير للمعلمة أو
 * الطالبة.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ maxWidth: 480, margin: "60px auto", padding: 24, textAlign: "center" }}>
          <h1 style={{ color: "#b8285a" }}>حدث خطأ غير متوقع</h1>
          <p>تعذّر تحميل الصفحة. إذا استمرت المشكلة، تواصلي مع الدعم الفني.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "var(--brand-primary, #07a869)",
              color: "#fff",
              border: "none",
              padding: "10px 20px",
              borderRadius: 10,
              fontWeight: 700,
              cursor: "pointer",
              marginTop: 12,
            }}
          >
            إعادة المحاولة
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
