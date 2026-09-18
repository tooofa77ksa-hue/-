/*
  البحث العربي يتسامح مع اختلاف الكتابة.
  الحالة التي كشفت العطل مذكورة بنصّها: المشرفة بحثت باسم طالبة موجودة
  فعلًا فلم تجدها، لأن لوحة مفاتيحها كتبت «ى» حيث خُزّنت «ي».
*/
import { describe, expect, it } from "vitest";
import { normalizeArabic, textMatches } from "../../src/injazi/lib/arabicSearch";

describe("البحث العربي", () => {
  it("يجد الاسم رغم اختلاف ى/ي — الحالة التي وقعت فعلًا", () => {
    expect(textMatches("نادين الشمراني", "نادين الشمرانى")).toBe(true);
    expect(textMatches("نادين الشمرانى", "نادين الشمراني")).toBe(true);
  });

  it("يتسامح مع الهمزات: أ إ آ ٱ كلها ا", () => {
    expect(textMatches("أحمد", "احمد")).toBe(true);
    expect(textMatches("إسراء", "اسراء")).toBe(true);
    expect(textMatches("آمنة", "امنه")).toBe(true);
  });

  it("يتسامح مع ة/ه", () => {
    expect(textMatches("فاطمة", "فاطمه")).toBe(true);
    expect(textMatches("دراسات اسلامية", "دراسات إسلاميه")).toBe(true);
  });

  it("يتسامح مع ؤ/و و ئ/ي", () => {
    expect(textMatches("مسؤول", "مسوول")).toBe(true);
    expect(textMatches("قارئة", "قاريه")).toBe(true);
  });

  it("يتجاهل الحركات والتطويل", () => {
    expect(textMatches("مَرْيَم", "مريم")).toBe(true);
    expect(textMatches("مـــريم", "مريم")).toBe(true);
  });

  it("يوحّد الأرقام العربية-الهندية", () => {
    expect(textMatches("مشروع ٢٠٢٦", "2026")).toBe(true);
    expect(textMatches("مشروع 2026", "٢٠٢٦")).toBe(true);
  });

  it("يتجاهل المسافات الزائدة وحالة الحرف اللاتيني", () => {
    expect(textMatches("  لانا   الشهري ", "لانا الشهري")).toBe(true);
    expect(textMatches("English", "english")).toBe(true);
  });

  it("إبرة فارغة تعني لا تصفية", () => {
    expect(textMatches("أي نص", "")).toBe(true);
    expect(textMatches("أي نص", "   ")).toBe(true);
  });

  it("لا يتساهل في المعنى: اسم مختلف يبقى غير مطابق", () => {
    expect(textMatches("نادين", "ريتاج")).toBe(false);
    expect(textMatches("لانا الشهري", "لانا القحطاني")).toBe(false);
    // «ال» التعريف ليست محذوفة عمدًا — البحث يبقى متوقَّعًا.
    expect(textMatches("شهري", "الشهري")).toBe(false);
  });

  it("التطبيع لا يُفقد النص معناه للعين", () => {
    expect(normalizeArabic("نادين الشمرانى")).toBe("نادين الشمراني");
    expect(normalizeArabic("فاطمة")).toBe("فاطمه");
  });
});
