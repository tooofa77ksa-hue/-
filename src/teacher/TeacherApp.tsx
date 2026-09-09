import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import { RequireAuth } from "./RequireAuth";
import { DashboardLayout } from "./DashboardLayout";
import { DashboardHome } from "./DashboardHome";
import { QuestionsPage } from "./QuestionsPage";
import { QuestionForm } from "./QuestionForm";
import { QuestionSetsPage } from "./QuestionSetsPage";
import { SettingsPage } from "./SettingsPage";
import { StudentsPage } from "./StudentsPage";
import { GroupsPage } from "./GroupsPage";
import { TestsPage } from "./TestsPage";
import { ResultsPage } from "./ResultsPage";
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
            <Route path="students" element={<StudentsPage />} />
            <Route path="groups" element={<GroupsPage />} />
            <Route path="tests" element={<TestsPage />} />
            <Route path="results" element={<ResultsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </RequireAuth>
    </AuthProvider>
  );
}
