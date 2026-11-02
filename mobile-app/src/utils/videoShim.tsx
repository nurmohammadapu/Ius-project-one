import React, { forwardRef } from "react";
import RNVideo from "react-native-video";

export const ResizeMode = {
  CONTAIN: "contain" as const,
  COVER: "cover" as const,
  STRETCH: "stretch" as const,
};

export const Video = forwardRef((props: any, ref: any) => {
  const { useNativeControls, isLooping, resizeMode, ...rest } = props;
  return (
    <RNVideo
      ref={ref}
      controls={useNativeControls ?? true}
      repeat={isLooping ?? false}
      resizeMode={typeof resizeMode === "string" ? (resizeMode.toLowerCase() as any) : "contain"}
      {...rest}
    />
  );
});

