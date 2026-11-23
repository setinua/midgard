import * as migration_20261123_072943_initial from './20261123_072943_initial';

export const migrations = [
  {
    up: migration_20261123_072943_initial.up,
    down: migration_20261123_072943_initial.down,
    name: '20261123_072943_initial'
  },
];
