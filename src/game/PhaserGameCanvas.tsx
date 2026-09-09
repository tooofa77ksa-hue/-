import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { GAME_MODE_SCENES } from "@/game/modes/registry";
import type { GameMode } from "@/types/models";

interface Props {
  mode: GameMode;
  reducedMotion: boolean;
}

export function PhaserGameCanvas({ mode, reducedMotion }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const SceneClass = GAME_MODE_SCENES[mode];

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: containerRef.current,
      backgroundColor: "#fff4d6",
      scale: {
        mode: Phaser.Scale.RESIZE,
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      },
      scene: [SceneClass],
      render: { antialias: true, pixelArt: false, powerPreference: "low-power" },
      banner: false,
    });
    game.registry.set("reducedMotion", reducedMotion);
    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    gameRef.current?.registry.set("reducedMotion", reducedMotion);
  }, [reducedMotion]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%", touchAction: "none" }} />;
}
