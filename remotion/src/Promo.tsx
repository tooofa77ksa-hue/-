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
import { Dumpling } from "./Dumpling";
import { theme, games } from "./theme";

const { fontFamily } = loadFont();

const Scene: React.FC<{ background: string; children: React.ReactNode }> = ({
  background,
  children,
}) => (
  <AbsoluteFill
    style={{
      background,
      fontFamily,
      direction: "rtl",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    {children}
  </AbsoluteFill>
);

const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 12 } });
  const subtitleOpacity = interpolate(frame, [25, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <Scene background={theme.brandPaper}>
      <div style={{ transform: `scale(${scale})`, textAlign: "center" }}>
        <div
          style={{
            fontSize: 120,
            fontWeight: 700,
            color: theme.brandPrimary,
          }}
        >
          شُعلة لغتي
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 40,
            color: theme.brandInk,
            opacity: subtitleOpacity,
          }}
        >
          منصة تعليمية عربية تفاعلية - مادة لغتي - الصف الثالث الابتدائي
        </div>
      </div>
    </Scene>
  );
};

const MascotScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bounce = spring({ frame, fps, config: { damping: 8, mass: 0.6 } });
  const bubbleOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <Scene background={theme.gameBg1}>
      <div style={{ textAlign: "center" }}>
        <div style={{ transform: `translateY(${(1 - bounce) * 200}px)` }}>
          <Dumpling size={320} mood="cheer" />
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 48,
            fontWeight: 700,
            color: theme.gameInk,
            background: theme.brandPaper,
            borderRadius: 28,
            padding: "16px 40px",
            display: "inline-block",
            opacity: bubbleOpacity,
          }}
        >
          هيا نلعب ونتعلم معًا! 🎉
        </div>
      </div>
    </Scene>
  );
};

const GameCardScene: React.FC<{ index: number }> = ({ index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const game = games[index];
  const slide = spring({ frame, fps, config: { damping: 14 } });
  return (
    <Scene background={game.bg}>
      <div
        style={{
          transform: `translateX(${(1 - slide) * 400}px)`,
          opacity: slide,
          background: theme.brandPaper,
          borderRadius: 32,
          padding: "56px 96px",
          textAlign: "center",
          boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            background: game.accent,
            margin: "0 auto 24px",
          }}
        />
        <div style={{ fontSize: 56, fontWeight: 700, color: theme.gameInk }}>
          {game.name}
        </div>
        <div style={{ marginTop: 16, fontSize: 30, color: theme.brandMuted }}>
          لعبة {index + 1} من 3
        </div>
      </div>
    </Scene>
  );
};

const ClosingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 12 } });
  return (
    <Scene background={theme.brandPrimaryDark}>
      <div style={{ transform: `scale(${scale})`, textAlign: "center" }}>
        <Dumpling size={160} mood="happy" />
        <div
          style={{
            marginTop: 24,
            fontSize: 72,
            fontWeight: 700,
            color: theme.brandPaper,
          }}
        >
          ابدئي الآن
        </div>
        <div style={{ marginTop: 16, fontSize: 32, color: theme.gameGold }}>
          /play للطالبات · /teacher للمعلمة
        </div>
      </div>
    </Scene>
  );
};

export const Promo: React.FC = () => {
  return (
    <>
      <Sequence from={0} durationInFrames={90}>
        <IntroScene />
      </Sequence>
      <Sequence from={90} durationInFrames={90}>
        <MascotScene />
      </Sequence>
      <Sequence from={180} durationInFrames={60}>
        <GameCardScene index={0} />
      </Sequence>
      <Sequence from={240} durationInFrames={60}>
        <GameCardScene index={1} />
      </Sequence>
      <Sequence from={300} durationInFrames={60}>
        <GameCardScene index={2} />
      </Sequence>
      <Sequence from={360} durationInFrames={90}>
        <ClosingScene />
      </Sequence>
    </>
  );
};

export const PROMO_DURATION_IN_FRAMES = 450;
