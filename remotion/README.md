# فيديوهات شُعلة لغتي (Remotion)

مشروع منفصل مستقل عن تطبيق الويب الرئيسي، لإنتاج فيديوهات ترويجية/تعليمية
بالكود عبر [Remotion](https://www.remotion.dev)، بنفس رموز الهوية البصرية
(`src/theme.ts`، منسوخة من `../src/styles/theme.css`) وشخصية «دَمبل» المعاد
رسمها بصيغة SVG (`src/Dumpling.tsx`) لتطابق رسمها الأصلي بالـ Phaser.

## التركيبات (Compositions)

- **Promo** (١٥ ثانية، 1920×1080): فيديو ترويجي عام - المقدمة، دَمبل، الألعاب
  الثلاث، ودعوة للبدء.
- **TeacherGuide** (١٠ ثوانٍ): شرح تعليمي مختصر لخطوات نشر سؤال من لوحة
  المعلمة وظهوره فورًا للطالبات.

## الاستخدام

```bash
cd remotion
npm install
npm start              # فتح Remotion Studio للمعاينة والتعديل التفاعلي
npm run render:promo   # تصدير out/promo.mp4
npm run render:teacher # تصدير out/teacher-guide.mp4
```

`out/` غير مُتتبَّع بـ git (نواتج تصدير قابلة لإعادة التوليد من الكود).
