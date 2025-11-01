'use strict';

const express = require('express');
const app = express();

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./openapi/openapi.yaml');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
console.log('✅ Swagger available at /api-docs');

require('dotenv').config();
const { Pool } = require('pg');

const HEADWAY_MIN = parseInt(process.env.HEADWAY_MIN) || 3;
const LAST_WINDOW_START = process.env.LAST_WINDOW_START || '00:45';
const SERVICE_END = process.env.SERVICE_END || '01:15';
const SERVICE_START = process.env.SERVICE_START || '05:30';

// Config DB
// const dbPool = new Pool({
//   host: process.env.POSTGRES_HOST || 'db',
//   port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
//   user: process.env.POSTGRES_USER || 'user',
//   password: process.env.POSTGRES_PASSWORD || 'password',
//   database: process.env.POSTGRES_DB || 'myapp',
// });
const createDbPool = () =>
  new Pool({
    host: process.env.POSTGRES_HOST || 'db',
    port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
    user: process.env.POSTGRES_USER || 'user',
    password: process.env.POSTGRES_PASSWORD || 'password',
    database: process.env.POSTGRES_DB || 'myapp',
  });

const dbPool = global.__TEST_DBPOOL__ || createDbPool();

function parseTimeString(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

const lastWindowStart = parseTimeString(LAST_WINDOW_START);
const serviceEnd = parseTimeString(SERVICE_END);
const serviceStart = parseTimeString(SERVICE_START);

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use((req, res, next) => {
  const t0 = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - t0;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

app.use((req, res, next) => {
  const t0 = Date.now();
  res.on('finish', () => {
    const t1 = Date.now();
    const duration = t1 - t0;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

app.get('/db-health', async (_req, res) => {
  try {
    const result = await dbPool.query('SELECT 1 as TEST');
    res.status(200).json({
      db: 'OK',
      result: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      db: 'error',
      result: error.message,
    });
  }
});

app.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'ok',
  });
});

app.get('/next-metro', (req, res) => {
  const station = req.query.station;

  function nextArrival(now = new Date(), headwayMin = HEADWAY_MIN) {
    const tz = 'Europe/Paris';
    const toHM = (d) =>
      String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');

    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Check if service is closed
    // Service is closed between SERVICE_END and SERVICE_START
    const isServiceClosed =
      (hours === serviceEnd.hours && minutes > serviceEnd.minutes) ||
      (hours > serviceEnd.hours && hours < serviceStart.hours) ||
      (hours === serviceStart.hours && minutes < serviceStart.minutes);

    if (isServiceClosed) {
      return { service: 'closed', tz };
    }

    const end = new Date(now);
    end.setHours(serviceEnd.hours, serviceEnd.minutes, 0, 0);
    const lastWindow = new Date(now);
    lastWindow.setHours(lastWindowStart.hours, lastWindowStart.minutes, 0, 0);

    const isLastTrain =
      (hours === lastWindowStart.hours && minutes >= lastWindowStart.minutes) ||
      (hours > lastWindowStart.hours && hours < serviceEnd.hours) ||
      (hours === serviceEnd.hours && minutes <= serviceEnd.minutes);

    const next = new Date(now.getTime() + headwayMin * 60 * 1000);

    return {
      nextArrival: toHM(next),
      isLast: isLastTrain,
      headwayMin,
      tz,
    };
  }

  if (!station) {
    return res.status(400).json({
      error: 'missing station',
    });
  } else {
    const data = nextArrival();

    if (data.service === 'closed') {
      return res.status(200).json({
        service: 'closed',
        tz: data.tz,
      });
    }

    const result = {
      station: station,
      line: 'M1',
      headwayMin: data.headwayMin,
      nextArrival: data.nextArrival,
      isLast: data.isLast,
      tz: data.tz,
    };
    return res.status(200).json(result);
  }
});

app.get('/last-metro', async (req, res) => {
  const stationQuery = req.query.station;
  if (!stationQuery) {
    return res.status(400).json({ error: 'missing station' });
  }

  const station = stationQuery.trim().toLowerCase();

  try {
    // récupérer les configs
    const { rows: defaultsRows } = await dbPool.query(
      "SELECT value FROM public.config WHERE key = 'metro.defaults'"
    );
    const { rows: lastRows } = await dbPool.query(
      "SELECT value FROM public.config WHERE key = 'metro.last'"
    );

    if (!defaultsRows.length || !lastRows.length) {
      return res.status(500).json({ error: 'Default metro config not found' });
    }

    const defaults = defaultsRows[0].value;
    const lastMap = lastRows[0].value;

    // 2verifier si la station existe
    const lastMetroTime = Object.entries(lastMap).find(
      ([key]) => key.toLowerCase() === station
    )?.[1];

    if (!lastMetroTime) {
      return res.status(404).json({ error: 'Station not found' });
    }

    return res.status(200).json({
      station: stationQuery,
      lastMetro: lastMetroTime,
      line: defaults.line,
      tz: defaults.tz || 'Europe/Paris',
    });
  } catch (err) {
    console.error('Error fetching defaults:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.use((req, res) => {
  return res.status(404).json({
    error: 'not found',
  });
});

// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });

module.exports = { app, dbPool };
