export interface SchoolMeta {
  ministryNumber: string;
  schoolName: string;
  schoolGender: string;
  educationAdministration: string;
  region: string;
  stage: string;
  grade: string;
  academicYear: string;
  totalStudents: number;
  testedStudents: number;
}

export interface YearPoint {
  year: number;
  value: number;
}

/** مؤشر مرجعي/مستهدف كما ورد في البطاقة الرسمية (معلَّم بـ ** في المصدر) */
export interface ReferenceIndicator {
  year: number;
  value: number;
}

export interface SubjectMetric {
  key: string;
  label: string;
  /** التغير بين آخر عامين متاحين في نسبة الاجتياز، كما ورد حرفيًا في البطاقة */
  latestChangeProficiency: number;
  /** التغير بين آخر عامين متاحين في متوسط الدرجة، كما ورد حرفيًا في البطاقة */
  latestChangeAvgScore: number;
  /** مؤشر مرجعي/مستهدف عبر الأعوام كما ورد في البطاقة (معلَّم بـ **) */
  referenceIndicator: ReferenceIndicator[];
}

export interface NafesCardData {
  grade: "third" | "sixth";
  meta: SchoolMeta;
  headline: {
    label: string;
    /** أعوام مرتبة زمنيًا من الأقدم إلى الأحدث - بيانات فعلية بلا اختراع */
    points: YearPoint[];
    /** مقدار التغير بين آخر عامين كما ورد نصًا في البطاقة الرسمية */
    latestChange: number;
  };
  subjects: SubjectMetric[];
  /** اسم ملف PDF المصدر الرسمي داخل public/assets/nafes - للتحقق والتوسعة لاحقًا */
  sourcePdf: string;
  /**
   * ملاحظة دقة البيانات: تتضمن بطاقة نافس الرسمية أيضًا رسومًا بيانية إضافية
   * (توزيع مستويات الأداء، ومقارنة المدرسة/إدارة التعليم/المملكة في كل
   * مجال فرعي) لم تُدرَج هنا لأن استخراجها النصي من ملف PDF لا يضمن مطابقة
   * كل رقم للون/الفئة الصحيحة بدقة كافية لعرض وزاري. راجعي الملف المصدر
   * (sourcePdf) مباشرة لإكمال هذه الرسوم لاحقًا بدل الاعتماد على تخمين.
   */
  notes: string;
}
