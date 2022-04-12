export const getBuffered = (media: HTMLMediaElement) => {
  const { buffered, currentTime } = media;
  for (let i = buffered.length - 1; i >= 0; i--) {
    if (buffered.start(i) <= currentTime) {
      return buffered.end(i);
    }
  }
  return null;
};
