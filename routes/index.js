var express = require('express');
var router = express.Router();
const database = require('../services/database.js');

/* GET home page. */
router.get('/test', async function(req, res, next) {
      // let result = await connection.execute(
    //   `SELECT manager_id, department_id, department_name
    //    FROM departments
    //    WHERE manager_id = :id`,
    //   [103],  // bind value for :id
    // );
  let id = req.query.id;
  let db_result = await database.simpleExecute(`SELECT * FROM ATHLETE WHERE ID = ${id}`);
  let result = JSON.stringify(db_result.rows)
  console.log(result);
  res.send(result);
});

module.exports = router;
