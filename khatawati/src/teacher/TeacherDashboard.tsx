import { useEffect, useState } from "react";
import { Link, Route, Routes, useParams } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { listAllStudents } from "@/lib/repo";
import { StudentDetail } from "./StudentDetail";
import { GirlAvatar } from "@/components/GirlAvatar";
import { SUBJECT_LABELS } from "@/types/models";
import type { Student } from "@/types/models";

function StudentsList() {
  const { appUser } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    listAllStudents()
      .then(setStudents)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading">جارِ التحميل...</div>;

  const filtered = students.filter((s) => (s.nickname || s.name).includes(query.trim()));

  return (
    <div className="teacher-dashboard">
      <div className="teacher-dashboard__intro">
        <div>
          <h1>طالبات الصف الثالث</h1>
          {appUser?.subject && (
            <span className="teacher-dashboard__subject-badge">تصحيح {SUBJECT_LABELS[appUser.subject]}</span>
          )}
        </div>
      </div>

      <input
        className="teacher-dashboard__search"
        placeholder="ابحثي عن طالبة بالاسم..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="teacher-dashboard__grid">
        {filtered.map((s) => (
          <Link key={s.id} to={`/teacher/${s.id}`} className="student-tile" style={{ ["--brand" as string]: s.color }}>
            {s.photoUrl ? <img src={s.photoUrl} alt={s.nickname} /> : <GirlAvatar color={s.color} />}
            <span>{s.nickname || s.name}</span>
          </Link>
        ))}
        {filtered.length === 0 && <p className="section-panel__empty">ما فيه طالبة بهذا الاسم</p>}
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
