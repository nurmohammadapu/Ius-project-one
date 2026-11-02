import { launchImageLibrary } from "react-native-image-picker";

export const MediaTypeOptions = {
  Images: "photo",
  Videos: "video",
  All: "mixed",
};

export async function requestMediaLibraryPermissionsAsync() {
  return { granted: true };
}

export async function launchImageLibraryAsync(options: any = {}) {
  const mediaType = options.mediaTypes === MediaTypeOptions.Videos ? "video" : "photo";
  const result = await launchImageLibrary({
    mediaType: mediaType as any,
    quality: options.quality || 0.8,
    selectionLimit: 1,
  });

  if (result.didCancel || !result.assets || result.assets.length === 0) {
    return { canceled: true, assets: [] };
  }

  return {
    canceled: false,
    assets: result.assets.map((a) => ({
      uri: a.uri,
      fileName: a.fileName,
      type: a.type,
      fileSize: a.fileSize,
    })),
  };
}

