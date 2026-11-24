import * as migration_20261123_072943_initial from './20261123_072943_initial';
import * as migration_20261123_081120_s3_object_key from './20261123_081120_s3_object_key';
import * as migration_20261123_120538_media_license_optional from './20261123_120538_media_license_optional';
import * as migration_20261124_190000_slug_whole_words from './20261124_190000_slug_whole_words';

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
    name: '20261123_120538_media_license_optional'
  },
  {
    up: migration_20261124_190000_slug_whole_words.up,
    down: migration_20261124_190000_slug_whole_words.down,
    name: '20261124_190000_slug_whole_words',
  },
];
