export function preload() {    
    this.load.image('bg_madeira', 'assets/PNG/Tiles/bg_madeira.png');
    this.load.spritesheet('player', 'assets/Tilesheet/player_moves_sprite.png', {
        frameWidth: 166,
        frameHeight: 166
    });

    this.load.image('npc', 'assets/PNG/Characters/prof_npc.png', {
        frameWidth: 32,
        frameHeight: 48
    });

    this.load.image('assistente_npc', 'assets/PNG/Characters/assistente_npc.png',{
        frameWidth: 32,
        frameHeight: 48
    });

    this.load.image('ram', 'assets/PNG/Items/ram.png');

    this.load.image('seta_set', 'assets/PNG/Items/setas_set.png');
    this.load.image('seta_cima', 'assets/PNG/Items/setas_cima.png');
    this.load.image('seta_baixo', 'assets/PNG/Items/setas_baixo.png');
    this.load.image('seta_esquerda', 'assets/PNG/Items/setas_esq.png');
    this.load.image('seta_direita', 'assets/PNG/Items/setas_dir.png');
}