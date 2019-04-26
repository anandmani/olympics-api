
SELECT distinct event.sport/*, SUBSTR(ev1, INSTR(ev1, ' '), LENGTH(ev1)) as event*/, gs as sport_season
from event
,

(select event.name as ev1, game.season as gs
from event, event_belongs_to, game
where event.name=event_belongs_to.name AND event_belongs_to.game_id=game.id
group by event.name,game.season)
where ev1=event.name
order by gs, event.sport;
