import { Suspense, lazy } from 'react'
import { Navigate, Route, HashRouter as Router, Routes } from 'react-router-dom'

import { SurveyRoute } from './pages/public/SurveyRoute'
import { SystemProvider } from './state/SystemProvider'

/**
 * صفحات الإدارة تُحمَّل عند الطلب فقط، فلا تدخل حزمة القياس العام
 * الذي تفتحه الطالبة على الجوال.
 */
const AdminGate = lazy(() => import('./pages/admin/AdminGate').then((m) => ({ default: m.AdminGate })))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })))
const OverviewPage = lazy(() => import('./pages/admin/OverviewPage').then((m) => ({ default: m.OverviewPage })))
const GradeDashboard = lazy(() => import('./pages/admin/GradeDashboard').then((m) => ({ default: m.GradeDashboard })))
const ClassDashboard = lazy(() => import('./pages/admin/ClassDashboard').then((m) => ({ default: m.ClassDashboard })))
const QuestionsPage = lazy(() => import('./pages/admin/QuestionsPage').then((m) => ({ default: m.QuestionsPage })))
const VoicePage = lazy(() => import('./pages/admin/VoicePage').then((m) => ({ default: m.VoicePage })))
const ImprovementPage = lazy(() => import('./pages/admin/ImprovementPage').then((m) => ({ default: m.ImprovementPage })))
const NonRespondentsPage = lazy(() => import('./pages/admin/NonRespondentsPage').then((m) => ({ default: m.NonRespondentsPage })))
const StudentsPage = lazy(() => import('./pages/admin/StudentsPage').then((m) => ({ default: m.StudentsPage })))
const MatchReviewPage = lazy(() => import('./pages/admin/MatchReviewPage').then((m) => ({ default: m.MatchReviewPage })))
const LinksPage = lazy(() => import('./pages/admin/LinksPage').then((m) => ({ default: m.LinksPage })))
const ReviewQueuePage = lazy(() => import('./pages/admin/ReviewQueuePage').then((m) => ({ default: m.ReviewQueuePage })))
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage').then((m) => ({ default: m.ReportsPage })))
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage').then((m) => ({ default: m.SettingsPage })))

function Loading() {
  return <p className="loading" role="status">جارٍ التحميل…</p>
}

export default function App() {
  return (
    <SystemProvider>
      <Router>
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* القياس العام — لا يكشف أي بيانات إدارية */}
            <Route path="/" element={<Navigate to="/survey" replace />} />
            <Route path="/survey" element={<SurveyRoute />} />
            <Route path="/survey/:classId" element={<SurveyRoute />} />

            {/* الإدارة — خلف بوابة دخول */}
            <Route
              path="/admin"
              element={
                <AdminGate>
                  <AdminLayout />
                </AdminGate>
              }
            >
              <Route index element={<OverviewPage />} />
              <Route path="grades/:gradeId" element={<GradeDashboard />} />
              <Route path="classes/:classId" element={<ClassDashboard />} />
              <Route path="questions" element={<QuestionsPage />} />
              <Route path="voice" element={<VoicePage />} />
              <Route path="improvement" element={<ImprovementPage />} />
              <Route path="non-respondents" element={<NonRespondentsPage />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="match-review" element={<MatchReviewPage />} />
              <Route path="review-queue" element={<ReviewQueuePage />} />
              <Route path="links" element={<LinksPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/survey" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </SystemProvider>
  )
}
