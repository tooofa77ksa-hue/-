# 04 — الهيكل المقترح وخطة الملفات (Rojo)

> مقترح. **لا يُنفَّذ قبل موافقتك.**

## شجرة المستودع

```
roblox/
├── CLAUDE.md
├── README.md
├── rokit.toml                  # نسخ مثبّتة: rojo, stylua, selene
├── wally.toml                  # (مؤجَّل — لا يُنشأ قبل الحاجة لحزمة)
├── default.project.json        # المكان الإنتاجي
├── test.project.json           # المكان الاختباري (معزول)
├── selene.toml
├── stylua.toml
├── .gitignore                  # Packages/, build/, *.rbxl
├── CHANGELOG.md
├── docs/                       # هذه الوثائق + perf/ + release/ + analytics/
├── tests/
│   ├── unit/                   # منطق نقي (توازن، آلة حالات، هجرة)
│   └── abuse/                  # حمولات خبيثة لكل Remote
└── src/
    ├── server/
    │   ├── init.server.luau            # نقطة الدخول: Init ثم Start
    │   ├── Net/
    │   │   ├── Router.luau             # الربط الوحيد بالـ Remotes
    │   │   ├── Guards.luau             # الأبواب الأربعة
    │   │   ├── RateLimiter.luau        # token bucket لكل لاعب/Remote
    │   │   └── ReplayGuard.luau        # nonce + نافذة زمنية
    │   ├── Data/
    │   │   ├── ProfileStore.luau       # UpdateAsync + إعادة محاولة + قفل جلسة
    │   │   ├── Backup.luau             # آخر 3 لقطات
    │   │   └── Migrations/             # v1→v2 ...
    │   ├── Economy/
    │   │   ├── Grants.luau             # Economy:Grant(player, reason, amount)
    │   │   └── Tables.luau             # جداول المنح — خادمية فقط
    │   ├── Gameplay/
    │   │   ├── RoundService.luau       # آلة الحالات
    │   │   ├── SandHazard.luau         # ارتفاع الرمال (خادمي)
    │   │   ├── Generator.luau          # تركيب المقاطع + التحقق من القابلية
    │   │   ├── Checkpoints.luau
    │   │   ├── Revive.luau             # تحقق مسافة/حالة/مدة
    │   │   └── AntiCheat.luau          # معقولية السرعة والمسافة
    │   ├── Dailies/
    │   │   └── DailyQuests.luau        # بذرة يوم UTC + تقييم خادمي
    │   ├── Purchases/
    │   │   ├── ProcessReceipt.luau     # ⚠️ المعالج الوحيد في المشروع
    │   │   └── Ownership.luau          # تحقق Pass + تخزين مؤقت خادمي
    │   ├── Safety/
    │   │   └── TextFilter.luau
    │   └── Analytics/
    │       └── Events.luau             # إرسال خادمي فقط
    ├── client/
    │   ├── init.client.luau
    │   ├── Gameplay/                   # تنبؤ بصري فقط
    │   ├── UI/
    │   │   ├── HUD/  Shop/  Dailies/  Results/  Settings/
    │   └── Input/                      # لمس · لوحة مفاتيح · يد تحكم
    ├── shared/
    │   ├── Net/Schema.luau             # أسماء وأنواع كل حمولة
    │   ├── Types/                      # PlayerProfile, RunState, ...
    │   ├── Config/                     # Balance · UI · Performance · Flags · Catalog
    │   ├── Locale/                     # ar.luau · en.luau
    │   └── Util/                       # منطق نقي قابل للاختبار
    └── assets/                         # .rbxmx مفحوصة — صفر سكربتات
```

## خريطة Rojo

| مصدر | وجهة |
|---|---|
| `src/server` | `ServerScriptService/Game` |
| `src/shared` | `ReplicatedStorage/Shared` |
| `src/client` | `StarterPlayer/StarterPlayerScripts/Game` |
| `src/assets` | `ServerStorage/Assets` |

`test.project.json` يبني مكانًا منفصلًا لا يلمس DataStore الإنتاجي.

## قواعد معمارية ملزمة
1. `--!strict` في كل ملف.
2. **كل** Remote عبر `Net/Router` — لا `RemoteEvent` منشأ أو مستمَع إليه في أي مكان آخر.
3. **كل** كتابة بيانات لاعب عبر `Data/ProfileStore` — لا استثناء.
4. **كل** منح عملة عبر `Economy/Grants` مع `reason`.
5. معالج `ProcessReceipt` **واحد** في المشروع كله.
6. `shared/` نقي: لا `game:GetService` داخله (ليبقى قابلًا لاختبار الوحدة).
7. لا أرقام سحرية — كل ثابت توازن في `shared/Config`.
8. لا أثر جانبي وقت الاستيراد؛ `Init()` ثم `Start()`.
