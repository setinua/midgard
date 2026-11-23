import * as migration_20261123_072943_initial from './20261123_072943_initial';
import * as migration_20261123_081120_s3_object_key from './20261123_081120_s3_object_key';

export const migrations = [
  {
    up: migration_20261123_072943_initial.up,
    down: migration_20261123_072943_initial.down,
    name: '20261123_072943_initial',
  },
  {
    up: migration_20261123_081120_s3_object_key.up,
    down: migration_20261123_081120_s3_object_key.down,
    name: '20261123_081120_s3_object_key'
  },
];
