var express = require('express');
var router = express.Router();
const database = require('../services/database.js');
var path = require('path');

router.get('/check100k', async function (req, res, next) {
  let db_result = await database.simpleExecute(`
    SELECT count(id) AS count FROM participant
  `);
  let result = JSON.stringify(db_result.rows)
  res.send(result);
});

router.get('/trend1', async function (req, res, next) {
  const { game_season, sport } = req.query;
  let db_result = await database.simpleExecute(`
    SELECT
      Ma AS Male_athletes, Fa AS Female_Athletes, yy1 AS Year
    FROM (
      SELECT count(*) AS Ma, game.year AS yy2
      FROM athlete, participant, competes_in, game
      WHERE
        athlete.sex = 'M'
        AND athlete.id = participant.athlete_id
        AND participant.id = competes_in.participant_id
        AND competes_in.game_id = game.id
        AND game.season = '${game_season}'
      GROUP BY game.year
      ORDER BY game.year
    ),
    (
      SELECT count(*) AS Fa, game.year AS yy1
      FROM
        athlete, participant, competes_in, game
      WHERE
        athlete.sex = 'F'
        AND athlete.id = participant.athlete_id
        AND participant.id = competes_in.participant_id
        AND competes_in.game_id = game.id
        AND game.season = '${game_season}'
      GROUP BY
        game.year
      ORDER BY
        game.year
    )
    WHERE yy1 = yy2
  `);
  let result = JSON.stringify(db_result.rows)
  res.send(result);
});

router.get('/sports123', async function (req, res, next) {
  let db_result = await database.simpleExecute(`
    select distinct event.sport
    from event, event_belongs_to, game
    where event_belongs_to.name = event.name AND event_belongs_to.game_id=game.ID AND game.season='Summer'
    order by sport
  `);
  let result = JSON.stringify(db_result.rows)
  // console.log(result);
  res.send(result);
});



router.get('/trend2', async function (req, res, next) {
  let db_result = await database.simpleExecute(`
    SELECT REG AS COUNTRY, RATE AS PERFORMANCE, YY4 AS YEAR, PCI AS PER_CAPITA_INCOME
    FROM  (
      SELECT NOC2 AS NOC4, ROUND((PARTY/MEDAL),2) AS RATE, YY2 AS YY4, GID1
      FROM
      (
        SELECT belongs_to.noc_id AS NOC2, COUNT(competes_in.medal) AS MEDAL, GAME.YEAR AS YY2, GAME.ID AS GID1
        FROM BELONGS_TO, COMPETES_IN, GAME
        WHERE 
          BELONGS_TO.PARTICIPANT_ID=COMPETES_IN.PARTICIPANT_ID AND 
          GAME.ID=COMPETES_IN.GAME_ID AND 
          GAME.YEAR = ${req.query.year} AND 
          MEDAL!='N' AND
          GAME.SEASON = 'Summer'
        GROUP BY belongs_to.noc_id, GAME.ID, GAME.YEAR
        ORDER BY game.year, belongs_to.noc_id
      ),
      (
        SELECT belongs_to.noc_id AS NOC3, COUNT(distinct ATHLETE.ID) AS PARTY, GAME.YEAR AS YY3, GAME.ID AS GID2
        FROM BELONGS_TO, COMPETES_IN, GAME, ATHLETE, PARTICIPANT
        WHERE 
          BELONGS_TO.PARTICIPANT_ID=COMPETES_IN.PARTICIPANT_ID AND 
          GAME.ID=COMPETES_IN.GAME_ID AND 
          GAME.YEAR = ${req.query.year} AND 
          ATHLETE.ID=PARTICIPANT.ATHLETE_ID AND 
          PARTICIPANT.ID=COMPETES_IN.PARTICIPANT_ID AND
          GAME.SEASON = 'Summer'
        GROUP BY belongs_to.noc_id, GAME.ID, GAME.YEAR
        ORDER BY game.year, belongs_to.noc_id
      )
      WHERE YY2=YY3 AND GID1=GID2 AND NOC2=NOC3
      ORDER BY YY2,GID2,NOC2
    ),
    (
      SELECT NOC.ID AS NOC1, REGION_DATA.REGION AS REG, region_data.year AS YY1, ROUND((region_data.gdp/region_data.population),2) AS PCI
      FROM NOC, REGION_DATA
      WHERE NOC.REGION=REGION_DATA.REGION
      ORDER BY region_data.region, region_data.year
    )
    WHERE NOC1=NOC4 AND YY1=YY4
    ORDER BY YY1,REG
  `);
  let result = JSON.stringify(db_result.rows)
  res.send(result);
});



router.get('/trend3', async function (req, res, next) {
  let db_result = await database.simpleExecute(`
    SELECT 
      noc.region AS country, 
      game.year, 
      count(belongs_to.participant_id) AS participants
    FROM noc, noc_participates_in, game, competes_in, belongs_to
    WHERE
      noc.id = noc_participates_in.noc_id
      AND game.id = noc_participates_in.game_id
      AND competes_in.game_id = game.id
      AND belongs_to.participant_id = competes_in.participant_id
      AND belongs_to.noc_id = noc.id
      AND game.season = 'Summer'
      AND game.year = ${req.query.year}
    GROUP BY noc.region, game.year
    ORDER BY noc.region
  `);
  let result = JSON.stringify(db_result.rows)
  res.send(result);
});



router.get('/trend4', async function (req, res, next) {
  let { sport } = req.query;
  if (!Array.isArray(sport)) {  //If a single sport is given as query param
    sport = [sport]
  }
  const sport_in = sport.map(val => `\'${val}\'`).join(",");
  let db_result = await database.simpleExecute(`
    SELECT
      event.sport,
      game.year,
      round(avg(participant.height), 2) AS average_height
    FROM
      participant,
      competes_in,
      Event,
      Game
    WHERE
      participant.id = competes_in.participant_id
      AND competes_in.game_id = game.id
      AND competes_in.event_name = event.name
      AND participant.height IS NOT NULL
      AND event.sport IN (${sport_in})
    GROUP BY
      event.sport,
      game.year
    ORDER BY
      game.year
  `);
  // round(avg(participant.weight),2) as average_weight,
  // round(avg(participant.age),2) as average_age 
  let result = JSON.stringify(db_result.rows)
  res.send(result);
});

router.get('/trend5', async function (req, res, next) {
  let db_result = await database.simpleExecute(`
    SELECT
      GIDH AS GAME,
      GYH AS YEAR,
      HOST AS HOST,
      GOLDH AS GOLD,
      (GOLDH / GOLDO) * 100 AS GOLD_PERCENTAGE,
      SILVERH AS SILVER,
      (SILVERH / SILVERO) * 100 AS SILVER_PERCENTAGE,
      BRONZEH AS BRONZE,
      (BRONZEH / BRONZEO) * 100 AS BRONZE_PERCENTAGE
    FROM (
      SELECT
        GIDHG AS GIDH,
        GYHG AS GYH,
        HOST1 AS HOST,
        GH AS GOLDH,
        SH AS SILVERH,
        BH AS BRONZEH
      FROM (
        SELECT
          GAME.ID AS GIDHG,
          GAME.YEAR AS GYHG,
          COUNT(DISTINCT COMPETES_IN.EVENT_NAME) AS GH,
          NOC.REGION AS HOST1
        FROM
          HOST, GAME, NOC, COMPETES_IN, BELONGS_TO
        WHERE
          HOST.GAME_ID = GAME.ID
          AND HOST.COUNTRY = NOC.REGION
          AND COMPETES_IN.GAME_ID = GAME.ID
          AND COMPETES_IN.GAME_ID = GAME.ID
          AND BELONGS_TO.PARTICIPANT_ID = COMPETES_IN.PARTICIPANT_ID
          AND BELONGS_TO.NOC_ID = NOC.ID
          AND COMPETES_IN.MEDAL = 'G'
          AND GAME.SEASON = 'Summer'
        GROUP BY GAME.ID, GAME.YEAR, NOC.REGION
        ORDER BY GAME.ID
      ),
      (
        SELECT
          GAME.ID GIDHS,
          GAME.YEAR GYHS,
          COUNT(DISTINCT COMPETES_IN.EVENT_NAME) AS SH,
          NOC.REGION AS HOST2
        FROM
          HOST, GAME, NOC, COMPETES_IN, BELONGS_TO
        WHERE
          HOST.GAME_ID = GAME.ID
          AND HOST.COUNTRY = NOC.REGION
          AND COMPETES_IN.GAME_ID = GAME.ID
          AND COMPETES_IN.GAME_ID = HOST.GAME_ID
          AND BELONGS_TO.PARTICIPANT_ID = COMPETES_IN.PARTICIPANT_ID
          AND BELONGS_TO.NOC_ID = NOC.ID
          AND COMPETES_IN.MEDAL = 'S'
          AND GAME.SEASON = 'Summer'
        GROUP BY GAME.ID, GAME.YEAR, NOC.REGION
        ORDER BY GAME.ID
      ),
      (
        SELECT
          GAME.ID AS GIDHB,
          GAME.YEAR AS GYHB,
          COUNT(DISTINCT COMPETES_IN.EVENT_NAME) AS BH,
          NOC.REGION AS HOST3
        FROM
          HOST, GAME, NOC, COMPETES_IN, BELONGS_TO
        WHERE
          HOST.GAME_ID = GAME.ID
          AND HOST.COUNTRY = NOC.REGION
          AND COMPETES_IN.GAME_ID = GAME.ID
          AND COMPETES_IN.GAME_ID = HOST.GAME_ID
          AND BELONGS_TO.PARTICIPANT_ID = COMPETES_IN.PARTICIPANT_ID
          AND BELONGS_TO.NOC_ID = NOC.ID
          AND COMPETES_IN.MEDAL = 'B'
          AND GAME.SEASON = 'Summer'
        GROUP BY GAME.ID, GAME.YEAR, NOC.REGION
        ORDER BY GAME.ID, NOC.REGION
      )
      WHERE GIDHG = GIDHS AND GIDHS = GIDHB
    ), 
    (
      SELECT GIDOG AS GIDO, GYOG AS GYO, GO AS GOLDO, SO AS SILVERO, BO AS BRONZEO
      FROM (
        SELECT GAME.ID AS GIDOG, GAME.YEAR AS GYOG, COUNT(DISTINCT COMPETES_IN.EVENT_NAME) AS GO
        FROM HOST, GAME, NOC, COMPETES_IN, BELONGS_TO
        WHERE
          HOST.GAME_ID = GAME.ID
          AND COMPETES_IN.GAME_ID = GAME.ID
          AND COMPETES_IN.GAME_ID = GAME.ID
          AND GAME.SEASON = 'Summer'
          AND BELONGS_TO.PARTICIPANT_ID = COMPETES_IN.PARTICIPANT_ID
          AND BELONGS_TO.NOC_ID = NOC.ID
          AND COMPETES_IN.MEDAL = 'G'
        GROUP BY GAME.ID, GAME.YEAR
        ORDER BY GAME.ID
      ),
      (
        SELECT GAME.ID AS GIDOS, GAME.YEAR AS GYOS, COUNT(DISTINCT COMPETES_IN.EVENT_NAME) AS SO
        FROM HOST, GAME, NOC, COMPETES_IN, BELONGS_TO
        WHERE
          HOST.GAME_ID = GAME.ID
          AND COMPETES_IN.GAME_ID = GAME.ID
          AND COMPETES_IN.GAME_ID = HOST.GAME_ID
          AND GAME.SEASON = 'Summer'
          AND BELONGS_TO.PARTICIPANT_ID = COMPETES_IN.PARTICIPANT_ID
          AND BELONGS_TO.NOC_ID = NOC.ID
          AND COMPETES_IN.MEDAL = 'S'
        GROUP BY GAME.ID, GAME.YEAR
        ORDER BY GAME.ID
      ),
      (
        SELECT GAME.ID AS GIDOB, GAME.YEAR AS GYOB, COUNT(DISTINCT COMPETES_IN.EVENT_NAME) AS BO
        FROM HOST, GAME, NOC, COMPETES_IN, BELONGS_TO
        WHERE
          HOST.GAME_ID = GAME.ID
          AND COMPETES_IN.GAME_ID = GAME.ID
          AND COMPETES_IN.GAME_ID = HOST.GAME_ID
          AND GAME.SEASON = 'Summer'
          AND BELONGS_TO.PARTICIPANT_ID = COMPETES_IN.PARTICIPANT_ID
          AND BELONGS_TO.NOC_ID = NOC.ID
          AND COMPETES_IN.MEDAL = 'B'
        GROUP BY GAME.ID, GAME.YEAR
        ORDER BY GAME.ID
      )
      WHERE GIDOG = GIDOS AND GIDOS = GIDOB
    )
    WHERE GYH = GYO AND GIDH = GIDO
  `);
  let result = JSON.stringify(db_result.rows)
  res.send(result);
});

router.get('/countrytally', async function (req, res, next) {
  let db_result = await database.simpleExecute(`
    SELECT DISTINCT
      r1 AS country,
      COALESCE(gm, 0) AS gold,
      COALESCE(sm, 0) silver,
      COALESCE(bm, 0) AS bronze
    FROM (
      SELECT bm, noc.region AS r1
      FROM noc
      FULL OUTER JOIN (
        SELECT
          count(eb) AS bm, rb
        FROM (
          SELECT
            competes_in.event_name AS eb, game.year AS yyb, noc.region AS rb
          FROM
            competes_in, belongs_to, noc, game
          WHERE
            competes_in.participant_id = belongs_to.participant_id
            AND belongs_to.noc_id = noc.id
            AND competes_in.medal = 'B'
            AND game.id = competes_in.game_id
            AND game.year > 1800
          GROUP BY
            competes_in.event_name, game.year, noc.region
          ORDER BY
            noc.region, game.year
          )
        GROUP BY rb
        ORDER BY rb
      ) ON noc.region = rb
    ),
    (
      SELECT sm, noc.region AS r2
      FROM noc
      FULL OUTER JOIN (
        SELECT count(es) AS sm, rs
        FROM (
          SELECT competes_in.event_name AS es, game.year yys, noc.region AS rs
          FROM competes_in, belongs_to, noc, game
          WHERE
            competes_in.participant_id = belongs_to.participant_id
            AND belongs_to.noc_id = noc.id
            AND competes_in.medal = 'S'
            AND game.id = competes_in.game_id
            AND game.year > 1800
          GROUP BY competes_in.event_name, game.year, noc.region
          ORDER BY noc.region, game.year
        )
        GROUP BY rs
        ORDER BY rs
      ) ON noc.region = rs
    ),
    (
      SELECT gm, noc.region AS r3
      FROM noc
      FULL OUTER JOIN (
        SELECT
          count(eg) AS gm, rg
        FROM (
          SELECT
            competes_in.event_name AS eg, game.year yys, noc.region AS rg
          FROM
            competes_in, belongs_to, noc, game
          WHERE
            competes_in.participant_id = belongs_to.participant_id
            AND belongs_to.noc_id = noc.id
            AND competes_in.medal = 'G'
            AND game.id = competes_in.game_id
            AND game.year > 1800
          GROUP BY competes_in.event_name, game.year, noc.region
          ORDER BY noc.region, game.year
        )
        GROUP BY rg
        ORDER BY rg
      ) ON noc.region = rg
    )
    WHERE r1 = r2 AND r2 = r3
    ORDER BY gold DESC, silver DESC, bronze DESC
  `);
  let result = JSON.stringify(db_result.rows)
  res.send(result);
});

router.get('/sports', async function (req, res, next) {
  let db_result = await database.simpleExecute(`
    SELECT DISTINCT event.sport, gs AS sport_season
    FROM
      event,
      (
        SELECT
          event.name AS ev1, game.season AS gs
        FROM
          event, event_belongs_to, game
        WHERE
          event.name = event_belongs_to.name
          AND event_belongs_to.game_id = game.id
        GROUP BY
          event.name, game.season
      )
      WHERE ev1 = event.name
      ORDER BY gs, event.sport  
  `);
  let result = JSON.stringify(db_result.rows)
  res.send(result);
});

router.get('/sport', async function (req, res, next) {
  let db_result = await database.simpleExecute(`
    SELECT
      event.sport, game.season AS sport_season, event.name AS event
    FROM
      event, event_belongs_to, game
    WHERE
      event.name = event_belongs_to.name
      AND event_belongs_to.game_id = game.id
      AND event.sport = '${req.query.name}'
    GROUP BY event.sport, game.season, event.name
    ORDER BY event.sport
  `);
  let result = JSON.stringify(db_result.rows)
  res.send(result);
});

router.get('/event', async function (req, res, next) {
  console.log("param", req.query.name);
  let db_result = await database.simpleExecute(`
    SELECT ev1 AS Event, golden, silver, bronze, y1 AS Year
    FROM (
      SELECT *
      FROM (
        SELECT
          competes_in.event_name AS ev1,
          game.year AS y1,
          competes_in.medal AS m1,
          athlete.name AS golden
        FROM athlete, participant, competes_in, game
        WHERE
          athlete.id = participant.athlete_id
          AND participant.id = competes_in.participant_id
          AND competes_in.game_id = game.id
          AND competes_in.medal = 'G'
        GROUP BY
          competes_in.event_name,
          game.year,
          competes_in.medal,
          athlete.name
        ),
        (
          SELECT
            competes_in.event_name AS ev2,
            game.year AS y2,
            competes_in.medal AS m2,
            athlete.name AS silver
          FROM
            athlete, participant, competes_in, game
          WHERE
            athlete.id = participant.athlete_id
            AND participant.id = competes_in.participant_id
            AND competes_in.game_id = game.id
            AND competes_in.medal = 'S'
          GROUP BY
            competes_in.event_name,
            game.year,
            competes_in.medal,
            athlete.name
        ),
        (
          SELECT
            competes_in.event_name AS ev3,
            game.year AS y3,
            competes_in.medal AS m3,
            athlete.name AS bronze
          FROM
            athlete, participant, competes_in, game
          WHERE
            athlete.id = participant.athlete_id
            AND participant.id = competes_in.participant_id
            AND competes_in.game_id = game.id
            AND competes_in.medal = 'B'
          GROUP BY
            competes_in.event_name,
            game.year,
            competes_in.medal,
            athlete.name
        )
        WHERE
          ev1 = ev2 AND ev2 = ev3 AND y1 = y2 AND y2 = y3
        ORDER BY ev1, y1
      )
    WHERE ev1 = :name
  `, { name: req.query.name });
  let result = JSON.stringify(db_result.rows)
  res.send(result);
});


router.get('/individualtally', async function (req, res, next) {
  let db_result = await database.simpleExecute(`
    SELECT
    r1 AS country,
    n1 AS athlete_name,
    COALESCE(g, 0) AS gold,
    COALESCE(s, 0) AS silver,
    COALESCE(b, 0) AS bronze
    FROM (
    SELECT *
    FROM (
      SELECT
        noc.region AS r1,
        athlete.name AS n1,
        count(competes_in.medal) AS g
      FROM
        athlete, participant, competes_in, belongs_to, noc
      WHERE
        athlete.id = participant.athlete_id
        AND participant.id = competes_in.participant_id
        AND belongs_to.participant_id = competes_in.participant_id
        AND belongs_to.noc_id = noc.id
        AND competes_in.medal = 'G'
      GROUP BY
        noc.id, noc.region, athlete.name
      ORDER BY count(competes_in.medal) DESC
    ) 
    FULL OUTER JOIN (
      SELECT
        noc.region AS r2,
        athlete.name AS n2,
        count(competes_in.medal) AS s
      FROM
        athlete, participant, competes_in, belongs_to, noc
      WHERE
        athlete.id = participant.athlete_id
        AND participant.id = competes_in.participant_id
        AND belongs_to.participant_id = competes_in.participant_id
        AND belongs_to.noc_id = noc.id
        AND competes_in.medal = 'S'
      GROUP BY noc.id, noc.region, athlete.name
      ORDER BY count(competes_in.medal) DESC
    ) ON r1 = r2 AND n1 = n2
    )
    FULL OUTER JOIN (
    SELECT
      noc.region AS r3,
      athlete.name AS n3,
      count(competes_in.medal) AS b
    FROM
      athlete, participant, competes_in, belongs_to, noc
    WHERE
      athlete.id = participant.athlete_id
      AND participant.id = competes_in.participant_id
      AND belongs_to.participant_id = competes_in.participant_id
      AND belongs_to.noc_id = noc.id
      AND competes_in.medal = 'B'
    GROUP BY noc.id, noc.region, athlete.name
    ORDER BY count(competes_in.medal) DESC
    ) ON r2 = r3 AND n2 = n3
    ORDER BY - g, - s, - b
    FETCH NEXT 100 ROWS ONLY
  `);
  let result = JSON.stringify(db_result.rows)
  res.send(result);
});

module.exports = router;
