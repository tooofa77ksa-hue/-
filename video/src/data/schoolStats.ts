/**
 * بيانات إحصائية للمدرسة (بيانات الطالبات، الجدول الذكي، بيانات المعلمات) -
 * مصدرها 3 ملفات PDF منفصلة أُرسلت خصيصًا لهذا القسم:
 *   1. "بيانات الطالبات في الفصول.pdf"  -> studentDistribution
 *   2. "الجدول الذكي – جداول الفصول.pdf" -> صور public/schedules/class-01..12.png
 *   3. "بيانات المعلمات.pdf"            -> teachers
 *
 * ملاحظات على مصدر كل رقم:
 * - employeeCount (34): هذا رقم "عدد الموظفات" لكامل المدرسة (كل الكادر، وليس
 *   المعلمات فقط)، ولا يظهر في أي من ملفات الـPDF الثلاثة المرفوعة - أكّده
 *   المستخدم مباشرة كرقم صحيح معروف لديه. ملف "بيانات المعلمات" يغطي
 *   المعلمات فقط (22 سجلًا)، وهو رقم مختلف ومُتحقَّق منه من الملف نفسه.
 * - studentCount (294) وتوزيع الفصول: مُتحقَّق حرفيًا من "مجموع الطالبات
 *   الكلي" في ملف بيانات الطالبات.
 * - classCount (12): فصلان لكل مرحلة × 6 مراحل، مطابق لعدد صفحات ملف الجدول
 *   الذكي (12 صفحة/فصل).
 * - جداول الحصص (12 جدولاً): بدل إعادة كتابة مئات الخلايا يدويًا (خطر أخطاء
 *   نسخ عالٍ)، تُعرض الجداول كصور مقصوصة مباشرة من الـPDF الأصلي نفسه
 *   (public/schedules/class-01.png .. class-12.png، بالترتيب: 1/1، 1/2،
 *   2/1، 2/2، 3/1، 3/2، 4/1، 4/2، 5/1، 5/2، 6/1، 6/2) - هذا يضمن دقة 100%
 *   بلا أي احتمال تحريف رقم أو اسم معلمة أو توقيت حصة.
 */
export const schoolInfo = {
  ministryNumber: "S-34225",
  schoolName: "الابتدائية الخامسة والستون بعد المائة",
  schoolGender: "بنات",
  educationAdmin: "الإدارة العامة للتعليم بمحافظة جدة",
  region: "مكة المكرمة",
  stage: "المرحلة الابتدائية",
  academicYear: "1447 هـ",
} as const;

export const headlineStats = {
  employeeCount: 34,
  studentCount: 294,
  classCount: 12,
} as const;

export const studentDistribution = [
  { grade: "الأول الابتدائي", section1: 24, section2: 27, total: 51 },
  { grade: "الثاني الابتدائي", section1: 23, section2: 26, total: 49 },
  { grade: "الثالث الابتدائي", section1: 23, section2: 26, total: 49 },
  { grade: "الرابع الابتدائي", section1: 20, section2: 30, total: 50 },
  { grade: "الخامس الابتدائي", section1: 21, section2: 24, total: 45 },
  { grade: "السادس الابتدائي", section1: 22, section2: 28, total: 50 },
] as const;

export const studentDistributionTotal = 294;

/** ترتيب صور الجداول في public/schedules/، مطابق لترتيب صفحات ملف الجدول الذكي. */
export const classSchedules = [
  { image: "schedules/class-01.png", label: "الأول الابتدائي - فصل 1" },
  { image: "schedules/class-02.png", label: "الأول الابتدائي - فصل 2" },
  { image: "schedules/class-03.png", label: "الثاني الابتدائي - فصل 1" },
  { image: "schedules/class-04.png", label: "الثاني الابتدائي - فصل 2" },
  { image: "schedules/class-05.png", label: "الثالث الابتدائي - فصل 1" },
  { image: "schedules/class-06.png", label: "الثالث الابتدائي - فصل 2" },
  { image: "schedules/class-07.png", label: "الرابع الابتدائي - فصل 1" },
  { image: "schedules/class-08.png", label: "الرابع الابتدائي - فصل 2" },
  { image: "schedules/class-09.png", label: "الخامس الابتدائي - فصل 1" },
  { image: "schedules/class-10.png", label: "الخامس الابتدائي - فصل 2" },
  { image: "schedules/class-11.png", label: "السادس الابتدائي - فصل 1" },
  { image: "schedules/class-12.png", label: "السادس الابتدائي - فصل 2" },
] as const;

/**
 * بيانات المعلمات (22 سجلاً) - الأعمدة مقتصرة عمدًا على ما طُلب فقط:
 * الاسم الرباعي، حالة التوظيف، المسمى الوظيفي، مجال التدريس/التخصص.
 * تم حذف رقم الجوال واسم المستخدم بالكامل ولا يظهران في أي مكان.
 * employmentStatus فارغ (" ") لسجلّين لم تُطبع لهما حالة توظيف في الـPDF
 * الأصلي (عهود باهويني، منيرة القحطاني) - لم يُخترع أي قيمة بديلة.
 */
export const teachers = [
  { name: "اشواق حامد سلطان السهلي", employmentStatus: "دائم", jobTitle: "معلم", field: "اللغة العربية", specialty: "عربي" },
  { name: "أشواق عبدالرحمن جمعان القرشي", employmentStatus: "دائم", jobTitle: "معلم", field: "رياضيات", specialty: "رياضيات" },
  { name: "اميره عمر محمد الشهري", employmentStatus: "دائم", jobTitle: "معلم", field: "علوم", specialty: "علوم" },
  { name: "ايناس خضر محمد الغامدي", employmentStatus: "دائم", jobTitle: "معلم", field: "اللغة الإنجليزية", specialty: "إنجليزي" },
  { name: "بدريه عبد المعين محمد السفري", employmentStatus: "دائم", jobTitle: "معلم", field: "دين", specialty: "دين" },
  { name: "حنان بنت عوض بن احمد ال عوض", employmentStatus: "دائم", jobTitle: "معلم", field: "علوم", specialty: "علوم" },
  { name: "حنان محسن الكمالي العمري", employmentStatus: "دائم", jobTitle: "معلم", field: "علوم", specialty: "علوم" },
  { name: "دلال عبدالله سالم السناني", employmentStatus: "دائم", jobTitle: "معلم", field: "اللغة العربية", specialty: "عربي" },
  { name: "ريم عبدالجبار علي القريقري", employmentStatus: "دائم", jobTitle: "معلم", field: "التربية الفنية", specialty: "فنية" },
  { name: "سماح سالم احمد باسعد", employmentStatus: "دائم", jobTitle: "معلم", field: "رياضيات", specialty: "رياضيات" },
  { name: "سميره عبد المعين سعد الشريف", employmentStatus: "دائم", jobTitle: "معلم", field: "رياضيات", specialty: "رياضيات" },
  { name: "عائشه عايض بن فالح الحربي", employmentStatus: "دائم", jobTitle: "معلم", field: "اللغة الإنجليزية", specialty: "إنجليزي" },
  { name: "عبير عقيل عقيل المطيري", employmentStatus: "دائم", jobTitle: "معلم", field: "اقتصاد منزلي", specialty: "اقتصاد منزلي" },
  { name: "عهود علي عبدالله باهويني", employmentStatus: "", jobTitle: "معلم", field: "اقتصاد منزلي", specialty: "تدبير منزلي" },
  { name: "فاطمة بنت علي بن سعيد بن حمدان الشهري", employmentStatus: "دائم", jobTitle: "معلم", field: "رياضيات", specialty: "رياضيات" },
  { name: "ماجده حمود محمد الحارثي", employmentStatus: "دائم", jobTitle: "معلم", field: "دين", specialty: "دين" },
  { name: "منيرة محمد عوض القحطاني", employmentStatus: "", jobTitle: "معلم", field: "التربية الاجتماعية والوطنية", specialty: "جغرافيا" },
  { name: "مها مسفر مشعل الحارثي", employmentStatus: "دائم", jobTitle: "معلم", field: "التربية الفنية", specialty: "فنية" },
  { name: "نادية محمد عبد المعتني الجدعاني", employmentStatus: "دائم", jobTitle: "معلم", field: "اقتصاد منزلي", specialty: "اقتصاد منزلي" },
  { name: "هدى حسن مهدي خيرات", employmentStatus: "دائم", jobTitle: "معلم", field: "علم نفس", specialty: "علم اجتماع واجتماع" },
  { name: "هناء عبدالله علي شكر", employmentStatus: "دائم", jobTitle: "معلم", field: "اللغة العربية", specialty: "عربي" },
  { name: "هند سليم شاهر الأحمدي", employmentStatus: "دائم", jobTitle: "معلم", field: "دين", specialty: "دين" },
] as const;

export const teachersTotal = 22;
