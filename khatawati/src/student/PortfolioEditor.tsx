import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { subscribeStudent, updateStudentProfile } from "@/lib/repo";
import { subscribeUnseenCount } from "@/lib/notifications";
import { compressImageToDataUrl } from "@/lib/imageCompress";
import { SectionPanel } from "@/components/SectionPanel";
import type { Student } from "@/types/models";

const COLORS = ["#e0568c", "#8b5fbf", "#2e9bd6", "#2ab07f", "#f0a340", "#e2554a"];
type Tab = "about" | "lughati" | "riyadiyat";

export function PortfolioEditor() {
  const { appUser } = useAuth();
  const studentId = appUser?.studentId;
  const [student, setStudent] = useState<Student | null>(null);
  const [tab, setTab] = useState<Tab>("about");
  const [unseen, setUnseen] = useState(0);

  const [nickname, setNickname] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    return subscribeStudent(studentId, (s) => {
      setStudent(s);
      if (s && !dirty) {
        setNickname(s.nickname);
        setColor(s.color);
        setBio(s.bio);
        setInterests(s.interests);
        setPhotoUrl(s.photoUrl);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  useEffect(() => {
    if (!studentId) return;
    return subscribeUnseenCount(studentId, setUnseen);
  }, [studentId]);

  if (!studentId) return <div className="page-loading">جارِ التحميل...</div>;
  if (!student) return <div className="page-loading">جارِ التحميل...</div>;

  const handlePhoto = async (file: File | null) => {
    if (!file) return;
    const dataUrl = await compressImageToDataUrl(file, 400, 0.75);
    setPhotoUrl(dataUrl);
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateStudentProfile(studentId, { nickname, color, photoUrl, bio, interests });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="portfolio" style={{ ["--brand" as string]: color }}>
      <header className="portfolio__header">
        <div className="portfolio__photo">
          {photoUrl ? <img src={photoUrl} alt={nickname} /> : <div className="portfolio__photo-placeholder">👧</div>}
          <label className="portfolio__photo-change">
            تغيير الصورة
            <input type="file" accept="image/*" onChange={(e) => handlePhoto(e.target.files?.[0] ?? null)} hidden />
          </label>
          {photoUrl && (
            <button
              type="button"
              className="portfolio__photo-remove"
              onClick={() => {
                setPhotoUrl(null);
                setDirty(true);
              }}
            >
              حذف الصورة
            </button>
          )}
        </div>
        <div className="portfolio__identity">
          <input
            className="portfolio__nickname"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setDirty(true);
            }}
          />
          <div className="portfolio__colors">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`portfolio__color ${c === color ? "is-active" : ""}`}
                style={{ background: c }}
                onClick={() => {
                  setColor(c);
                  setDirty(true);
                }}
                aria-label={c}
              />
            ))}
          </div>
        </div>
      </header>

      {unseen > 0 && (
        <div className="portfolio__notify">
          🎉 عندك {unseen} تقييم جديد من المعلمة! افتحي "لغتي" أو "رياضيات" لتشوفيه.
        </div>
      )}

      <section className="portfolio__about-fields">
        <label>
          نبذة عني
          <textarea
            value={bio}
            onChange={(e) => {
              setBio(e.target.value);
              setDirty(true);
            }}
            maxLength={2000}
            rows={3}
          />
        </label>
        <label>
          اهتماماتي
          <textarea
            value={interests}
            onChange={(e) => {
              setInterests(e.target.value);
              setDirty(true);
            }}
            maxLength={1000}
            rows={2}
          />
        </label>
        {dirty && (
          <button type="button" className="portfolio__save" onClick={save} disabled={saving}>
            {saving ? "جارِ الحفظ..." : "حفظ التعديلات"}
          </button>
        )}
      </section>

      <nav className="portfolio__tabs">
        <button className={tab === "about" ? "is-active" : ""} onClick={() => setTab("about")}>
          شهاداتي وإنجازاتي
        </button>
        <button className={tab === "lughati" ? "is-active" : ""} onClick={() => setTab("lughati")}>
          لغتي
        </button>
        <button className={tab === "riyadiyat" ? "is-active" : ""} onClick={() => setTab("riyadiyat")}>
          رياضيات
        </button>
      </nav>

      {tab === "about" && (
        <div className="portfolio__about-tab">
          <div>
            <h3>شهاداتي</h3>
            <SectionPanel studentId={studentId} section="certificate" color={color} canAdd />
          </div>
          <div>
            <h3>إنجازاتي</h3>
            <SectionPanel studentId={studentId} section="achievement" color={color} canAdd />
          </div>
        </div>
      )}
      {tab === "lughati" && (
        <SectionPanel studentId={studentId} section="lughati" color={color} canAdd markSeenOnMount />
      )}
      {tab === "riyadiyat" && (
        <SectionPanel studentId={studentId} section="riyadiyat" color={color} canAdd markSeenOnMount />
      )}
    </div>
  );
}
