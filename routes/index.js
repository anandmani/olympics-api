var express = require('express');
var router = express.Router();
const database = require('../services/database.js');

/* GET home page. */
router.get('/', async function(req, res, next) {

      // let result = await connection.execute(
    //   `SELECT manager_id, department_id, department_name
    //    FROM departments
    //    WHERE manager_id = :id`,
    //   [103],  // bind value for :id
    // );
    
  const result = await database.simpleExecute('SELECT * FROM ATHLETE WHERE ID = 6157');
  console.log(result.rows);
  res.render('index', { title: 'Express' });
});

module.exports = router;
