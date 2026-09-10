import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import type { Timeline } from "./timeline";
import { getScene } from "./timeline";
import type { SfxKey } from "./audio/checkAssetExists";
import { MusicBed } from "./audio/MusicBed";
import { MinistryLogo } from "./components/MinistryLogo/MinistryLogo";
import { sceneTransition } from "./components/Transition/SceneTransition";
import { IntroScene } from "./compositions/scenes/Intro";
import { NafesThirdScene } from "./compositions/scenes/NafesThird";
import { TransitionScene } from "./compositions/scenes/Transition";
import { NafesSixthScene } from "./compositions/scenes/NafesSixth";
import { OutroScene } from "./compositions/scenes/Outro";
import { nafesThird } from "./data/nafes-third";
import { ensureArabicFontLoaded } from "./styles/fonts";

export interface MainVideoProps extends Record<string, unknown> {
  timeline: Timeline;
  musicAvailable: boolean;
  sfxAvailable: Record<SfxKey, boolean>;
  presenterVideoSrc?: string;
}

/**
 * التركيبة الرئيسية للفيديو كاملًا - تجمع كل المشاهد عبر TransitionSeries
 * الرسمية من @remotion/transitions بحسب ترتيب src/timeline.ts. إضافة مشهد
 * جديد مستقبلًا = إضافة <TransitionSeries.Sequence> واحد هنا بعد تحديث
 * timeline.ts، بلا أي تعديل على المشاهد الموجودة أو توقيتها.
 */
export const MainVideo: React.FC<MainVideoProps> = ({
  timeline,
  musicAvailable,
  sfxAvailable,
  presenterVideoSrc,
}) => {
  ensureArabicFontLoaded();
  const intro = getScene(timeline, "intro");
  const third = getScene(timeline, "nafesThird");
  const transition = getScene(timeline, "transition");
  const sixth = getScene(timeline, "nafesSixth");
  const outro = getScene(timeline, "outro");

  return (
    <AbsoluteFill style={{ backgroundColor: "#ffffff" }}>
      <MusicBed timeline={timeline} available={musicAvailable} />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={intro.durationInFrames}>
          <IntroScene scene={intro} meta={nafesThird.meta} sfxAvailable={sfxAvailable} presenterVideoSrc={presenterVideoSrc} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...sceneTransition("from-left")} />

        <TransitionSeries.Sequence durationInFrames={third.durationInFrames}>
          <NafesThirdScene scene={third} sfxAvailable={sfxAvailable} presenterVideoSrc={presenterVideoSrc} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...sceneTransition("from-right")} />

        <TransitionSeries.Sequence durationInFrames={transition.durationInFrames}>
          <TransitionScene scene={transition} sfxAvailable={sfxAvailable} presenterVideoSrc={presenterVideoSrc} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...sceneTransition("from-left")} />

        <TransitionSeries.Sequence durationInFrames={sixth.durationInFrames}>
          <NafesSixthScene scene={sixth} sfxAvailable={sfxAvailable} presenterVideoSrc={presenterVideoSrc} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition {...sceneTransition("from-right")} />

        <TransitionSeries.Sequence durationInFrames={outro.durationInFrames}>
          <OutroScene scene={outro} sfxAvailable={sfxAvailable} presenterVideoSrc={presenterVideoSrc} />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <MinistryLogo />
    </AbsoluteFill>
  );
};
