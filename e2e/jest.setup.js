const detox = require('detox');
const adapter = require('detox/runners/jest/adapter');
const specReporter = require('detox/runners/jest/specReporter');
const jestExpect = require('expect');

jest.setTimeout(120000);
jest.retryTimes(process.env.CI ? 2 : 0);

beforeAll(async () => {
  await detox.init(undefined, { initGlobals: false });
  jestExpect.setState({ expand: false });
});

beforeEach(async () => {
  await adapter.beforeEach();
});

afterAll(async () => {
  await adapter.afterAll();
  await detox.cleanup();
});

expect.extend(specReporter);

