import React from "react";
import { useCurrentFrame } from "remotion";
import type { SceneSchedule } from "../../../timeline";
import type { NafesCardData } from "../../../data/types";
import { Presenter, type PresenterSide } from "../../../components/Presenter/Presenter";
import { Title } from "../../../components/Title/Title";
import { AnimatedBarChart } from "../../../components/AnimatedBarChart/AnimatedBarChart";
import { DataCallout } from "../../../components/DataCallout/DataCallout";
import { ArabicText } from "../../../components/common/ArabicText";
import { SfxCue } from "../../../audio/SfxCue";
import type { SfxKey } from "../../../audio/checkAssetExists";
import { colors } from "../../../styles/tokens";
import { safeArea } from "../../../utils/safeArea";
import { timedReveal } from "../../../utils/animation";
import { findLine, activeIndexAt } from "./sceneHelpers";

interface NafesGradeSceneProps {
  scene: SceneSchedule;
  data: NafesCardData;
  presenterSide: PresenterSide;
  /** 'start' = البيانات في الجهة المقابلة للمذيعة تمامًا، 'center' = البيانات تنتقل نحو المنتصف */
  contentAlign: "start" | "center";
  introLineId: string;
  trendLineIds: [string, string, string];
  compareLineId: string;
  subjectLineIds: string[];
  summaryLineId: string;
  sfxAvailable: Record<SfxKey, boolean>;
  presenterVideoSrc?: string;
}

export const NafesGradeScene: React.FC<NafesGradeSceneProps> = ({
  scene,
  data,
  presenterSide,
  contentAlign,
  introLineId,
  trendLineIds,
  compareLineId,
  subjectLineIds,
  summaryLineId,
  sfxAvailable,
  presenterVideoSrc,
}) => {
  const frame = useCurrentFrame();
  const introLine = findLine(scene, introLineId);
  const trendLines = trendLineIds.map((id) => findLine(scene, id));
  const compareLine = findLine(scene, compareLineId);
  const subjectLines = subjectLineIds.map((id) => findLine(scene, id));
  const summaryLine = findLine(scene, summaryLineId);

  const trendStarts = trendLines.map((l) => l.sceneRelativeStart);
  const activeYearIndex = activeIndexAt(frame, trendStarts);
  const subjectStarts = subjectLines.map((l) => l.sceneRelativeStart);
  const activeSubjectIndex = activeIndexAt(frame, subjectStarts);

  const compareVisible = frame >= compareLine.sceneRelativeStart;
  const summaryVisible = frame >= summaryLine.sceneRelativeStart;

  // كاميرا/Parallax خفيفة جدًا عبر مدة المشهد كاملة - لا تُلاحَظ بشكل مباشر
  const parallax = timedReveal(frame, 0, scene.durationInFrames, { from: 0, to: 1 });
  const cameraScale = 1 + parallax * 0.012;
  const cameraShiftX = (parallax - 0.5) * (presenterSide === "right" ? -10 : 10);

  const contentSide: "left" | "right" = presenterSide === "right" ? "left" : "right";
  const CONTENT_WIDTH = 820;
  const PRESENTER_WIDTH = 560;
  const PRESENTER_GAP = 40;

  // عند contentAlign='center' نتوسّط ضمن المساحة المتبقية بعيدًا عن المذيعة فعليًا
  // (لا منتصف الشاشة الكامل) لتفادي أي تداخل بصري بين المذيعة والبيانات.
  const columnStyle: React.CSSProperties = (() => {
    if (contentAlign === "center") {
      const rangeStart = presenterSide === "left" ? 80 + PRESENTER_WIDTH + PRESENTER_GAP : safeArea.left;
      const rangeEnd = presenterSide === "right" ? safeArea.right - PRESENTER_WIDTH - PRESENTER_GAP : safeArea.right;
      const left = rangeStart + Math.max(0, (rangeEnd - rangeStart - CONTENT_WIDTH) / 2);
      return { position: "absolute", top: safeArea.top, left, width: CONTENT_WIDTH };
    }
    return {
      position: "absolute",
      top: safeArea.top,
      [contentSide]: safeArea.left,
      width: CONTENT_WIDTH,
    } as React.CSSProperties;
  })();

  const barStartFrames = trendLines.map((l) => l.sceneRelativeStart + 6);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: colors.paper,
        overflow: "hidden",
        transform: `scale(${cameraScale}) translateX(${cameraShiftX}px)`,
      }}
    >
      {/* Whoosh عند دخول البطاقة */}
      <SfxCue kind="whoosh" from={0} available={sfxAvailable.whoosh} />
      <SfxCue kind="titleHit" from={10} available={sfxAvailable.titleHit} />

      <Presenter
        side={presenterSide}
        videoSrc={presenterVideoSrc}
        enterAtFrame={0}
        gesture={
          compareVisible || activeSubjectIndex >= 0
            ? "pointing"
            : activeYearIndex >= 0
              ? "turnedToCard"
              : "lookingAtCamera"
        }
      />

      <div style={columnStyle}>
        <Title
          text={`نتائج ${data.meta.grade}`}
          subtitle="الاختبارات الوطنية نافس"
          startFrame={introLine.sceneRelativeStart}
          size={52}
          align="right"
        />

        <div
          style={{
            marginTop: 18,
            width: "100%",
            opacity: timedReveal(frame, introLine.sceneRelativeStart + 10, 20),
            textAlign: "right",
          }}
        >
          <ArabicText size={24} weight={500} color={colors.muted} align="end">
            {data.headline.label}
          </ArabicText>
        </div>

        <div style={{ position: "relative", marginTop: 24, width: CONTENT_WIDTH - 60 }}>
          <AnimatedBarChart
            points={data.headline.points}
            barStartFrames={barStartFrames}
            activeIndex={activeYearIndex < 0 ? undefined : activeYearIndex}
            width={CONTENT_WIDTH - 60}
            height={380}
          />
          {trendLines.map((l, i) => (
            <SfxCue key={l.id} kind="riser" from={l.sceneRelativeStart + 6} available={sfxAvailable.riser} />
          ))}
          {trendLines.map((l, i) => (
            <SfxCue
              key={`${l.id}-impact`}
              kind="impact"
              from={l.sceneRelativeStart + 30}
              available={sfxAvailable.impact}
            />
          ))}
        </div>

        {compareVisible && (
          <div style={{ marginTop: 10 }}>
            <DataCallout
              value={data.headline.latestChange}
              label="مقدار التغير بين آخر عامين"
              startFrame={compareLine.sceneRelativeStart}
            />
          </div>
        )}

        <div style={{ display: "flex", gap: 16, flexDirection: "row-reverse", marginTop: 22, width: "100%" }}>
          {data.subjects.map((subject, i) => {
            const line = subjectLines[i];
            if (!line || frame < line.sceneRelativeStart) return null;
            const reveal = timedReveal(frame, line.sceneRelativeStart, 18);
            const isActive = activeSubjectIndex === i;
            return (
              <div
                key={subject.key}
                style={{
                  opacity: reveal,
                  transform: `translateY(${(1 - reveal) * 16}px) scale(${isActive ? 1.04 : 1})`,
                  padding: "14px 22px",
                  borderRadius: 14,
                  background: isActive ? "rgba(7,168,105,0.08)" : "rgba(21,68,90,0.04)",
                  border: `1.5px solid ${isActive ? colors.primary : colors.border}`,
                  minWidth: 200,
                }}
              >
                <ArabicText size={22} weight={700} color={colors.ink} align="center">
                  {subject.label}
                </ArabicText>
                <div style={{ marginTop: 6, display: "flex", justifyContent: "center", gap: 10 }}>
                  <ArabicText
                    size={26}
                    weight={800}
                    color={subject.latestChangeProficiency >= 0 ? colors.primary : colors.levelVeryLow}
                    align="center"
                  >
                    {subject.latestChangeProficiency >= 0
                      ? `+${subject.latestChangeProficiency}`
                      : subject.latestChangeProficiency}
                  </ArabicText>
                </div>
              </div>
            );
          })}
        </div>

        {summaryVisible && (
          <div
            style={{
              opacity: timedReveal(frame, summaryLine.sceneRelativeStart, 20),
              transform: `translateY(${(1 - timedReveal(frame, summaryLine.sceneRelativeStart, 20)) * 12}px)`,
              marginTop: 18,
              width: "100%",
            }}
          >
            <ArabicText size={28} weight={700} color={colors.ink} align="end">
              {`النتيجة الحالية: ${data.headline.points[data.headline.points.length - 1].value}%`}
            </ArabicText>
          </div>
        )}
      </div>
    </div>
  );
};
