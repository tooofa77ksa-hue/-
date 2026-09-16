/*
  نافذة التقييم.
  المعلمة ترى المشروع ومرفقاته ثم تقيّم. التقييم مفتاحه مركّب
  (مشروع × معلمة) فتعديل تقييمها لاحقًا يحدّثه ولا ينشئ تقييمًا ثانيًا.
  منح شارة التميّز يُشغّل لحظة التاج مرة واحدة عند المنح فقط.
*/
import { useEffect, useState } from "react";
import { Media } from "@/injazi/ui/Media";
import { ExternalLink, FileText, Film } from "lucide-react";
import { ClayButton } from "@/injazi/components/ClayButton";
import { ClayObject } from "@/injazi/components/ClayObject";
import { CrownCelebration } from "@/injazi/components/CrownCelebration";
import { Modal } from "@/injazi/ui/Modal";
import { Field, Notice, SelectInput, TextArea } from "@/injazi/ui/primitives";
import { Rating } from "@/injazi/ui/Rating";
import { logActivity, saveEvaluation } from "@/injazi/services/repo";
import { showToast } from "@/injazi/lib/toast";
import type {
  Evaluation,
  EvaluationStatus,
  Project,
  Student,
  Subject,
  UserDoc,
} from "@/injazi/types/models";

const STATUS_OPTIONS: { value: EvaluationStatus; label: string }[] = [
  { value: "excellent", label: "متميّز" },
  { value: "complete", label: "مكتمل" },
  { value: "needs-revision", label: "يحتاج مراجعة" },
];

type Props = {
  open: boolean;
  project: Project | null;
  student: Student | undefined;
  subject: Subject | undefined;
  existing: Evaluation | undefined;
  teacher: UserDoc | null;
  onClose: () => void;
};

export function EvaluationEditor({
  open,
  project,
  student,
  subject,
  existing,
  teacher,
  onClose,
}: Props) {
  const [stars, setStars] = useState(5);
  const [badge, setBadge] = useState(false);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<EvaluationStatus>("complete");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStars(existing?.stars ?? 5);
    setBadge(existing?.badge ?? false);
    setComment(existing?.comment ?? "");
    setStatus(existing?.status ?? "complete");
    setError(null);
  }, [open, existing]);

  async function save() {
    if (!project || !teacher || saving) return;
    setSaving(true);
    setError(null);
    try {
      await saveEvaluation({
        projectId: project.id,
        studentId: project.studentId,
        subjectId: project.subjectId,
        teacherId: teacher.teacherId ?? teacher.id,
        teacherName: teacher.name,
        stars,
        badge,
        comment: comment.trim(),
        status,
      });
      await logActivity(
        "evaluation.save",
        `قيّمت ${teacher.name} مشروع «${project.title}» لـ ${student?.name ?? "طالبة"}`,
        teacher.name,
        teacher.role,
      );
      showToast("تم حفظ التقييم");

      // الاحتفال يظهر عند منح الشارة لأول مرة فقط، لا مع كل حفظ.
      if (badge && !existing?.badge) {
        setCelebrate(true);
        window.setTimeout(onClose, 2200);
      } else {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر حفظ التقييم.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Modal
        open={open}
        title={project ? `تقييم: ${project.title}` : "تقييم"}
        onClose={onClose}
        size="lg"
        footer={
          <>
            <ClayButton variant="soft" onClick={onClose} disabled={saving}>
              إلغاء
            </ClayButton>
            <ClayButton onClick={save} loading={saving}>
              حفظ التقييم
            </ClayButton>
          </>
        }
      >
        {project && (
          <>
            <div className="iz-eval-context">
              {project.coverUrl && <Media src={project.coverUrl} alt="" className="iz-eval-context__cover" />}
              <div>
                <p className="iz-eval-context__student">{student?.name ?? "طالبة"}</p>
                <p className="iz-eval-context__subject">
                  {subject?.name ?? "مادة"} · {project.date}
                </p>
                {project.description && <p className="iz-eval-context__desc">{project.description}</p>}
              </div>
            </div>

            {(project.media.length > 0 || project.links.length > 0) && (
              <section className="iz-editor-block">
                <h3 className="iz-editor-block__title">مرفقات المشروع</h3>
                <div className="iz-media-grid">
                  {project.media.map((item) =>
                    item.kind === "image" ? (
                      <a key={item.id} href={item.url} target="_blank" rel="noopener noreferrer" className="iz-thumb">
                        <Media src={item.url} alt={item.name} />
                      </a>
                    ) : (
                      <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="iz-thumb iz-thumb__file"
                      >
                        {item.kind === "video" ? <Film size={20} /> : <FileText size={20} />}
                        <span>{item.name}</span>
                      </a>
                    ),
                  )}
                  {project.links.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="iz-thumb iz-thumb__file"
                    >
                      <ExternalLink size={20} />
                      <span>{link.label}</span>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <Field label="النجوم">
          <Rating value={stars} onChange={setStars} size={34} label="تقييم المشروع بالنجوم" />
        </Field>

        <Field label="الحالة">
          <SelectInput value={status} onChange={(event) => setStatus(event.target.value as EvaluationStatus)}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </Field>

        <button
          type="button"
          className={`iz-badge-toggle ${badge ? "is-on" : ""}`}
          onClick={() => setBadge((value) => !value)}
          aria-pressed={badge}
        >
          <ClayObject name="crown" tone="gold" size={34} grounded={false} />
          <span>
            <strong>شارة التميّز</strong>
            <em>{badge ? "ممنوحة لهذا المشروع" : "اضغطي لمنح الشارة"}</em>
          </span>
        </button>

        <Field label="تعليق المعلمة">
          <TextArea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            maxLength={600}
            placeholder="ما الذي أعجبكِ؟ وما الذي تقترحينه للمرة القادمة؟"
          />
        </Field>

        {error && <Notice tone="danger">{error}</Notice>}
      </Modal>

      <CrownCelebration
        open={celebrate}
        subjectName={subject?.name ?? "المادة"}
        onClose={() => setCelebrate(false)}
      />
    </>
  );
}
