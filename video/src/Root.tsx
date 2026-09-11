import { Composition } from "remotion";
import { Grade3Nafs, grade3TotalDuration } from "./Grade3Nafs";

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
    </>
  );
};
