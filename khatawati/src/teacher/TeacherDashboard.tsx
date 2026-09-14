import { useEffect, useState } from "react";
import { Link, Route, Routes, useParams } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { listAllStudents } from "@/lib/repo";
import { StudentDetail } from "./StudentDetail";
import { SUBJECT_LABELS } from "@/types/models";
import type { Student } from "@/types/models";

function StudentsList() {
  const { appUser } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAllStudents()
      .then(setStudents)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">جارِ التحميل...</div>;

  return (
    <div className="teacher-dashboard">
      <h1>
        طالبات الصف الثالث <span className="teacher-dashboard__subject">- تصحيح {appUser?.subject && SUBJECT_LABELS[appUser.subject]}</span>
      </h1>
      <div className="teacher-dashboard__grid">
        {students.map((s) => (
          <Link key={s.id} to={`/teacher/${s.id}`} className="student-tile" style={{ ["--brand" as string]: s.color }}>
            {s.photoUrl ? <img src={s.photoUrl} alt={s.nickname} /> : <div className="student-tile__placeholder">👧</div>}
            <span>{s.nickname || s.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function TeacherDashboard() {
  return (
    <Routes>
      <Route index element={<StudentsList />} />
      <Route path=":studentId" element={<StudentDetailRoute />} />
    </Routes>
  );
}

function StudentDetailRoute() {
  const { studentId } = useParams();
  if (!studentId) return null;
  return <StudentDetail studentId={studentId} />;
}
