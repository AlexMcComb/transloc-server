const { Router } = require("express");
require("dotenv").config();
const router = Router();
const connectionString = process.env.DATABASE_URL;
const Pool = require("pg").Pool;
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

router.get("/", (req, res, next) => {
  const { left, bottom, right, top } = req.query;
  try {
    pool.query(
      `SELECT jsonb_build_object('type','FeatureCollection','features', jsonb_agg(feature))
      FROM (SELECT jsonb_build_object('type','Feature','geometry', ST_AsGeoJSON(geom)::json)
      AS feature FROM
      (
          SELECT ST_ClusterDBSCAN(geom, eps := 0.05, minpoints := 2) over () AS cid, geom
          FROM locations
          WHERE ST_TRANSFORM(geom,4326)
              @
              ST_MakeEnvelope (
              $1, $2,
              $3, $4,
              4326)     
          GROUP BY(geom)
      ) as x
      WHERE cid IS NOT NULL
      GROUP BY x.geom, x.cid) features;`,
      [left, bottom, right, top],
      (error, results) => {
        if (error) {
          throw error;
        }
        res.status(200).json(results.rows);
      }
    );
  } catch (err) {
    next(error);
  }
});

module.exports = router;
