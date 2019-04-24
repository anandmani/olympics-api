var express = require('express');
var router = express.Router();
const database = require('../services/database.js');
var path = require('path');

router.get('/trend1', async function(req, res, next) {
  const {game_season, sport} = req.query;
  let db_result = await database.simpleExecute(`
    select Ma as Male_athletes, Fa as Female_Athletes, yy1 as Year
    from
    (select count(*) as Ma,game.year as yy2
    from athlete, participant,competes_in,game
    where athlete.sex='M' AND athlete.id=participant.athlete_id AND participant.id=competes_in.participant_id AND
    competes_in.game_id=game.id  AND game.season='${game_season}'
    group by game.year order by game.year)
    ,
    (select count(*) as Fa,game.year as yy1
    from athlete, participant,competes_in,game
    where athlete.sex='F' AND athlete.id=participant.athlete_id AND participant.id=competes_in.participant_id AND
    competes_in.game_id=game.id  AND game.season='${game_season}'
    group by game.year order by game.year)
    where yy1=yy2 
  `);
  let result = JSON.stringify(db_result.rows)
  // console.log(result);
  res.send(result);
});

router.get('/sports', async function(req, res, next) {
  let db_result = await database.simpleExecute(`
    select distinct event.sport
    from event, event_belongs_to, game
    where event_belongs_to.name = event.name AND event_belongs_to.game_id=game.ID AND game.season='Summer'
    order by sport
  `);
  let result = JSON.stringify(db_result.rows)
  console.log(result);
  res.send(result);
});

router.get('/trend4', async function(req, res, next) {
  let {sport} = req.query;
  if(!Array.isArray(sport)){  //If a single sport is given as query param
    sport = [sport]
  }
  console.log("sport", sport);
  const sport_in = sport.map(val => `\'${val}\'`).join(",");
  let db_result = await database.simpleExecute(`
    select 
      event.sport,
      game.year, 
      round(avg(participant.weight),2) as average_weight, 
      round(avg(participant.height),2) as average_height,
      round(avg(participant.age),2) as average_age
    from participant, competes_in, Event, Game
    where 
      participant.id=competes_in.participant_id AND 
      competes_in.game_id=game.id AND 
      competes_in.event_name=event.name AND
      event.sport in (${sport_in}) 
    group by event.sport, game.year
    order by game.year  
  `);
  //game.year=2014
  let result = JSON.stringify(db_result.rows)
  // console.log(result);
  res.send(result);
});

router.get('/test1', async function(req, res, next) {
  // console.log("path", path);
  res.sendFile(path.resolve(__dirname+'/../public/world-50m.json'));
});
module.exports = router;
