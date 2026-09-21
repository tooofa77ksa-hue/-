--!strict
-- ============================================================
--  أثر — ملف الإعدادات
--  ModuleScript داخل ReplicatedStorage · الاسم: AtharConfig
--
--  هذا هو الملف الوحيد الذي تعدّله يا بطل.
--  غيّر النصوص والألوان والمواقع كما تريد — لا تغيّر أسماء الحقول.
-- ============================================================

local Config = {}

-- ألوان اللعبة ---------------------------------------------------
Config.Colors = {
	ground     = Color3.fromRGB(38, 46, 62),
	wall       = Color3.fromRGB(28, 36, 52),
	digital    = Color3.fromRGB(73, 211, 220),  -- أزرق: دليل رقمي
	physical   = Color3.fromRGB(232, 163, 61),  -- ذهبي: دليل مادي
	plankSafe  = Color3.fromRGB(52, 74, 104),
	plankPass  = Color3.fromRGB(79, 191, 127),
	plankFail  = Color3.fromRGB(224, 91, 84),
	finish     = Color3.fromRGB(232, 163, 61),
}

-- الغرف: الاسم، الحجم، الموضع (X، Y، Z) -------------------------
Config.Rooms = {
	{ name = "المقصف",      size = Vector3.new(40, 1, 34), pos = Vector3.new(-46,  0, -22) },
	{ name = "غرفة الخوادم", size = Vector3.new(34, 1, 34), pos = Vector3.new(  0,  0,  24) },
	{ name = "المكتبة",     size = Vector3.new(40, 1, 34), pos = Vector3.new( 46,  0, -22) },
	{ name = "الساحة",      size = Vector3.new(96, 1, 26), pos = Vector3.new(  0,  0, -22) },
	{ name = "الممر",       size = Vector3.new(14, 1, 26), pos = Vector3.new(  0,  0,  -1) },
}

-- الأدلة الثلاثة -------------------------------------------------
-- kind: "digital" أزرق · "physical" ذهبي
Config.Clues = {
	{
		id   = "msg",
		kind = "digital",
		pos  = Vector3.new(-46, 3, -22),
		name = "رسالة «مبروك! فزت»",
		text = "رسالة تعِد ببطاقة ألعاب مجانية، وتطلب تسجيل الدخول لاستلامها.",
	},
	{
		id   = "log",
		kind = "digital",
		pos  = Vector3.new(0, 3, 24),
		name = "سجلّ الدخول",
		text = "دخول ناجح ٣:٤٧ م من جهاز غير معروف — والموقع ليس المدرسة.",
	},
	{
		id   = "url",
		kind = "physical",
		pos  = Vector3.new(46, 3, -22),
		name = "عنوان الرابط المفتوح",
		text = "school-p0rtal-login.co — وليس portal.school.sa الحقيقي.",
	},
}

-- القضية ---------------------------------------------------------
Config.Case = {
	title = "قضية الحساب المسروق",
	brief = "حساب سارة نشر كلامًا لم تكتبه. النظام يقول: لا اختراق — الدخول تمّ بكلمة السر الصحيحة.",

	suspects = {
		{ id = "khaled", name = "خالد",         sub = "استعار جهازها" },
		{ id = "phish",  name = "رابط الجائزة", sub = "صفحة دخول مزيفة" },
		{ id = "wifi",   name = "شبكة المقصف",  sub = "واي فاي عام" },
	},
	answer = "phish",

	rightTitle = "الجاني رابط، لا شخص",
	wrongTitle = "الأدلة تشير إلى جهة أخرى",
	reveal = "لم يخترق أحد النظام. سارة كتبت كلمة سرّها بنفسها في صفحة تشبه صفحة المدرسة — ولا تشبه عنوانها.",
	rule   = "اقرأ ما قبل أول «/» حرفًا حرفًا. p0rtal بصفر ليست portal بحرف O، والجائزة التي تطلب كلمة سرّك طُعم.",
}

-- الجسر الآمن: خمس بوابات ---------------------------------------
-- في كل بوابة: لوح صحيح ولوح مزيّف. المشي على الصحيح يعبر.
-- side = "left" يعني أن الرابط الصحيح على اليسار.
Config.Bridge = {
	startZ  = 52,   -- أين يبدأ الجسر
	gap     = 14,   -- المسافة بين بوابة وأخرى (لوح ١٢ + فراغ ٢)
	width   = 9,    -- عرض اللوح
	length  = 12,   -- طول اللوح
	spread  = 9.5,  -- المسافة بين مركزَي اللوحين (يلتصقان تقريبًا)

	gates = {
		{ real = "portal.school.sa",   fake = "school-sa-login.help",  side = "left"  },
		{ real = "accounts.roblox.com", fake = "roblox-freerobux.gift", side = "right" },
		{ real = "www.moe.gov.sa",      fake = "moe-gov-sa.online",     side = "left"  },
		{ real = "mail.google.com",     fake = "gmail-verify.support",  side = "right" },
		{ real = "web.roblox.com",      fake = "rob1ox.com",            side = "left"  },
	},

	-- يظهر بعد كل خطأ، بالترتيب
	tips = {
		"النطاق الحقيقي هو ما قبل أول «/» — وآخر جزء منه هو المالك.",
		"الشرطة «-» ليست نقطة. roblox-freerobux اسم واحد يملكه غريب.",
		"‎.online‎ ليس ‎.gov.sa‎ — الجهات الحكومية لا تستعمل نطاقات عامة.",
		"لا توجد صفحة «تحقّق» على نطاق غريب. ادخل من الموقع مباشرة.",
		"انظر للحروف: rob1ox فيها رقم ١ مكان حرف l.",
	},
}

-- نصوص الواجهة ---------------------------------------------------
Config.UI = {
	promptAction  = "افحص",
	evidenceTitle = "دفتر الأدلة",
	accuseButton  = "من المسؤول؟",
	bridgeTitle   = "الجسر الآمن",
	bridgeHint    = "امشِ على الرابط الحقيقي فقط",
	finishTitle   = "عبرت الجسر",
}

return Config
