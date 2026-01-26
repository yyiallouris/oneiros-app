export const makeRedirectUri = jest.fn(({ scheme = 'dreamjournal', path = '' } = {}) => {
  const cleanedPath = path ? `/${path.replace(/^\\//, '')}` : '';
  return `${scheme}://${cleanedPath}`;
});

