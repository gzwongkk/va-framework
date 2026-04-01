import { datasetDescriptorSchema, type DatasetDescriptor } from '@va/contracts';

export const starterDatasets: DatasetDescriptor[] = datasetDescriptorSchema.array().parse([
  {
    id: 'cars',
    title: 'Cars',
    description: 'Starter tabular dataset for the single-view analytics workflow.',
    kind: 'tabular',
    tags: ['starter', 'vega', 'tabular'],
    provenance: {
      name: 'Vega Cars dataset',
      url: 'https://vega.github.io/vega-datasets/data/cars.json',
      license: 'Public sample dataset',
      notes: 'Curated local sample for the v2 single-view analytics workflow.',
    },
    schema: {
      entity: 'rows',
      primaryKey: ['name', 'year'],
      rowCount: 12,
      fields: [
        { name: 'name', title: 'Name', dataType: 'string', role: 'identifier' },
        { name: 'miles_per_gallon', title: 'Miles per gallon', dataType: 'number', role: 'measure', unit: 'mpg' },
        { name: 'cylinders', title: 'Cylinders', dataType: 'number', role: 'measure' },
        { name: 'horsepower', title: 'Horsepower', dataType: 'number', role: 'measure' },
        { name: 'weight_in_lbs', title: 'Weight', dataType: 'number', role: 'measure', unit: 'lbs' },
        { name: 'year', title: 'Model year', dataType: 'date', role: 'timestamp' },
        { name: 'origin', title: 'Origin', dataType: 'string', role: 'category' },
      ],
    },
    loader: {
      format: 'json',
      localPath: '/datasets/cars.sample.json',
      remotePath: '/api/query',
      tableName: 'cars',
    },
    execution: {
      defaultMode: 'local',
      supportedModes: ['local', 'remote'],
      rowCount: 12,
      preferredPreviewLimit: 8,
      notes: [
        'Local preview should stay instant for the single-view cars workflow.',
        'Remote execution remains available for parity and later heavier transforms.',
      ],
    },
  },
  {
    id: 'miserables',
    title: 'Les Miserables graph',
    description: 'Starter graph dataset queued for the v2.3 graph milestone.',
    kind: 'graph',
    tags: ['starter', 'vega', 'graph'],
    provenance: {
      name: 'Vega Miserables dataset',
      url: 'https://vega.github.io/vega-datasets/data/miserables.json',
      license: 'Public sample dataset',
      notes: 'Curated local sample with nodes and weighted links.',
    },
    schema: {
      entity: 'nodes',
      primaryKey: ['id'],
      labelField: 'id',
      rowCount: 8,
      fields: [
        { name: 'id', title: 'Node id', dataType: 'string', role: 'identifier' },
        { name: 'group', title: 'Community', dataType: 'number', role: 'category' },
      ],
      entities: {
        nodes: {
          primaryKey: ['id'],
          labelField: 'id',
          rowCount: 8,
          fields: [
            { name: 'id', title: 'Node id', dataType: 'string', role: 'identifier' },
            { name: 'group', title: 'Community', dataType: 'number', role: 'category' },
          ],
        },
        links: {
          primaryKey: ['source', 'target'],
          rowCount: 7,
          sourceField: 'source',
          targetField: 'target',
          weightField: 'value',
          fields: [
            { name: 'source', title: 'Source', dataType: 'string', role: 'identifier' },
            { name: 'target', title: 'Target', dataType: 'string', role: 'identifier' },
            { name: 'value', title: 'Weight', dataType: 'number', role: 'measure' },
          ],
        },
      },
    },
    loader: {
      format: 'json',
      localPath: '/datasets/miserables.sample.json',
      remotePath: '/api/query',
      tableName: 'miserables_nodes',
    },
    execution: {
      defaultMode: 'local',
      supportedModes: ['local', 'remote'],
      rowCount: 8,
      preferredPreviewLimit: 8,
      notes: [
        'Graph exploration defaults to the local graphology runtime in v2.3.0.',
        'Remote execution remains available for parity and heavier graph transforms.',
      ],
    },
  },
  {
    id: 'earthquakes',
    title: 'Earthquakes',
    description: 'Starter spatio-temporal dataset reserved for the v2.4 milestone.',
    kind: 'spatio-temporal',
    tags: ['starter', 'vega', 'spatio-temporal'],
    provenance: {
      name: 'Vega Earthquakes dataset',
      url: 'https://vega.github.io/vega-datasets/data/earthquakes.json',
      license: 'Public sample dataset',
      notes: 'Curated local sample with latitude, longitude, and time.',
    },
    schema: {
      entity: 'rows',
      primaryKey: ['id'],
      labelField: 'place',
      timeField: 'time',
      rowCount: 8,
      fields: [
        { name: 'id', title: 'Event id', dataType: 'string', role: 'identifier' },
        { name: 'time', title: 'Time', dataType: 'date', role: 'timestamp' },
        { name: 'latitude', title: 'Latitude', dataType: 'latitude', role: 'location' },
        { name: 'longitude', title: 'Longitude', dataType: 'longitude', role: 'location' },
        { name: 'magnitude', title: 'Magnitude', dataType: 'number', role: 'measure' },
        { name: 'depth_km', title: 'Depth', dataType: 'number', role: 'measure', unit: 'km' },
        { name: 'place', title: 'Place', dataType: 'string', role: 'category' },
      ],
    },
    loader: {
      format: 'json',
      localPath: '/datasets/earthquakes.sample.json',
      remotePath: '/api/query',
      tableName: 'earthquakes',
    },
    execution: {
      defaultMode: 'remote',
      supportedModes: ['local', 'remote'],
      rowCount: 8,
      preferredPreviewLimit: 6,
      notes: [
        'Spatial viewport coordination is planned for the spatio-temporal milestone.',
      ],
    },
  },
]);
