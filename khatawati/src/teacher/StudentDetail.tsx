import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { subscribeStudent } from "@/lib/repo";
import { SectionPanel } from "@/components/SectionPanel";
import { SUBJECT_LABELS } from "@/types/models";
import type { Student } from "@/types/models";

export function StudentDetail({ studentId }: { studentId: string }) {
  const { appUser } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);

  useEffect(() => subscribeStudent(studentId, setStudent), [studentId]);

  if (!student || !appUser?.subject) return <div className="page-loading">جارِ التحميل...</div>;

  const subject = appUser.subject;

  return (
    <div className="portfolio portfolio--readonly" style={{ ["--brand" as string]: student.color }}>
      <Link to="/teacher" className="teacher-dashboard__back">
        ← كل الطالبات
      </Link>
      <header className="portfolio__header portfolio__header--readonly">
        {student.photoUrl ? <img className="portfolio__photo-ro" src={student.photoUrl} alt={student.nickname} /> : null}
        <div>
          <h1>{student.nickname || student.name}</h1>
          {student.bio && <p>{student.bio}</p>}
          {student.interests && (
            <p>
              <strong>اهتماماتها:</strong> {student.interests}
            </p>
          )}
        </div>
      </header>

      <div className="portfolio__about-tab">
        <div>
          <h3>شهاداتها</h3>
          <SectionPanel studentId={studentId} section="certificate" color={student.color} canAdd={false} />
        </div>
        <div>
          <h3>إنجازاتها</h3>
          <SectionPanel studentId={studentId} section="achievement" color={student.color} canAdd={false} />
        </div>
      </div>

      <h3 className="teacher-dashboard__subject-title">أعمال {SUBJECT_LABELS[subject]} - للتقييم</h3>
      <SectionPanel
        studentId={studentId}
        section={subject}
        color={student.color}
        canAdd={false}
        rater={{ teacherUid: appUser.uid, subject }}
      />
    </div>
  );
}
