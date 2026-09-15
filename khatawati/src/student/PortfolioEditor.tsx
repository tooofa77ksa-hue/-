import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { subscribeItems, subscribeStudent, updateStudentProfile } from "@/lib/repo";
import { subscribeUnseenCount } from "@/lib/notifications";
import { compressImageToDataUrl } from "@/lib/imageCompress";
import { SectionPanel } from "@/components/SectionPanel";
import { GirlAvatar } from "@/components/GirlAvatar";
import { CATEGORY_STYLE } from "@/components/icons";
import type { PortfolioItem, Student } from "@/types/models";

const COLORS = ["#ec5c8d", "#8b5fbf", "#2f9bd6", "#21a67a", "#f2a63c", "#e2554a"];
type Tab = "about" | "lughati" | "riyadiyat";

const NAV_ITEMS: { tab: Tab; label: string; style: (typeof CATEGORY_STYLE)[keyof typeof CATEGORY_STYLE] }[] = [
  { tab: "about", label: "شهاداتي وإنجازاتي", style: CATEGORY_STYLE.certificate },
  { tab: "lughati", label: "لغتي", style: CATEGORY_STYLE.lughati },
  { tab: "riyadiyat", label: "رياضيات", style: CATEGORY_STYLE.riyadiyat },
];

export function PortfolioEditor() {
  const { appUser } = useAuth();
  const studentId = appUser?.studentId;
  const [student, setStudent] = useState<Student | null>(null);
  const [tab, setTab] = useState<Tab>("about");
  const [unseen, setUnseen] = useState(0);
  const [allItems, setAllItems] = useState<PortfolioItem[]>([]);

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

  useEffect(() => {
    if (!studentId) return;
    return subscribeItems(studentId, null, setAllItems);
  }, [studentId]);

  if (!studentId) return <div className="page-loading">جارِ التحميل...</div>;
  if (!student) return <div className="page-loading">جارِ التحميل...</div>;

  const countOf = (section: PortfolioItem["section"]) => allItems.filter((it) => it.section === section).length;

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
      <div className="profile-card">
        <div className="profile-card__avatar">
          {photoUrl ? <img src={photoUrl} alt={nickname} /> : <GirlAvatar color={color} />}
          <div className="profile-card__photo-actions">
            <label className="profile-card__photo-btn">
              تغيير الصورة
              <input type="file" accept="image/*" onChange={(e) => handlePhoto(e.target.files?.[0] ?? null)} hidden />
            </label>
            {photoUrl && (
              <button
                type="button"
                className="profile-card__photo-btn profile-card__photo-btn--danger"
                onClick={() => {
                  setPhotoUrl(null);
                  setDirty(true);
                }}
              >
                حذف
              </button>
            )}
          </div>
        </div>
        <div className="profile-card__identity">
          <input
            className="profile-card__nickname"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setDirty(true);
            }}
          />
          <div className="profile-card__colors">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`profile-card__color ${c === color ? "is-active" : ""}`}
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
      </div>

      {unseen > 0 && (
        <div className="portfolio__notify">
          🎉 عندك {unseen} تقييم جديد من المعلمة! افتحي "لغتي" أو "رياضيات" لتشوفيه.
        </div>
      )}

      <div className="stat-row">
        {(
          [
            ["certificate", "شهادات"],
            ["achievement", "إنجازات"],
            ["lughati", "أعمال لغتي"],
            ["riyadiyat", "أعمال رياضيات"],
          ] as const
        ).map(([section, label]) => {
          const { bg, fg, Icon } = CATEGORY_STYLE[section];
          return (
            <div className="stat-chip" key={section}>
              <span className="stat-chip__icon" style={{ ["--medallion" as string]: bg }}>
                <Icon color={fg} size={16} />
              </span>
              <span className="stat-chip__number">{countOf(section)}</span>
              <span className="stat-chip__label">{label}</span>
            </div>
          );
        })}
      </div>

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

      <div className="role-layout">
        <nav className="side-nav">
          {NAV_ITEMS.map((n) => {
            const { bg, fg, Icon } = n.style;
            return (
              <button
                key={n.tab}
                type="button"
                className={`side-nav__item ${tab === n.tab ? "is-active" : ""}`}
                onClick={() => setTab(n.tab)}
              >
                <span className="side-nav__icon" style={{ ["--medallion" as string]: bg }}>
                  <Icon color={fg} size={17} />
                </span>
                {n.label}
              </button>
            );
          })}
        </nav>

        <div className="role-content">
          {tab === "about" && (
            <>
              <div className="section-heading">
                <span className="section-heading__icon" style={{ ["--medallion" as string]: CATEGORY_STYLE.certificate.bg }}>
                  <CATEGORY_STYLE.certificate.Icon color={CATEGORY_STYLE.certificate.fg} size={17} />
                </span>
                <h3>شهاداتي</h3>
              </div>
              <SectionPanel studentId={studentId} section="certificate" color={color} canAdd />

              <div className="section-heading">
                <span className="section-heading__icon" style={{ ["--medallion" as string]: CATEGORY_STYLE.achievement.bg }}>
                  <CATEGORY_STYLE.achievement.Icon color={CATEGORY_STYLE.achievement.fg} size={17} />
                </span>
                <h3>إنجازاتي</h3>
              </div>
              <SectionPanel studentId={studentId} section="achievement" color={color} canAdd />
            </>
          )}
          {tab === "lughati" && (
            <SectionPanel studentId={studentId} section="lughati" color={color} canAdd markSeenOnMount />
          )}
          {tab === "riyadiyat" && (
            <SectionPanel studentId={studentId} section="riyadiyat" color={color} canAdd markSeenOnMount />
          )}
        </div>
      </div>
    </div>
  );
}
