import * as migration_20261123_072943_initial from './20261123_072943_initial';
import * as migration_20261123_081120_s3_object_key from './20261123_081120_s3_object_key';
import * as migration_20261123_120538_media_license_optional from './20261123_120538_media_license_optional';
import * as migration_20261124_190000_slug_whole_words from './20261124_190000_slug_whole_words';
import * as migration_20261126_200224_sections_global from './20261126_200224_sections_global';
import * as migration_20261126_203000_clear_auto_related from './20261126_203000_clear_auto_related';
import * as migration_20261127_190000_claude_connector from './20261127_190000_claude_connector';
import * as migration_20261128_091124_banners from './20261128_091124_banners';
import * as migration_20261128_095740_verification from './20261128_095740_verification';

export const migrations = [
  {
    up: migration_20261123_072943_initial.up,
    down: migration_20261123_072943_initial.down,
    name: '20261123_072943_initial',
  },
  {
    up: migration_20261123_081120_s3_object_key.up,
    down: migration_20261123_081120_s3_object_key.down,
    name: '20261123_081120_s3_object_key',
  },
  {
    up: migration_20261123_120538_media_license_optional.up,
    down: migration_20261123_120538_media_license_optional.down,
    name: '20261123_120538_media_license_optional',
  },
  {
    up: migration_20261124_190000_slug_whole_words.up,
    down: migration_20261124_190000_slug_whole_words.down,
    name: '20261124_190000_slug_whole_words',
  },
  {
    up: migration_20261126_200224_sections_global.up,
    down: migration_20261126_200224_sections_global.down,
    name: '20261126_200224_sections_global',
  },
  {
    up: migration_20261126_203000_clear_auto_related.up,
    down: migration_20261126_203000_clear_auto_related.down,
    name: '20261126_203000_clear_auto_related',
  },
  {
    up: migration_20261127_190000_claude_connector.up,
    down: migration_20261127_190000_claude_connector.down,
    name: '20261127_190000_claude_connector',
  },
  {
    up: migration_20261128_091124_banners.up,
    down: migration_20261128_091124_banners.down,
    name: '20261128_091124_banners',
  },
  {
    up: migration_20261128_095740_verification.up,
    down: migration_20261128_095740_verification.down,
    name: '20261128_095740_verification'
  },
];
