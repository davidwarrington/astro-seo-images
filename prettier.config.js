import config from '@davidwarrington/prettier-config';
import {
  defineConfig,
  requireOptIn,
} from '@davidwarrington/prettier-config/utils';

export default defineConfig({
  ...config,

  overrides: [...config.overrides, requireOptIn(['dist'])],
});
