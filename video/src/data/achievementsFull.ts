/**
 * بيانات مقطع "منجزات المدرسة" - النسخة المعتمدة النهائية (مقطع واحد مدمج).
 * كل عنصر هنا مأخوذ حرفيًا من الشهادات/الصور الحقيقية المرفوعة، وبنفس
 * الترتيب المعتمد من المستخدمة - لا أرقام أو أسماء أو سنوات مُخترعة.
 * الصور نفسها في public/achievements و public/initiatives و
 * public/environment (الأخيرة كانت موجودة مسبقًا ولم تتغيّر).
 */

export type IconKind = "shield" | "medal" | "heart" | "palette" | "bulb" | "device" | "camera" | "trophy" | "star";

export type SchoolAchievement = {
  image: string;
  caption: string;
  icon: IconKind;
};

/** أولًا: منجزات المدرسة - الترتيب مطابق تمامًا للنص المعتمد (1-7). */
export const schoolAchievements: SchoolAchievement[] = [
  {
    image: "achievements/school-03-nawabigh-1445.jpg",
    caption: "شهادة شكر وتقدير من مكتب تعليم السلامة، تقديرًا لمبادرة المدرسة باستضافة وتنظيم مسابقة نوابغ المستقبل للعام 1445هـ",
    icon: "shield",
  },
  {
    image: "achievements/school-02-national-day-94.jpg",
    caption: "شهادة شكر وتقدير من مكتب تعليم السلامة، لمساهمة المدرسة ومشاركتها في تفعيل اليوم الوطني السعودي 94 للعام 1446هـ",
    icon: "shield",
  },
  {
    image: "achievements/school-01-middle-east-expo-teacher-day.jpg",
    caption: "شهادة شكر وتقدير من مكتب تعليم السلامة، لمشاركة المدرسة وتنظيمها معرض الشرق الأوسط للتعليم والتدريب للعام 1446هـ",
    icon: "shield",
  },
  {
    image: "achievements/school-04-middle-east-expo-1446.jpg",
    caption: "شهادة شكر وتقدير من المدير العام للتعليم بمحافظة جدة، الأستاذة منال اللهيبي، لمشاركة المدرسة ومبادرتها في تنظيم معرض الشرق الأوسط للتعليم والتدريب للعام 1447هـ",
    icon: "medal",
  },
  {
    image: "achievements/school-05-design-thinking-workshop.jpg",
    caption: "شهادة شكر وتقدير من شركة واحد ألعب للترفيه، لمبادرة المدرسة في إدخال السرور على نفوس الطالبات",
    icon: "heart",
  },
  {
    image: "achievements/school-06-national-day-95-painting.png",
    caption: "شهادة شكر وتقدير من الموارد البشرية والتنمية الاجتماعية، مركز التنمية الاجتماعية بمحافظة جدة، لنجاح معرض أجمل لوحة بمناسبة اليوم الوطني السعودي 95 للعام 1447هـ",
    icon: "palette",
  },
  {
    image: "achievements/director-workshop-attendance.jpg",
    caption: "شهادة حضور مديرة المدرسة الأستاذة جازية عباس السميري ورشة التفكير التصميمي، مقدَّمة من الأستاذة هيفاء برقاوي",
    icon: "bulb",
  },
];

export type CompetitionRank = {
  rank: "الأول" | "الثاني" | "الثالث";
  grade: string;
  year: string;
  image: string;
  standout?: boolean;
};

export const competitionName = "مسابقة قادمون";

/** فوز المدرسة في مسابقة قادمون 1447هـ - بصور الشهادات الحقيقية، بالترتيب المعتمد. */
export const competitionRanks: CompetitionRank[] = [
  { rank: "الأول", grade: "الصف الرابع", year: "1447 هـ", image: "achievements/qadimoon-rank1-cert.jpg", standout: true },
  { rank: "الثاني", grade: "الصف الخامس", year: "1447 هـ", image: "achievements/qadimoon-rank2-cert.jpg" },
  { rank: "الثالث", grade: "الصف الثالث", year: "1447 هـ", image: "achievements/qadimoon-rank3-cert.jpg" },
];

export type TeacherAchievement = {
  name: string;
  achievement: string;
  image: string;
};

/** ثانيًا: إنجازات المعلمات والموظفات - الترتيب مطابق تمامًا للنص المعتمد. */
export const teacherAchievements: TeacherAchievement[] = [
  { name: "حنان آل عوض", achievement: "تكريم يوم المعلم - كلنا نقدرك", image: "achievements/teacher-hanan-alawad.jpg" },
  { name: "فوزية الحربي", achievement: "تكريم يوم المعلم - كلنا نقدرك", image: "achievements/teacher-fawzia-alharbi.jpg" },
  { name: "حنان العمري", achievement: "مشاركة فاعلة في أسبوع الفضاء العالمي", image: "achievements/teacher-hanan-alomari.jpg" },
  { name: "عبير المطيري", achievement: "المساهمة المتميزة في اليوم العالمي للمعلم ومعرض الشرق الأوسط للتعليم والتدريب", image: "achievements/teacher-abeer-almutairi.jpg" },
];

export type Initiative = {
  title: string;
  owner: string;
  description: string;
  image: string;
  icon: IconKind;
};

/** ثالثًا: المبادرات الداخلية - الترتيب مطابق تمامًا للنص المعتمد. */
export const initiatives: Initiative[] = [
  {
    title: "بوابة التواصل الداخلي",
    owner: "مبادرة المعلمة سماح باسعد",
    description: "منصة إلكترونية واحدة لتنظيم واختصار الأعمال والتعاميم والنشرات وأعمال التوجيه الطلابي والإداري",
    image: "initiatives/internal-portal.jpg",
    icon: "device",
  },
  {
    title: "منصة سماح التفاعلية",
    owner: "مبادرة المعلمة سماح باسعد - لجميع المراحل",
    description: "ألعاب ودروس رياضية تفاعلية تدعم التعلم بأسلوب ممتع ومحفّز",
    image: "initiatives/math-platform.jpg",
    icon: "device",
  },
  {
    title: "تطبيق أثر",
    owner: "المساعدة الإدارية عواطف الجهني",
    description: "متابعة رقمية لقياس أثر الخطة التحسينية والخطة التشغيلية، وإصدار التقارير الإلكترونية",
    image: "initiatives/athar-app.jpg",
    icon: "device",
  },
];

export type StudentAchievement = {
  name: string;
  competition: string;
  result: string;
  year: string;
  image: string;
};

/** رابعًا: إنجازات الطالبات */
export const studentAchievements: StudentAchievement[] = [
  {
    name: "رتيل الشيخ",
    competition: "مسابقة المهارات الثقافية",
    result: "المركز الأول - أجمل تصوير",
    year: "2024م",
    image: "achievements/student-rateel-alsheikh.jpg",
  },
];

export type HonoredStudent = {
  shortName: string;
  achievement: string;
  standout?: boolean;
  certificate: string;
};

/** خامسًا: الموهبة - الاسم كما هو مطبوع على الشهادة الأصلية (ريمان حسين عبد الله). */
export const honoredStudents: HonoredStudent[] = [
  { shortName: "ريمان حسين عبد الله", achievement: "موهبة", certificate: "certificates/reyman-certificate.jpg" },
  { shortName: "تالا المالكي", achievement: "موهبة استثنائية", standout: true, certificate: "certificates/tala-certificate.jpg" },
];

export type EnvironmentItem = {
  title: string;
  before: string;
  after: string;
};

/** سادسًا: منجزات المدرسة قبل وبعد - نفس الصور الحقيقية المستخدمة سابقًا في هذا المشروع، بلا أي تعديل. */
export const environmentItems: EnvironmentItem[] = [
  { title: "المبنى الخارجي", before: "environment/exterior-before.jpg", after: "environment/exterior-after.png" },
  { title: "دورة المياه المهيأة لذوي الإعاقة", before: "environment/restroom-before.jpg", after: "environment/restroom-after.jpg" },
  { title: "الصالة والنادي الرياضي", before: "environment/gym-before.png", after: "environment/gym-after.png" },
  { title: "معمل العلوم", before: "environment/lab-before.png", after: "environment/lab-after.png" },
];
