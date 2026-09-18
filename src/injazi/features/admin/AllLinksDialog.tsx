/*
  كل الروابط في شاشة واحدة.
  ------------------------------------------------------------------
  كان استخراج روابط الطالبات الثماني يعني ثماني جولات: افتحي صفّها،
  افتحي نافذتها، انسخي، أغلقي، كرّري. على جوّال هذا شاقّ ويُخطئ فيه
  المرء بسهولة، والمشرفة تفعله مرة واحدة ثم ترسله لثماني أسر.

  هنا: القائمة كاملة، وزر واحد ينسخها كلها بأسمائها جاهزةً للّصق في
  واتساب. ولمن تريد رابطًا واحدًا فقط، بجانب كل اسم زر نسخه وحده.

  لا يُنشئ هذا المكوّن روابط ولا يُلغيها: يعرض ما وُلّد فعلًا. الإنشاء
  والإلغاء يبقيان في نافذة الطالبة حيث التحذير والتأكيد — وشاشة عرض
  لا يصحّ أن تُخفي فعلًا خطيرًا داخل «نسخ الكل».
*/
import { useState } from "react";
import { Copy, Link2 } from "lucide-react";
import { ClayButton } from "@/injazi/components/ClayButton";
import { Modal } from "@/injazi/ui/Modal";
import { Notice } from "@/injazi/ui/primitives";
import { copyText, studentUrl } from "@/injazi/lib/inviteLink";
import { showToast } from "@/injazi/lib/toast";
import type { Student, StudentLink } from "@/injazi/types/models";

type Props = {
  open: boolean;
  students: Student[];
  links: StudentLink[];
  onClose: () => void;
};

export function AllLinksDialog({ open, students, links, onClose }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  // الترتيب ترتيب الطالبات نفسه في اللوحة، فما تراه هو ما تنسخه.
  const rows = students
    .map((student) => {
      const link = links.find((entry) => entry.studentId === student.id && entry.active);
      return { student, url: link ? studentUrl(link.id) : null };
    })
    .filter((row) => row.url !== null) as { student: Student; url: string }[];

  const missing = students.length - rows.length;

  async function copyOne(name: string, url: string) {
    const okay = await copyText(url);
    setCopied(okay ? name : null);
    showToast(okay ? `نُسخ رابط ${name}` : "تعذّر النسخ — انسخيه يدويًا", okay ? "success" : "info");
  }

  async function copyAll() {
    // سطران لكل طالبة: اسمها ثم رابطها. الشكل هذا يُلصق في واتساب
    // فيُقرأ كما هو، ولا يحتاج المشرفة إلى ترتيبه بعد اللصق.
    const text = rows.map((row) => `${row.student.name}\n${row.url}`).join("\n\n");
    const okay = await copyText(text);
    showToast(
      okay ? `نُسخت ${rows.length} روابط` : "تعذّر النسخ — انسخي كل رابط وحده",
      okay ? "success" : "info",
    );
  }

  return (
    <Modal
      open={open}
      title="روابط الطالبات"
      onClose={onClose}
      footer={
        <>
          <ClayButton variant="soft" onClick={onClose}>
            إغلاق
          </ClayButton>
          <ClayButton
            onClick={copyAll}
            disabled={rows.length === 0}
            icon={<Copy size={17} strokeWidth={2.4} />}
          >
            نسخ الكل ({rows.length})
          </ClayButton>
        </>
      }
    >
      <Notice tone="warn">
        كل رابط يفتح ملف صاحبته ويسمح بالتعديل فيه. أرسلي رابط كل طالبة لها ولولي أمرها وحدهما.
      </Notice>

      {missing > 0 && (
        <Notice tone="info">
          {missing} طالبة بلا رابط بعد. أنشئي رابطها من زر «رابطها» في صفّها.
        </Notice>
      )}

      {rows.length === 0 ? (
        <p className="iz-field__meter">لم يُنشأ أي رابط بعد.</p>
      ) : (
        <ul className="iz-links-list">
          {rows.map((row) => (
            <li key={row.student.id} className="iz-links-list__row">
              <div className="iz-links-list__text">
                <strong>{row.student.name}</strong>
                {/* الرابط كاملًا لا مقصوصًا: المشرفة تتحقّق بعينها أن ما
                    نسخته هو ما سترسله، والقصّ يُخفي اختلاف رمزين. */}
                <code className="iz-links-list__url">{row.url}</code>
              </div>
              <ClayButton
                variant="soft"
                size="sm"
                icon={<Link2 size={15} strokeWidth={2.5} />}
                onClick={() => copyOne(row.student.name, row.url)}
              >
                {copied === row.student.name ? "نُسخ" : "نسخ"}
              </ClayButton>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
