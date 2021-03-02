const { Router } = require("express");
require("dotenv").config();
const router = Router();

const Pool = require("pg").Pool;
const pool = new Pool({
  user: process.env.USER,
  host: process.env.HOST,
  database: process.env.DB,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

router.get("/", (req, res, next) => {
  const { left, bottom, right, top } = req.body;
  try {
    pool.query(
      "SELECT st_x(geom) as lng, st_y(geom) as lat FROM locations WHERE geom @ ST_MakeEnvelope($1, $2, $3, $4, 4326)",
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
