import { Composition } from "remotion";
import { Grade3Nafs, grade3TotalDuration } from "./Grade3Nafs";
import { Grade6Nafs, grade6TotalDuration } from "./Grade6Nafs";
import { SchoolStats, schoolStatsTotalDuration } from "./SchoolStats";
import { SchoolAchievementsFull, achievementsFullTotalDuration } from "./SchoolAchievementsFull";
import { SchoolKroki, krokiTotalDuration } from "./SchoolKroki";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Grade3Nafs"
        component={Grade3Nafs}
        durationInFrames={grade3TotalDuration}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Grade6Nafs"
        component={Grade6Nafs}
        durationInFrames={grade6TotalDuration}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="SchoolStats"
        component={SchoolStats}
        durationInFrames={schoolStatsTotalDuration}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="SchoolAchievementsFull"
        component={SchoolAchievementsFull}
        durationInFrames={achievementsFullTotalDuration}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="SchoolKroki"
        component={SchoolKroki}
        durationInFrames={krokiTotalDuration}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
