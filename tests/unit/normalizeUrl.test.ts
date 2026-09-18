/*
  تطبيع الروابط يرفض ما ليس رابطًا.
  new URL وحده لا يكفي: المتصفّح يحوّل أي نصّ إلى مضيف «صالح» شكلًا،
  فكان أي كلام يُكتب في خانة الرابط يُحفَظ رابطًا ميتًا في ملف الطالبة.
*/
import { describe, expect, it } from "vitest";
import { normalizeUrl } from "../../src/injazi/ui/qr";

describe("تطبيع الروابط", () => {
  it("يقبل الروابط الحقيقية", () => {
    expect(normalizeUrl("https://drive.google.com/file/d/x/view")).toContain("drive.google.com");
    expect(normalizeUrl("drive.google.com/x")).toContain("https://drive.google.com/x");
    expect(normalizeUrl("https://youtu.be/abc")).toContain("youtu.be");
    expect(normalizeUrl("  https://example.co.uk/a  ")).toContain("example.co.uk");
  });

  it("يرفض النصّ العربي المكتوب سهوًا — الحالة التي وقعت", () => {
    expect(normalizeUrl("ليس رابطًا")).toBeNull();
    expect(normalizeUrl("اختبار")).toBeNull();
    expect(normalizeUrl("مشروع دورة الماء")).toBeNull();
  });

  it("يرفض ما لا مضيف حقيقي له", () => {
    expect(normalizeUrl("hello")).toBeNull();
    expect(normalizeUrl("abc def")).toBeNull();
    expect(normalizeUrl("https://a")).toBeNull();
    expect(normalizeUrl("...")).toBeNull();
  });

  it("يرفض الفارغ وبروتوكولات غير الويب", () => {
    expect(normalizeUrl("")).toBeNull();
    expect(normalizeUrl("   ")).toBeNull();
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
    expect(normalizeUrl("data:text/html,<b>x</b>")).toBeNull();
    expect(normalizeUrl("file:///etc/passwd")).toBeNull();
  });
});
