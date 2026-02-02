export const toDriveDownloadUrl = (url) => {
  if (!url) return "";

  const match = url.match(/\/d\/([^/]+)/);
  if (!match) return url;

  return `https://drive.google.com/uc?export=download&id=${match[1]}`;
};
