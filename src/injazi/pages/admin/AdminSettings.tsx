/*
  إعدادات المنصة.
  كل نصّ ظاهر في الواجهة ولون أساسي وشعار وأغنية يُضبَط من هنا، فلا
  حاجة للرجوع إلى الكود. الألوان محصورة في لوحة جاهزة ونصف قطر البطاقة
  في ثلاث قيم — حرية كاملة هنا كانت تعني احتمال كسر التصميم.
  الأغنية: رفع/استبدال/حذف MP3 مع تشغيل، تكرار، ومستوى صوت افتراضي.
*/
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Music, Save, Trash2 } from "lucide-react";
import { ClayButton } from "@/injazi/components/ClayButton";
import { Field, Notice, Panel, SectionTitle, SelectInput, TextInput } from "@/injazi/ui/primitives";
import { Uploader } from "@/injazi/ui/Uploader";
import { deleteFile } from "@/injazi/services/storage";
import { logActivity, saveSettings } from "@/injazi/services/repo";
import { useSession, useSettings } from "@/injazi/hooks/useLive";
import { showToast } from "@/injazi/lib/toast";
import { ACCENT_PRESETS, THEMES } from "@/injazi/themes/themes";
import { pageVariants } from "@/injazi/motion/motion";
import type { Settings } from "@/injazi/types/models";

const RADII = [
  { value: 20, name: "زوايا هادئة" },
  { value: 28, name: "زوايا متوسطة" },
  { value: 36, name: "زوايا دائرية" },
];

const BACKGROUNDS = [
  { id: "cream", name: "كريمي" },
  { id: "white", name: "أبيض" },
  { id: "blush", name: "وردي فاتح" },
];

export function AdminSettings() {
  const live = useSettings();
  const { profile } = useSession();
  const [form, setForm] = useState<Settings>(live);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // النموذج يُزامَن مع المستند الحيّ حتى وصول أول قراءة فقط، فلا تُمسح
  // تعديلات المشرفة إن وصل تحديث أثناء الكتابة.
  const [synced, setSynced] = useState(false);
  useEffect(() => {
    if (!synced && live.updatedAt !== "") {
      setForm(live);
      setSynced(true);
    }
  }, [live, synced]);

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await saveSettings(form);
      await logActivity("settings.save", "تم تحديث إعدادات المنصة", profile?.name ?? "مشرفة", "admin");
      showToast("تم حفظ الإعدادات");
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر الحفظ.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.div className="iz-page" variants={pageVariants} initial="initial" animate="enter" exit="exit">
      <SectionTitle
        hint="كل ما هنا يظهر مباشرة في الواجهة العامة"
        action={
          <ClayButton onClick={save} loading={busy} icon={<Save size={18} strokeWidth={2.4} />}>
            حفظ الإعدادات
          </ClayButton>
        }
      >
        إعدادات المنصة
      </SectionTitle>

      <Panel className="iz-settings-block">
        <h3 className="iz-editor-block__title">النصوص</h3>
        <div className="iz-form-grid">
          <Field label="اسم المنصة">
            <TextInput value={form.platformName} onChange={(e) => set("platformName", e.target.value)} maxLength={60} />
          </Field>
          <Field label="الشعار النصي (Tagline)">
            <TextInput value={form.tagline} onChange={(e) => set("tagline", e.target.value)} maxLength={90} />
          </Field>
          <Field label="العنوان الفرعي">
            <TextInput value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} maxLength={140} />
          </Field>
          <Field label="اسم المدرسة">
            <TextInput value={form.schoolName} onChange={(e) => set("schoolName", e.target.value)} maxLength={90} />
          </Field>
          <Field label="الصف / الفصل">
            <TextInput value={form.gradeLabel} onChange={(e) => set("gradeLabel", e.target.value)} maxLength={50} />
          </Field>
        </div>
      </Panel>

      <Panel className="iz-settings-block">
        <h3 className="iz-editor-block__title">الشعار</h3>
        <div className="iz-cover-row">
          {form.logoUrl ? (
            <div className="iz-thumb">
              <img src={form.logoUrl} alt="شعار المنصة" />
              <button
                type="button"
                className="iz-thumb__remove"
                aria-label="حذف الشعار"
                onClick={async () => {
                  await deleteFile(form.logoPath);
                  set("logoUrl", null);
                  set("logoPath", null);
                }}
              >
                <Trash2 size={15} strokeWidth={2.6} />
              </button>
            </div>
          ) : (
            <p className="iz-field__meter">لا يوجد شعار — يظهر اسم المنصة نصًّا.</p>
          )}
          <Uploader
            folder="settings"
            accept="image"
            label={form.logoUrl ? "استبدال الشعار" : "رفع شعار"}
            onUploaded={async (files) => {
              await deleteFile(form.logoPath);
              set("logoUrl", files[0].url);
              set("logoPath", files[0].path);
            }}
          />
        </div>
      </Panel>

      <Panel className="iz-settings-block">
        <h3 className="iz-editor-block__title">التصميم</h3>
        <div className="iz-form-grid">
          <Field label="الثيم الافتراضي للطالبات الجديدات">
            <SelectInput value={form.defaultTheme} onChange={(e) => set("defaultTheme", e.target.value)}>
              {THEMES.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="الخلفية">
            <SelectInput value={form.background} onChange={(e) => set("background", e.target.value)}>
              {BACKGROUNDS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="استدارة البطاقات">
            <SelectInput value={String(form.cardRadius)} onChange={(e) => set("cardRadius", Number(e.target.value))}>
              {RADII.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.name}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>

        <Field label="اللون الأساسي">
          <div className="iz-swatches" role="radiogroup" aria-label="اللون الأساسي">
            {ACCENT_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                role="radio"
                aria-checked={form.primaryColor === color}
                aria-label={`لون ${color}`}
                className={`iz-swatch ${form.primaryColor === color ? "is-active" : ""}`}
                style={{ background: color }}
                onClick={() => set("primaryColor", color)}
              />
            ))}
          </div>
        </Field>

        <Field label="اللون الثانوي">
          <div className="iz-swatches" role="radiogroup" aria-label="اللون الثانوي">
            {["#f6b93b", "#ff9db0", "#8fcbff", "#8fe0c0", "#ffb877"].map((color) => (
              <button
                key={color}
                type="button"
                role="radio"
                aria-checked={form.secondaryColor === color}
                aria-label={`لون ${color}`}
                className={`iz-swatch ${form.secondaryColor === color ? "is-active" : ""}`}
                style={{ background: color }}
                onClick={() => set("secondaryColor", color)}
              />
            ))}
          </div>
        </Field>
      </Panel>

      <Panel className="iz-settings-block">
        <h3 className="iz-editor-block__title">
          <Music size={18} strokeWidth={2.4} aria-hidden="true" /> أغنية المنصة
        </h3>

        {form.audioUrl ? (
          <div className="iz-audio-row">
            <audio src={form.audioUrl} controls preload="none" className="iz-audio" />
            <ClayButton
              variant="ghost"
              className="iz-btn--danger"
              icon={<Trash2 size={16} strokeWidth={2.4} />}
              onClick={async () => {
                await deleteFile(form.audioPath);
                set("audioUrl", null);
                set("audioPath", null);
              }}
            >
              حذف الأغنية
            </ClayButton>
          </div>
        ) : (
          <p className="iz-field__meter">لم تُرفع أغنية بعد — زر الموسيقى مخفيّ حتى تُرفع.</p>
        )}

        <Uploader
          folder="settings/audio"
          accept="audio"
          label={form.audioUrl ? "استبدال الأغنية (MP3)" : "رفع الأغنية (MP3)"}
          onUploaded={async (files) => {
            await deleteFile(form.audioPath);
            set("audioUrl", files[0].url);
            set("audioPath", files[0].path);
          }}
        />

        <div className="iz-form-grid">
          <Field label="اسم المقطع">
            <TextInput value={form.audioTitle} onChange={(e) => set("audioTitle", e.target.value)} maxLength={60} />
          </Field>
          <Field label="تشغيل الموسيقى">
            <SelectInput
              value={form.audioEnabled ? "1" : "0"}
              onChange={(e) => set("audioEnabled", e.target.value === "1")}
            >
              <option value="1">مفعّلة</option>
              <option value="0">مطفأة</option>
            </SelectInput>
          </Field>
          <Field label="التكرار">
            <SelectInput value={form.audioLoop ? "1" : "0"} onChange={(e) => set("audioLoop", e.target.value === "1")}>
              <option value="1">تكرار مستمر</option>
              <option value="0">مرة واحدة</option>
            </SelectInput>
          </Field>
          <Field label={`مستوى الصوت الافتراضي (${Math.round(form.audioVolume * 100)}%)`}>
            <input
              className="iz-range"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={form.audioVolume}
              onChange={(e) => set("audioVolume", Number(e.target.value))}
              aria-label="مستوى الصوت الافتراضي"
            />
          </Field>
        </div>
      </Panel>

      <Panel className="iz-settings-block">
        <h3 className="iz-editor-block__title">مفاتيح الميزات</h3>
        <div className="iz-pill-row">
          {(
            [
              { key: "hero3d", label: "المشهد ثلاثي الأبعاد" },
              { key: "music", label: "زر الموسيقى" },
              { key: "qr", label: "رموز QR" },
              { key: "publicPortfolios", label: "الملفات العامة" },
            ] as const
          ).map((feature) => (
            <button
              key={feature.key}
              type="button"
              role="switch"
              aria-checked={form.features[feature.key]}
              className={`iz-pill ${form.features[feature.key] ? "is-active" : ""}`}
              onClick={() =>
                set("features", { ...form.features, [feature.key]: !form.features[feature.key] })
              }
            >
              {feature.label}
            </button>
          ))}
        </div>
      </Panel>

      {error && <Notice tone="danger">{error}</Notice>}

      <div className="iz-settings-foot">
        <ClayButton onClick={save} loading={busy} size="lg" icon={<Save size={18} strokeWidth={2.4} />}>
          حفظ الإعدادات
        </ClayButton>
      </div>
    </motion.div>
  );
}
