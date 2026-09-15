import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { subscribeStudent } from "@/lib/repo";
import { SectionPanel } from "@/components/SectionPanel";
import { GirlAvatar } from "@/components/GirlAvatar";
import { CATEGORY_STYLE } from "@/components/icons";
import { SUBJECT_LABELS } from "@/types/models";
import type { Student } from "@/types/models";

export function StudentDetail({ studentId }: { studentId: string }) {
  const { appUser } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);

  useEffect(() => subscribeStudent(studentId, setStudent), [studentId]);

  if (!student || !appUser?.subject) return <div className="page-loading">جارِ التحميل...</div>;

  const subject = appUser.subject;
  const subjectStyle = CATEGORY_STYLE[subject];
  const SubjectIcon = subjectStyle.Icon;

  return (
    <div className="portfolio" style={{ ["--brand" as string]: student.color }}>
      <Link to="/teacher" className="teacher-dashboard__back">
        ← كل الطالبات
      </Link>
      <div className="readonly-header">
        {student.photoUrl ? <img src={student.photoUrl} alt={student.nickname} /> : <GirlAvatar color={student.color} />}
        <div>
          <h1>{student.nickname || student.name}</h1>
          {student.bio && <p>{student.bio}</p>}
          {student.interests && <p>اهتماماتها: {student.interests}</p>}
        </div>
      </div>

      <div className="section-heading">
        <span className="section-heading__icon" style={{ ["--medallion" as string]: CATEGORY_STYLE.certificate.bg }}>
          <CATEGORY_STYLE.certificate.Icon color={CATEGORY_STYLE.certificate.fg} size={17} />
        </span>
        <h3>شهاداتها</h3>
      </div>
      <SectionPanel studentId={studentId} section="certificate" color={student.color} canAdd={false} />

      <div className="section-heading">
        <span className="section-heading__icon" style={{ ["--medallion" as string]: CATEGORY_STYLE.achievement.bg }}>
          <CATEGORY_STYLE.achievement.Icon color={CATEGORY_STYLE.achievement.fg} size={17} />
        </span>
        <h3>إنجازاتها</h3>
      </div>
      <SectionPanel studentId={studentId} section="achievement" color={student.color} canAdd={false} />

      <div className="section-heading">
        <span className="section-heading__icon" style={{ ["--medallion" as string]: subjectStyle.bg }}>
          <SubjectIcon color={subjectStyle.fg} size={17} />
        </span>
        <h3>أعمال {SUBJECT_LABELS[subject]} - للتقييم</h3>
      </div>
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
