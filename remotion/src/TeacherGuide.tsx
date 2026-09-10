import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Tajawal";
import { theme } from "./theme";

const { fontFamily } = loadFont();

const steps = [
  {
    label: "١",
    title: "دخول المعلمة",
    detail: "تسجيل دخول بسيط باسم المستخدم وكلمة المرور من /teacher",
  },
  {
    label: "٢",
    title: "إضافة السؤال ونشره",
    detail: "كتابة السؤال، تحديد الإجابة الصحيحة، ثم ضغط «نشر»",
  },
  {
    label: "٣",
    title: "يظهر فورًا للطالبات",
    detail: "التحديث ينعكس مباشرة في /play دون أي تعديل على الكود",
  },
];

const StepScene: React.FC<{ index: number }> = ({ index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const step = steps[index];
  const rise = spring({ frame, fps, config: { damping: 14 } });
  const detailOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: theme.brandPaper,
        fontFamily,
        direction: "rtl",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          transform: `translateY(${(1 - rise) * 100}px)`,
          opacity: rise,
          textAlign: "center",
          maxWidth: 1200,
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            background: theme.brandPrimary,
            color: theme.brandPaper,
            fontSize: 56,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 32px",
          }}
        >
          {step.label}
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: theme.brandInk,
          }}
        >
          {step.title}
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 32,
            color: theme.brandMuted,
            opacity: detailOpacity,
          }}
        >
          {step.detail}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const TeacherGuide: React.FC = () => {
  const stepDuration = 100;
  return (
    <>
      {steps.map((_, index) => (
        <Sequence
          key={index}
          from={index * stepDuration}
          durationInFrames={stepDuration}
        >
          <StepScene index={index} />
        </Sequence>
      ))}
    </>
  );
};

export const TEACHER_GUIDE_DURATION_IN_FRAMES = steps.length * 100;
