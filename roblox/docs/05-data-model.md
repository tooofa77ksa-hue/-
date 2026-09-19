# 05 — نموذج البيانات

## ملف اللاعب (`PlayerProfile`)

```
PlayerProfile = {
  schemaVersion : number,        -- 1

  currency = {
    dust : number,               -- ≥ 0، عدد صحيح، سقف صلب
  },

  gear = {                       -- المستوى 0..5 لكل مسار
    speed : number, jump : number, shield : number, reviveCharges : number,
  },

  stats = {
    bestDistance : number, totalRuns : number, totalExtracts : number,
    totalRevives : number, playtimeSeconds : number,
  },

  dailies = {
    daySeed        : string,     -- "2026-09-19" (UTC)
    quests         : { { id : string, target : number, progress : number, claimed : boolean } },
    streak         : number,
    lastClaimedDay : string,
  },

  purchases = {
    history   : { [string]: number },  -- purchaseId → طابع زمني (آخر 200)
    passCache : { [string]: boolean }, -- تخزين مؤقت خادمي لملكية Passes
  },

  cosmetics = { owned : { string }, equipped : { [string]: string } },

  meta = {
    createdAt : number, lastSeen : number,
    sessionJobId : string?, sessionHeartbeat : number?,  -- قفل الجلسة
  },
}
```

## المفاتيح

| المفتاح | المحتوى | الكتابة |
|---|---|---|
| `Profile_v1/<userId>` | الملف الكامل | `UpdateAsync` فقط |
| `Backup_v1/<userId>` | آخر 3 لقطات ناجحة + طابع زمني | بعد كل حفظ ناجح مهم |
| `Ordered_BestDistance` | لوحة صدارة (OrderedDataStore) — لاحقًا | خادمي فقط |

## القواعد الصارمة

1. **`UpdateAsync` فقط** — لا `SetAsync` للبيانات الاقتصادية.
2. **قفل الجلسة**: عند التحميل، إن كان `sessionJobId` مختلفًا و`sessionHeartbeat` حديثًا ⇒ انتظر/ارفض. يمنع ازدواج العناصر عبر خوادم متعددة.
3. **الحفظ عند**: الخروج · `BindToClose` · كل 120 ثانية · بعد كل معاملة اقتصادية.
4. **إعادة المحاولة**: 5 محاولات، تراجع أسي (1/2/4/8/16s) + jitter. فشل نهائي ⇒ **وضع قراءة فقط** + منع المنح + تنبيه. لا فقدان صامت.
5. **قيود القيم** داخل دالة التحويل: `dust` عدد صحيح ضمن `[0, MAX]`؛ مستويات العتاد ضمن `[0,5]`؛ أي قيمة خارج المدى ⇒ تُقصَّ ويُسجَّل تنبيه.
6. **نمو محدود**: `purchases.history` آخر 200 فقط؛ `cosmetics.owned` محدودة بحجم الكتالوج.
7. **الهجرة تصاعدية فقط**؛ رفض تحميل `schemaVersion` أحدث من المعروف (يمنع تلف البيانات عند التراجع عن إصدار).
8. **لا بيانات شخصية** إطلاقًا — لا اسم حقيقي، لا بريد، لا موقع، لا نص حر من اللاعب.

## حالة الجولة (`RunState`) — ذاكرة الخادم فقط، لا تُحفظ
`phase · startedAt · seed · segments · sandHeight · players[{userId, checkpoint, distance, downed, revivedBy}]`
عند تعطل الخادم، تُمنح المكافآت حتى آخر نقطة تفتيش مؤكَّدة فقط.
