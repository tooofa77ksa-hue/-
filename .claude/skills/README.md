# المهارات المحلية

مهارات هذا المستودع، مكتوبة بمعيار واحد (`skill-standard`). كل مهارة فيها: متى تعمل · النطاق · الخطوات · معايير القبول · اختبارات التحقق · المحظورات · المصادر.

## مهارات عامة — تعمل في كل مهمة (12)

| المهارة | تُستدعى عند |
|---|---|
| `work-discipline` | بداية أي مهمة، وقبل قول «تم» |
| `repo-recon` | أول عمل في مستودع أو منطقة غير مألوفة |
| `safe-git` | أي commit / push / merge / تعارض |
| `secrets-guard` | قبل كل التزام، وعند أي بيانات اعتماد |
| `self-review` | قبل كل push وقبل إعلان الإنجاز |
| `debug-method` | أي خطأ أو فشل اختبار أو CI أحمر |
| `verify-sources` | عند ذكر رابط أو رقم أو واجهة أو إصدار |
| `arabic-first` | أي نص عربي يراه مستخدم |
| `decision-log` | اختيار مهم أو نقض قرار سابق |
| `session-handoff` | نهاية جلسة أو تسليم عمل غير مكتمل |
| `skill-standard` | إنشاء أو مراجعة أي مهارة |
| `shualat-lughati-web` | العمل في مشروع الويب في الجذر |

### ترتيب الاستخدام المعتاد
```
repo-recon → work-discipline → [مهارات المجال] → debug-method (عند الفشل)
          → self-review → secrets-guard → safe-git → session-handoff
```

## مهارات Roblox (16)

`roblox-product-strategist` · `roblox-luau-architect` · `roblox-studio-rojo` · `roblox-gameplay-systems` · `roblox-security-auditor` · `roblox-data-persistence` · `roblox-monetization` · `roblox-receipt-security` · `roblox-ui-ux-mobile` · `roblox-performance` · `roblox-analytics-liveops` · `roblox-localization-accessibility` · `roblox-testing-qa` · `roblox-release-manager` · `roblox-content-safety` · `roblox-asset-ip-checker`

تحكمها `roblox/CLAUDE.md`. تفاصيلها في `roblox/README.md`.

## قواعد حاكمة
1. **`CLAUDE.md` أعلى من أي مهارة.** عند التعارض، الدستور يفوز.
2. **المهارة توجّه ولا تنفّذ.** لا تحوي أسرارًا ولا مسارات خاصة بجهاز.
3. **مهارة = مسؤولية واحدة.** عند التداخل تُحال إلى المهارة المختصة صراحةً.
4. **لا تُنسخ مهارة من الإنترنت** بلا فحص مصدرها ومحتواها.
