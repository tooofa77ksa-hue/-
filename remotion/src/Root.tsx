import React from "react";
import { Composition } from "remotion";
import { Promo, PROMO_DURATION_IN_FRAMES } from "./Promo";
import { TeacherGuide, TEACHER_GUIDE_DURATION_IN_FRAMES } from "./TeacherGuide";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Promo"
        component={Promo}
        durationInFrames={PROMO_DURATION_IN_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="TeacherGuide"
        component={TeacherGuide}
        durationInFrames={TEACHER_GUIDE_DURATION_IN_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
