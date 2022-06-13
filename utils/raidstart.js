const { BattleStreams, Teams } = require('@pkmn/sim');
const fs = require('fs');

let startraid = () => new Promise((resolve, reject) => {
    var _battleStream = new BattleStreams.BattleStream();
    const streams = BattleStreams.getPlayerStreams(_battleStream);
    const spec = { formatid: 'customgame' };

    const p1spec = { name: '$Player1', team: "Venusaur|||-|Tackle,Tackle,Tackle,Tackle|Careful|||22,20,30,27,18,2||35|]Solgaleo|||-|Tackle,Tackle,Tackle,Tackle|Mild|||5,1,4,14,4,5||55|]Flapple|||-|Tackle,Tackle,Tackle,Tackle|Modest|||30,17,11,,10,21||35|" };
    const p2spec = { name: '$Player2', team: "Alolan Sandslash|||-|Slash,MetalClaw,IceBall,IcicleSpear,MetalBurst,IcicleCrash,Scratch,Counter,Bide,IceShard,Blizzard,Swift,FurySwipes,PowderSnow,Rollout,FuryCutter,RapidSpin,GyroBall,IronHead,PoisonSting,SandTomb,CrushClaw,Earthquake,Dig,Magnitude,Bulldoze,HyperBeam,LeechLife,RockSlide,Thief,Facade,BrickBreak,Fling,PoisonJab,XScissor,FocusBlast,GigaImpact,ShadowClaw,Round,IcePunch,IceBeam,IronTail,DrillRun,BodySlam,PinMissile,Snore,IcyWind,RockTomb,Avalanche,ThroatChop||||24,16,12,4,17,18||250|" };


    void (async () => {
        for await (const chunk of streams.omniscient) {
            resolve(chunk);
        }
    })();


    void streams.omniscient.write(`>start ${JSON.stringify(spec)}
    >player p1 ${JSON.stringify(p1spec)}
    >player p2 ${JSON.stringify(p2spec)}
    >p1 team 1
    >p2 team 1`);

    setTimeout(resolve, 5000);
});

module.exports = { startraid };