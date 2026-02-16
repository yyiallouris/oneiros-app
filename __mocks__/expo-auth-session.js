export const makeRedirectUri = jest.fn(({ scheme = 'oneiros-dream-journal', path = '' } = {}) => {
  const cleanedPath = path ? `/${path.replace(/^\\//, '')}` : '';
  return `${scheme}://${cleanedPath}`;
});

