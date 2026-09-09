import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import { RequireAuth } from "./RequireAuth";
import { DashboardLayout } from "./DashboardLayout";
import { DashboardHome } from "./DashboardHome";
import { QuestionsPage } from "./QuestionsPage";
import { QuestionForm } from "./QuestionForm";
import { QuestionSetsPage } from "./QuestionSetsPage";
import { SettingsPage } from "./SettingsPage";
import "./teacher.css";

export default function TeacherApp() {
  return (
    <AuthProvider>
      <RequireAuth>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="questions" element={<QuestionsPage />} />
            <Route path="questions/new" element={<QuestionForm />} />
            <Route path="questions/:id/edit" element={<QuestionForm />} />
            <Route path="sets" element={<QuestionSetsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </RequireAuth>
    </AuthProvider>
  );
}
