import { Fase3Scene } from './fase_3.js';
import { HudScene } from './hud.js';
import { LabScene } from './lab.js';
import { StreetScene } from './street.js';

const config = {
    type: Phaser.AUTO,
    width: 1500,
    height: 700,
    scene: [HudScene, LabScene, StreetScene, Fase3Scene],
    physics: { default: 'arcade',
        arcade: {
            debug: false
        }
     }
};

const game = new Phaser.Game(config);

game.scene.start('LabScene');
//game.scene.start('StreetScene');
//game.scene.start('Fase3Scene');