import { G } from './globals.js';
import { checkDoorInput } from './interactions.js';
import { update } from './update.js';
import { preload } from './preload.js';

export class LabScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LabScene' });
    }
    preload() {
        preload.call(this);
    }
    create() {
        // Cria uma textura de 1x1 pixel chamada 'invisible'
        const graphics = this.add.graphics();
        graphics.fillStyle(0xffffff, 0); // cor branca, alpha 0 (totalmente invisível)
        graphics.fillRect(0, 0, 1, 1);
        graphics.generateTexture('invisible', 1, 1);
        graphics.destroy();
        
        // Fundo e elementos da fase
        this.add.image(0, 0, 'bg_madeira')
            .setOrigin(0, 0)
            .setDisplaySize(G.gameWidth - 520, G.gameHeight)
            .setScrollFactor(0);

        G.player = this.physics.add.sprite(430, 260, 'player', 1); //430 260
        G.player.setCollideWorldBounds(true);
        G.player.setScale(0.7);
        G.player.setSize(110, 135);
        G.player.setOffset(30, 28);
        G.player.setOrigin(0.5, 0.5);
        
        this.anims.create({
            key: 'up',
            frames: this.anims.generateFrameNumbers('player', { start: 7, end: 8 }),
            frameRate: 4,
            repeat: -1
        });
        this.anims.create({
            key: 'down',
            frames: this.anims.generateFrameNumbers('player', { start: 3, end: 5 }),
            frameRate: 5,
            repeat: -1
        });
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 2 }),
            frameRate: 5,
            repeat: -1
        });
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('player', { start: 3, end: 5 }),
            frameRate: 5,
            repeat: -1
        });

        G.npc = this.physics.add.staticImage(540, 245, 'npc', 1);
        G.npc.setDisplaySize(150, 150);
        G.npc.setSize(100, 150);
        G.npc.setOffset(200, 180);

        // Adiciona uma porta invisível na saída do laboratório
        G.door = this.physics.add.sprite(500, 650, 'invisible'); // Ajuste a posição conforme sua porta
        G.door.setDisplaySize(200, 50); // Aumentado significativamente de largura
        G.door.setImmovable(true);
        G.door.setAlpha(0); // Totalmente invisível

        G.cursors = this.input.keyboard.createCursorKeys();
        G.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

        this.physics.add.overlap(G.player, G.door, () => {
            // Interrompe IMEDIATAMENTE qualquer movimento
            G.isMoving = false;
            G.player.setVelocity(0, 0);
            G.player.anims.stop();
            
            // Cancela qualquer tween de movimento em andamento
            this.tweens.killTweensOf(G.player);
            
            // Adicione uma flag para evitar múltiplas transições
            if (!G.isTransitioning) {
                G.isTransitioning = true;
                
                console.log("Saindo do laboratório para a rua");
                
                // IMPORTANTE: Desabilita o resetPlayer no update.js
                G.podeResetar = false;
                
                // Faz o fade out e muda para a próxima fase
                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    // Inicie a próxima fase
                    this.scene.start('StreetScene');
                });
            }
        }, null, this);

        // Textos de interação
        G.dialogText = this.add.text(0, 0, '', {
            fontSize: '20px',
            fill: '#fff',
            backgroundColor: 'black',
            padding: 10,
            wordWrap: { width: 500 }
        });
        G.dialogText.setVisible(false);

        G.npcInteractionText = this.add.text(0, 0, '', {
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: 8,
            borderRadius: 5
        });
        G.npcInteractionText.setVisible(false);

        G.doorInteractionText = this.add.text(0, 0, '', {
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: 8,
            borderRadius: 5
        });
        G.doorInteractionText.setVisible(false);

        // HUD
        this.scene.bringToTop('HudScene');

        this.events.on('resetLab', () => {
            // Limpe a sequência de ações
            G.actionSequence = [];
            G.currentActionIndex = 0;
            G.isMoving = false;
            G.podeResetar = false;
            G.isProgramming = true; // <-- Permite programar novamente!
            
            // Reseta também o sistema de diálogo
            G.dialogIndex = 0;
            G.dialogSequence = [];
            if (G.dialogContainer) G.dialogContainer.setVisible(false);
            G.dialogActive = false;
            G.inDialog = false;
            
            // IMPORTANTE: Cancela TODOS os tweens antes de resetar
            this.tweens.killAll(); // Mata TODOS os tweens, não apenas do jogador
            
            // Para explicitamente qualquer animação
            G.player.anims.stop();
            G.player.anims.pause(); 
            G.player.setFrame(4); // Frame parado olhando para baixo
            G.player.setVelocity(0, 0);
            
            // NÃO reposicione o jogador se estiver saindo de um diálogo
            if (!G.wasInDialog) {
                // Só reposiciona se NÃO estiver saindo de um diálogo
                G.player.setPosition(430, 260);
            }
            
            // Adiciona uma verificação adicional após um pequeno atraso
            this.time.delayedCall(50, () => {
                G.player.anims.stop();
                G.player.setFrame(4);
            });
            
            // Reseta a flag para a próxima vez
            G.wasInDialog = false;
        });
        
        // Função para criar barreiras com colisão confiável (manter a mesma implementação)
        function createBarrier(scene, x, y, width, height, debugColor = 0xff0000, debugAlpha = 0.5) {
            // Cria uma zona de colisão
            const barrier = scene.add.zone(x, y, width, height);
            scene.physics.world.enable(barrier, Phaser.Physics.Arcade.STATIC_BODY);
            barrier.body.setSize(width, height);
            
            // Torna o corpo imóvel
            barrier.body.immovable = true;
            
            // Adiciona colisão com o jogador - COM CALLBACK EXPLÍCITO
            const collider = scene.physics.add.collider(G.player, barrier, () => {
                // Este callback é chamado quando há colisão
                console.log("Colisão detectada com barreira!");
                
                // Interrompe qualquer tween em andamento
                scene.tweens.killTweensOf(G.player);
                
                // Força o jogador a parar
                G.isMoving = false;
                G.player.setVelocity(0, 0);
            });
            
            return barrier;
        }

        // Adicione as paredes para a fase Lab
        // Estes valores são aproximados e devem ser ajustados conforme seu layout
        createBarrier(this, G.gameWidth/2, 100, G.gameWidth, 20, 0xff0000); // Parede superior
        createBarrier(this, G.gameWidth/2, G.gameHeight - 30, G.gameWidth, 20, 0xff0000); // Parede inferior
        createBarrier(this, 150, G.gameHeight/2, 20, G.gameHeight, 0xff0000); // Parede esquerda
        createBarrier(this, 840, G.gameHeight/2, 20, G.gameHeight, 0xff0000); // Parede esquerda

        // Sistema de diálogo avançado com botões
        G.dialogIndex = 0; // Índice atual da sequência de diálogos
        G.dialogSequence = []; // Array que armazenará a sequência de diálogos
        G.dialogActive = false; // Flag para controlar se o diálogo está ativo

        // Cria um container para agrupar todos os elementos do diálogo
        G.dialogContainer = this.add.container(0, 0);
        G.dialogContainer.setVisible(false);

        // Fundo do diálogo um pouco mais largo para acomodar o botão OK
        G.dialogBg = this.add.graphics();
        G.dialogBg.fillStyle(0x000000, 0.8);
        G.dialogBg.fillRoundedRect(0, 0, 420, 160, 16); // Largura aumentada para 420, altura para 160
        G.dialogBg.lineStyle(2, 0x4a6cd3, 1);
        G.dialogBg.strokeRoundedRect(0, 0, 420, 160, 16);
        G.dialogContainer.add(G.dialogBg);

        // Texto com espaçamento maior entre linhas
        G.dialogText = this.add.text(20, 15, '', {
            fontSize: '20px',
            fill: '#fff',
            wordWrap: { width: 340 }, // Largura do texto ajustada
            lineSpacing: 8 // Adiciona espaçamento entre as linhas
        });
        G.dialogContainer.add(G.dialogText);

        // Botão OK - Reposicionado para caber dentro da caixa
        G.dialogOkButton = this.add.text(330, 110, 'OK', { // Posição X reduzida para 330
            fontSize: '20px',
            fill: '#ffffff',
            backgroundColor: '#4a6cd3',
            padding: {
                left: 15,
                right: 15,
                top: 8,
                bottom: 8
            },
            borderRadius: 5
        }).setInteractive({ useHandCursor: true });

        // Adiciona efeito de hover
        G.dialogOkButton.on('pointerover', () => {
            G.dialogOkButton.setStyle({ fill: '#ffff00', backgroundColor: '#5e84f5' });
        });
        G.dialogOkButton.on('pointerout', () => {
            G.dialogOkButton.setStyle({ fill: '#ffffff', backgroundColor: '#4a6cd3' });
        });

        // Adiciona evento de clique no botão OK
        G.dialogOkButton.on('pointerdown', () => {
            console.log("Botão OK clicado");
            this.showNextDialog();
        });

        // Adiciona o botão ao container
        G.dialogContainer.add(G.dialogOkButton);

        // Função para mostrar o próximo diálogo na sequência
        function showNextDialog() {
            console.log("showNextDialog chamado", G.dialogIndex, G.dialogSequence.length);
            
            // Verifica se ainda existem diálogos na sequência
            if (G.dialogIndex >= G.dialogSequence.length) {
                // Não há mais diálogos, fecha o container
                G.dialogContainer.setVisible(false);
                G.dialogActive = false;
                G.inDialog = false;
                G.dialogIndex = 0; // Reseta o índice para futuras conversas
                
                // Permite o jogador programar novamente após o diálogo
                G.isProgramming = true;
                
                console.log("Diálogo finalizado");
                return;
            }
            
            // Pega o próximo diálogo da sequência
            const currentDialog = G.dialogSequence[G.dialogIndex];
            console.log("Mostrando diálogo:", currentDialog);
            
            // Define o texto no diálogo
            G.dialogText.setText(currentDialog);
            
            // Calcula a altura do texto atual
            const textHeight = G.dialogText.height;
            
            // Ajusta a posição do botão OK para ficar na linha do final do texto
            // Garante que o botão fique dentro da caixa de diálogo
            const buttonY = Math.max(textHeight + 15, 110);
            G.dialogOkButton.setPosition(350, buttonY); // Posição X definida como 330
            
            // Torna o container visível
            G.dialogContainer.setVisible(true);
            G.dialogActive = true;
            G.inDialog = true;
            
            // Avança para o próximo diálogo
            G.dialogIndex++;
        }

        // Importante: mantenha esta referência de função disponível para toda a cena
        this.showNextDialog = showNextDialog;
    }
    update() {
        // Chamada ao update.js para controlar movimentos programados
        update.call(this);
        
        // ADICIONE ESTE BLOCO: Verificação explícita para reset com a tecla R
        if (G.podeResetar && Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey('R'))) {
            console.log("Tecla R pressionada, resetando jogador na LabScene");
            
            // IMPORTANTE: Cancela TODOS os tweens antes de resetar
            this.tweens.killAll();
            
            // Limpa a sequência de ações
            G.actionSequence = [];
            G.currentActionIndex = 0;
            G.isMoving = false;
            G.podeResetar = false;
            G.isProgramming = true;
            
            // Força o jogador a voltar para a posição inicial
            G.player.setPosition(430, 260);
            
            // MODIFICADO: Garante que a animação seja completamente interrompida
            G.player.anims.stop();
            G.player.anims.pause();
            G.player.setFrame(4);
            G.player.setVelocity(0, 0);
    
            // Adiciona uma verificação adicional após um pequeno atraso
            this.time.delayedCall(50, () => {
                G.player.anims.stop();
                G.player.setFrame(4);
            });
            
            // Atualiza a HUD
            if (G.hudActionsText) {
                G.hudActionsText.setText('');
            }
            
            if (G.resetText) {
                G.resetText.setVisible(false);
            }
            
            console.log("Reset completo na LabScene");
        }
        
        // VERIFICAÇÃO DE PROXIMIDADE COM O NPC - VERSÃO CORRIGIDA
        if (G.npc && !G.inDialog) {
            // Calcula a distância entre o jogador e o NPC
            const dist = Phaser.Math.Distance.Between(
                G.player.x, G.player.y,
                G.npc.x, G.npc.y
            );
            
            // Se estiver próximo o suficiente
            if (dist < 150) {
                // Mostra o texto de interação
                G.npcInteractionText.setText("Pressione E para conversar");
                G.npcInteractionText.setPosition(G.npc.x - 130, G.npc.y - 100);
                G.npcInteractionText.setVisible(true);
                
                // Se pressionar E, inicia o diálogo
                if (Phaser.Input.Keyboard.JustDown(G.keyE) && !G.dialogActive) {
                    console.log("Tecla E pressionada para iniciar diálogo");
                    
                    // Esconde o texto de interação
                    G.npcInteractionText.setVisible(false);
                    
                    // Define os diálogos
                    G.dialogSequence = [
                        "Olá, bem-vindo ao Laboratório LEVELCODER!\nEu sou o Professor Thomaz.",
                        "Você é um robozinho que eu criei para criar uma I.A de programação!",
                        "Primeiro você aprenderá a utilizar seus movimentos usando um sistema simples.",
                        "Use as setas para adicionar comandos de movimento, eles aparecerão na sua aba de 'Movimentação', na sua HUD.",
                        "Você pode acionar até 5 comandos por vez, e se bater em uma parede terá que reiniciar seu caminho.",
                        "Vamos lá então, seu objetivo é sair dessa sala, a porta esta logo ali abaixo de nós.",
                        "Se você cometer um erro, pressione R para resetar e tentar novamente.",
                        "Meu assistente estará te esperando na próxima sala, ele vai te ajudar a guardar informações importantes!",
                        "Sinta-se livre para andar aqui por volta para conhecer seus movimentos melhor antes de avançar."
                    ];
                    
                    // Reseta o índice de diálogos
                    G.dialogIndex = 0;
                    
                    // Posiciona o container de diálogo abaixo do NPC
                    G.dialogContainer.setPosition(G.npc.x - 200, G.npc.y + 100); // +100 para aparecer abaixo
                    
                    // Mostra o primeiro diálogo
                    this.showNextDialog();                }
            } else {
                // Se estiver longe, esconde o texto de interação
                if (G.npcInteractionText.visible) {
                    G.npcInteractionText.setVisible(false);
                }
            }
        }
        
        // VERIFICAÇÃO PARA MOSTRAR O TEXTO DA PORTA
        if (G.door && !G.inDialog) {
            const distToDoor = Phaser.Math.Distance.Between(
                G.player.x, G.player.y, 
                G.door.x, G.door.y
            );
            
            if (distToDoor < 150) {
                if (!G.doorInteractionText.visible) {
                    G.doorInteractionText.setText("Porta para a rua");
                    G.doorInteractionText.setPosition(
                        G.door.x, 
                        G.door.y - 50
                    );
                    G.doorInteractionText.setVisible(true);
                }
            } else {
                if (G.doorInteractionText.visible) {
                    G.doorInteractionText.setVisible(false);
                }
            }
        }
    }
}