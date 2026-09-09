import { Routes, Route } from "react-router-dom";
import { ModeSelect } from "./ModeSelect";
import { GameScreen } from "./GameScreen";
import { SessionPlayScreen } from "./SessionPlayScreen";
import "./play.css";

export default function PlayApp() {
  return (
    <div className="play-app">
      <Routes>
        <Route index element={<ModeSelect />} />
        <Route path="t/:sessionId" element={<SessionPlayScreen />} />
        <Route path=":mode" element={<GameScreen />} />
      </Routes>
    </div>
  );
}
