/*
  بطاقة مشروع.
  تعرض التقييم إن وُجد، لأن أول ما تبحث عنه الطالبة وولي الأمر هو رأي
  المعلمة. الروابط تُفتح في تبويب جديد مع rel="noopener noreferrer"
  دائمًا — الرابط هنا يأتي من مُدخلات المستخدمة.
*/
import { motion } from "motion/react";
import { Media } from "@/injazi/ui/Media";
import { ArchiveRestore, Archive, CalendarDays, ExternalLink, Eye, FileText, Film, Pencil, Trash2 } from "lucide-react";
import { ClayCard } from "@/injazi/components/ClayCard";
import { ClayObject } from "@/injazi/components/ClayObject";
import { Chip } from "@/injazi/ui/primitives";
import { Rating } from "@/injazi/ui/Rating";
import { Icon } from "@/injazi/ui/IconPicker";
import { VISIBILITY_LABEL } from "@/injazi/lib/permissions";
import { popItem } from "@/injazi/motion/motion";
import type { Evaluation, Project, Subject } from "@/injazi/types/models";

const STATUS_CHIP: Record<Evaluation["status"], { label: string; tone: "success" | "warn" | "gold" }> = {
  excellent: { label: "متميّز", tone: "gold" },
  complete: { label: "مكتمل", tone: "success" },
  "needs-revision": { label: "يحتاج مراجعة", tone: "warn" },
};

type Props = {
  project: Project;
  subject?: Subject;
  evaluations: Evaluation[];
  canEdit: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
  onOpen?: () => void;
};

export function ProjectCard({ project, subject, evaluations, canEdit, onEdit, onDelete, onArchive, onOpen }: Props) {
  const best = evaluations.find((entry) => entry.projectId === project.id);
  const attachments = project.media.length + project.links.length;

  return (
    <motion.div variants={popItem}>
      <ClayCard>
        <article className="iz-project">
          <button
            type="button"
            className="iz-project__open"
            onClick={onOpen}
            aria-label={`عرض تفاصيل ${project.title}`}
          >
            <div className="iz-project__cover">
              {project.coverUrl ? (
                <Media src={project.coverUrl} alt="" />
              ) : (
                <span className={`iz-project__cover-fallback iz-tone--${subject?.tone ?? "lilac"}`}>
                  <Icon name={subject?.icon ?? "BookOpen"} size={30} />
                </span>
              )}
              {best?.badge && (
                <span className="iz-project__badge" title="شارة تميّز">
                  <ClayObject name="crown" tone="gold" size={26} grounded={false} />
                </span>
              )}
            </div>

            <div className="iz-project__body">
              <h4 className="iz-project__title">{project.title}</h4>
              <p className="iz-project__meta">
                <CalendarDays size={14} strokeWidth={2.4} aria-hidden="true" />
                {project.date}
                {subject && <span className="iz-project__subject">· {subject.name}</span>}
              </p>
              {project.description && <p className="iz-project__desc">{project.description}</p>}

              <div className="iz-project__tags">
                {best && <Rating value={best.stars} size={17} readOnly />}
                {best && <Chip tone={STATUS_CHIP[best.status].tone}>{STATUS_CHIP[best.status].label}</Chip>}
                {attachments > 0 && (
                  <Chip>
                    {project.media.some((item) => item.kind === "video") ? (
                      <Film size={14} strokeWidth={2.4} aria-hidden="true" />
                    ) : (
                      <FileText size={14} strokeWidth={2.4} aria-hidden="true" />
                    )}
                    {attachments} مرفق
                  </Chip>
                )}
                {project.archived && <Chip tone="warn">مؤرشف</Chip>}
                {project.visibility !== "public" && (
                  <Chip tone="info">
                    <Eye size={14} strokeWidth={2.4} aria-hidden="true" />
                    {VISIBILITY_LABEL[project.visibility]}
                  </Chip>
                )}
              </div>
            </div>
          </button>

          {project.links.length > 0 && (
            <div className="iz-project__links">
              {project.links.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="iz-project__link"
                >
                  <ExternalLink size={14} strokeWidth={2.4} aria-hidden="true" />
                  {link.label}
                </a>
              ))}
            </div>
          )}

          {canEdit && (
            <div className="iz-project__actions">
              <button type="button" className="iz-icon-btn" onClick={onEdit} aria-label={`تعديل ${project.title}`}>
                <Pencil size={16} strokeWidth={2.5} />
              </button>
              {/* المؤرشف يُستعاد بكلمة مكتوبة لا بأيقونة: من يبحث عن التراجع
                  لا يعرف أي رسم يعنيه، و title لا يظهر على شاشة تُلمَس.
                  الأرشفة نفسها تبقى أيقونة — فهي فعل يُبحث عنه لا يُتعثَّر به. */}
              <button
                type="button"
                className={project.archived ? "iz-icon-btn iz-icon-btn--wide" : "iz-icon-btn"}
                onClick={onArchive}
                aria-label={`${project.archived ? "استعادة" : "أرشفة"} ${project.title}`}
                title={project.archived ? "استعادة" : "أرشفة"}
              >
                {project.archived ? (
                  <>
                    <ArchiveRestore size={16} strokeWidth={2.5} />
                    استعادة
                  </>
                ) : (
                  <Archive size={16} strokeWidth={2.5} />
                )}
              </button>
              <button
                type="button"
                className="iz-icon-btn iz-icon-btn--danger"
                onClick={onDelete}
                aria-label={`حذف ${project.title}`}
              >
                <Trash2 size={16} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </article>
      </ClayCard>
    </motion.div>
  );
}
