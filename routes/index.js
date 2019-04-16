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

router.get('/trend1', async function(req, res, next) {
  let id = req.query.id;
  let db_result = await database.simpleExecute(`
    select count(*) as count, game.year 
    from athlete, participant, competes_in,game 
    where athlete.sex='F' AND 
      athlete.id=participant.athlete_id AND 
      participant.id=competes_in.participant_id AND
      competes_in.game_id=game.id AND 
      game.season='Summer' 
    group by game.year 
    order by game.year
  `);
  let result = JSON.stringify(db_result.rows)
  console.log(result);
  res.send(result);
});

module.exports = router;
