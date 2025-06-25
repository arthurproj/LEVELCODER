// Simplificar o sistema de diálogo para evitar que o jogador fique preso

import { G } from './globals.js';
import { update } from './update.js';
import { preload } from './preload.js';

export class Fase3Scene extends Phaser.Scene {
    constructor() {
        super({ key: 'Fase3Scene' });
    }

    preload() {
        // Carrega assets específicos para esta fase
        this.load.image('bg_fase3', 'assets/PNG/Tiles/bg_fase3.png');
        
        preload.call(this);
    }

    create() {
        // Restaura o estado salvo, se existir
        if (window.GAME_STATE) {
            G.passwordFound = window.GAME_STATE.passwordFound;
            G.hasMemoryUpgrade = window.GAME_STATE.hasMemoryUpgrade;
            
            console.log("Fase 3 - Restaurando estado do jogo:");
            console.log("- Senha encontrada:", G.passwordFound);
            console.log("- Upgrade de memória:", G.hasMemoryUpgrade);
        }
        
        console.log("Fase 3 iniciada, senha encontrada:", G.passwordFound);
        
        // Reset a flag de transição
        G.isTransitioning = false;
        
        // Configura o background
        this.add.image(480, 350, 'bg_fase3')
        .setDisplaySize(G.gameWidth - 500, G.gameHeight)
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0);
        
        // IMPORTANTE: NÃO redefina G.passwordFound ou G.hasMemoryUpgrade aqui
        // Apenas limpe os comandos de movimento
        G.actionSequence = [];
        G.isProgramming = true;
        G.currentActionIndex = 0;
        G.actionTimer = 0;
        G.isMoving = false;
        
        // Cria um novo jogador
        if (G.player) {
            G.player.destroy();
        }
        
        G.player = this.physics.add.sprite(430, 360, 'player', 1);
        G.player.setCollideWorldBounds(true);
        G.player.setSize(110, 135);
        G.player.setOffset(30, 28);
        G.player.setScale(0.7);
        G.player.setOrigin(0.5, 0.5);
        
        // Recrie as animações se necessário
        if (!this.anims.exists('up')) {
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
        }
        
        G.startPosition = { x: 430, y: 360 };
        
        // Input
        G.cursors = this.input.keyboard.createCursorKeys();
        G.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        
        // Inicia a HUD se ainda não estiver ativa
        if (!this.scene.isActive('HudScene')) {
            this.scene.launch('HudScene');
        }
        
        // IMPORTANTE: Aguarde um momento para atualizar a HUD com os valores corretos
        this.time.delayedCall(100, () => {
            // Atualiza explicitamente a memória na HUD para mostrar a senha e a RAM
            if (this.scene.get('HudScene')) {
                this.scene.get('HudScene').events.emit('updateHUD');
                
                // Força a atualização da RAM/memória
                if (G.hasMemoryUpgrade) {
                    this.scene.get('HudScene').events.emit('showMemoryIcon');
                    
                    // Atualiza o texto da memória com a senha correta
                    if (G.passwordFound) {
                        if (G.memoryText) {
                            G.memoryText.setText("Sua Memória:\nconst senha = 1234;");
                        }
                    }
                }
            }
        });
        
        // Força a atualização da memória
        this.time.delayedCall(800, () => {
            if (this.scene.get('HudScene')) {
                this.scene.get('HudScene').forceMemoryUpdate();
                console.log("Solicitada atualização forçada da memória");
            }
        });
        
        // Cria barreira invisível para impedir o jogador de ir para a área da HUD
        const barrier = this.physics.add.staticImage(G.gameWidth - 500, G.gameHeight / 2, 'invisible');
        barrier.setDisplaySize(10, G.gameHeight);
        barrier.setVisible(false);
        
        // Adiciona colisão entre o jogador e a barreira
        this.physics.add.collider(G.player, barrier);
        
        // Cria o texto de diálogo
        G.dialogText = this.add.text(0, 0, '', {
            fontSize: '20px',
            fill: '#fff',
            backgroundColor: 'black',
            padding: 10,
            wordWrap: { width: 500 }
        });
        G.dialogText.setVisible(false);
        
        // Adiciona o NPC na Fase 3
        G.fase3Npc = this.physics.add.staticImage(540, 360, 'npc');
        G.fase3Npc.setDisplaySize(150, 150);
        G.fase3Npc.setSize(100, 150);
        G.fase3Npc.setOffset(200, 180);
        
        // Texto de interação do NPC da Fase 3
        G.fase3NpcInteractionText = this.add.text(0, 0, 'Pressione E para falar', {
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: 8,
            borderRadius: 5
        });
        G.fase3NpcInteractionText.setVisible(false);
        
        // Cria uma textura invisível para os pontos de interação se não existir
        if (!this.textures.exists('invisible')) {
            const graphics = this.add.graphics();
            graphics.fillStyle(0xffffff, 0);
            graphics.fillRect(0, 0, 1, 1);
            graphics.generateTexture('invisible', 1, 1);
            graphics.destroy();
        }
        
        // Adiciona pontos de interação invisíveis para os computadores
        G.computerPoints = [];
        
        // Posições dos 3 computadores (invisíveis) - AJUSTADAS PARA OS LOCAIS ORIGINAIS
        const computerPositions = [
            { x: 240, y: 600, senha: "const senha = 1234" },
            { x: 480, y: 600, senha: "const senha = 'Olá mundo!'", correta: true },
            { x: 720, y: 600, senha: "const senha = true" }
        ];
        
        // Cria os pontos de interação invisíveis
        computerPositions.forEach((pos, index) => {
            // Cria um sprite invisível maior e com colisão
            const computer = this.physics.add.staticSprite(pos.x, pos.y, 'invisible');
            computer.setDisplaySize(0, 0); // AUMENTADO SIGNIFICATIVAMENTE
            computer.setSize(180, 180);        // Tamanho de colisão maior
            computer.setAlpha(0.3);            // Ligeiramente visível para debug
            computer.senhaInfo = pos.senha; 
            computer.senhaCorreta = pos.correta || false;
            
            G.computerPoints.push(computer);
            
            // Adiciona overlap para cada computador - com função melhorada
            this.physics.add.overlap(G.player, computer, () => {
                console.log("Colisão com computador detectada, index:", index);
                
                // Só mostra o diálogo se não estiver já em diálogo
                if (!G.inDialog && !G.dialogActive && G.dialogCooldown === 0) {
                    console.log("Iniciando diálogo com computador", index);
                    
                    // Para IMEDIATAMENTE qualquer movimento do jogador
                    G.isMoving = false;
                    G.player.setVelocity(0, 0);
                    G.player.anims.stop();
                    
                    // IMPORTANTE: Interrompe qualquer tween em andamento
                    this.tweens.killTweensOf(G.player);
                    
                    // Marca que está em diálogo
                    G.inDialog = true;
                    G.dialogActive = true;
                    
                    let mensagem = "";
                    
                    // Mensagens específicas para cada computador
                    if (index === 0) { // PC 1
                        showComputerDialog([
                            "Incorreto. Esta variável tem um problema:",
                            "let falar = Olá Mundo",
                            "Uma string (texto) precisa estar entre aspas (\"\") para que o JavaScript reconheça como texto.",
                            "Sem as aspas, o JavaScript vai tentar interpretar Olá Mundo como uma variável não definida."
                        ]);
                    } else if (index === 1) { // PC 2
                        showComputerDialog([
                            "Correto! Este é o formato adequado.",
                            "let falar = \"Olá mundo!\"",
                            "As aspas indicam que o conteúdo é um texto (string).",
                            "A palavra-chave let indica que é uma variável que pode ter seu valor alterado depois.",
                        ]);
                        
                        // Agora não substituímos a senha antiga, mas adicionamos uma nova variável
                        G.senhaCorretaEscolhida = true;
                        G.senhaAtual = 'Olá mundo!';
                        G.comandoFalar = true; // Nova flag para indicar que o comando de fala foi encontrado
                        
                        // Atualiza o texto da memória para mostrar AMBAS as senhas
                        if (G.hasMemoryUpgrade && G.memoryText) {
                            // Verifica se já tem a senha anterior da Fase 2
                            if (G.passwordFound) {
                                // Mostra ambas as senhas/variáveis na memória
                                G.memoryText.setText("Sua Memória:\nconst senha = 1234;\nlet falar = 'Olá mundo!';");
                            } else {
                                // Caso não tenha a senha anterior (improvável, mas por segurança)
                                G.memoryText.setText("Sua Memória:\nlet falar = 'Olá mundo!';");
                            }
                        }
                    } else if (index === 2) { // PC 3
                        showComputerDialog([
                            "Incorreto. Esta variável tem um problema:",
                            "let falar = true",
                            "O valor true não é um texto, mas sim um booleano (tipo de dado que só pode ser true ou false).",
                            "Nesse contexto, se você quisse armazenar a palavara true como uma string, use aspas: let falar = \"true\""
                        ]);
                    }
                    
                    // Afasta o jogador do computador para evitar interação repetida
                    const angle = Phaser.Math.Angle.Between(computer.x, computer.y, G.player.x, G.player.y);
                    G.player.x += Math.cos(angle) * 80;
                    G.player.y += Math.sin(angle) * 80;
                    
                    // Define um cooldown longo
                    G.dialogCooldown = 120;
                    
                    // Reinicia o jogador para modo de programação
                    G.actionSequence = [];
                    G.currentActionIndex = 0;
                    G.isProgramming = true;
                    
                    // Atualiza o texto da HUD
                    if (G.hudActionsText) {
                        G.hudActionsText.setText('');
                    }
                }
            }, null, this);
        });
        
        // Máquina final com maior área de colisão e sistema similar aos computadores
        G.maquinaFinal = this.physics.add.staticSprite(90, 320, 'invisible');
        G.maquinaFinal.setDisplaySize(0,0); // Aumentado como os computadores
        G.maquinaFinal.setSize(180, 180);        // Tamanho de colisão maior
        G.maquinaFinal.setAlpha(0.3);            // Ligeiramente visível para debug
        
        // Adiciona overlap para a máquina final - usando o mesmo sistema dos computadores
        this.physics.add.overlap(G.player, G.maquinaFinal, () => {
            console.log("Colisão com máquina final detectada");
            
            // Só processa se não estiver já em diálogo e o cooldown terminou
            if (!G.inDialog && !G.dialogActive && G.dialogCooldown === 0) {
                console.log("Iniciando interação com máquina final");
                
                // IMPORTANTE: Para IMEDIATAMENTE qualquer movimento do jogador
                G.isMoving = false;
                G.player.setVelocity(0, 0);
                G.player.anims.stop();
                G.player.setFrame(4); // Frame parado olhando para baixo
                
                // Cancela TODOS os tweens em andamento
                this.tweens.killAll();
                
                // Limpa a sequência de ações
                G.actionSequence = [];
                G.currentActionIndex = 0;
                
                // Verificação das condições para usar o alert
                if (G.hasHDD && G.senhaCorretaEscolhida && G.senhaAtual === 'Olá mundo!') {
                    // Abre o diálogo com texto de sucesso e botão para executar alert
                    this.showMaquinaDialog("Use a função alert() para exibir 'Olá mundo!' em uma janela pop-up.\n\nDigite: alert(falar)");
                    
                    // IMPORTANTE: Esconde o botão OK do diálogo
                    G.maquinaDialogOkButton.setVisible(false);
                    
                    // Adiciona o botão para executar o alert
                    if (!G.executeButton) {
                        // Crie o botão de executar fora do container de diálogo
                        G.executeButton = this.add.text(500, 450, 'Executar alert(falar)', {
                            fontSize: '22px',
                            fill: '#ffffff',
                            backgroundColor: '#2ecc71', // Verde
                            padding: {
                                left: 15,
                                right: 15,
                                top: 10,
                                bottom: 10
                            },
                            borderRadius: 8
                        }).setInteractive({ useHandCursor: true });
                        
                        // Centralize o texto
                        G.executeButton.setOrigin(0.5);
                        
                        // Evento de clique para o botão
                        G.executeButton.on('pointerdown', () => {
                            // Fecha o diálogo da máquina
                            G.maquinaDialogContainer.setVisible(false);
                            G.executeButton.setVisible(false);
                            
                            // Executa o alert (mostra a simulação de alert)
                            G.alertText.setText('"Olá mundo!"');
                            G.alertBox.setVisible(true);
                            
                            // Marca o diálogo como ativo para evitar outras interações
                            G.dialogActive = true;
                            G.inDialog = true;
                        });
                        
                        // Eventos de hover
                        G.executeButton.on('pointerover', () => {
                            G.executeButton.setStyle({
                                fontSize: '22px',
                                fill: '#ffffff',
                                backgroundColor: '#27ae60', // Verde mais escuro
                                padding: {
                                    left: 15,
                                    right: 15,
                                    top: 10,
                                    bottom: 10
                                },
                                borderRadius: 8
                            });
                        });
                        
                        G.executeButton.on('pointerout', () => {
                            G.executeButton.setStyle({
                                fontSize: '22px',
                                fill: '#ffffff',
                                backgroundColor: '#2ecc71', // Verde original
                                padding: {
                                    left: 15,
                                    right: 15,
                                    top: 10,
                                    bottom: 10
                                },
                                borderRadius: 8
                            });
                        });
                    } else {
                        // Se o botão já existe, apenas ajusta sua posição e torna visível
                        G.executeButton.setVisible(true);
                        G.executeButton.setPosition(400, 450); // Posicionado abaixo do diálogo
                    }
                } else if (!G.hasHDD) {
                    // NOVO: Diálogo específico para quando não tem o HDD
                    this.showMaquinaDialog("Você precisa de um HDD para usar funções como alert().\n\nFale com o professor para receber um HDD e aprender sobre funções JavaScript.");
                    
                    // Esconde o botão de executar se existir
                    if (G.executeButton) {
                        G.executeButton.setVisible(false);
                    }
                    
                    // Garante que o botão OK seja visível
                    G.maquinaDialogOkButton.setVisible(true);
                } else if (!G.senhaCorretaEscolhida) {
                    // Já tem o HDD mas ainda não escolheu a variável correta
                    this.showMaquinaDialog([
                        "Vejo que você já tem o HDD, agora precisa escolher a variável correta.",
                        "Uma string (texto) precisa estar entre aspas para ser reconhecida pelo JavaScript.",
                        "Examine os três computadores ao fundo da sala e escolha o formato correto."
                    ]);
                } else {
                    // Já completou tudo
                    this.showMaquinaDialog([
                        "Parabéns! Você aprendeu conceitos fundamentais de JavaScript:",
                        "1. Como criar uma variável de texto (string) usando let e aspas",
                        "2. Como exibir mensagens em pop-up usando alert()",
                        "Essas são habilidades que você usará constantemente como programador.",
                        "Fique à vontade para explorar mais ou avançar para o próximo desafio!"
                    ]);
                }
                
                // IMPORTANTE: Afasta o jogador da máquina para evitar interação repetida
                const angle = Phaser.Math.Angle.Between(G.maquinaFinal.x, G.maquinaFinal.y, G.player.x, G.player.y);
                G.player.x += Math.cos(angle) * 80;
                G.player.y += Math.sin(angle) * 80;
                
                // Define um cooldown longo para evitar múltiplas interações
                G.dialogCooldown = 120;
                
                // Garante que o jogador está em modo de programação (não de movimento)
                G.isProgramming = true;
                
                // Atualiza o texto da HUD para mostrar lista vazia
                if (G.hudActionsText) {
                    G.hudActionsText.setText('');
                }
            }
        }, null, this);
        
        // Texto de interação para a máquina final
        G.maquinaFinalText = this.add.text(0, 0, 'Pressione E para inserir a senha', {
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: 8
        });
        G.maquinaFinalText.setVisible(false);
        
        // Console log de sucesso (inicialmente invisível)
        G.consoleLogText = this.add.text(400, 350, '', {
            fontSize: '24px',
            fontFamily: 'Courier New',
            fill: '#00ff00', // Texto verde estilo terminal
            backgroundColor: '#000000', // Fundo preto
            padding: {
                left: 20,
                right: 20,
                top: 10,
                bottom: 10
            },
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#119955',
                blur: 2,
                stroke: true,
                fill: true
            }
        });
        G.consoleLogText.setOrigin(0.5);
        G.consoleLogText.setVisible(false);
        
        // Inicializa variáveis para o estado do jogo
        G.senhaCorretaEscolhida = false;
        G.senhaAtual = '';
        G.dialogCooldown = 0;
        
        // Após criar o jogador e outros elementos, atualize a HUD com um atraso
        this.time.delayedCall(500, () => {
            // Força a atualização explícita da HUD
            if (this.scene.get('HudScene')) {
                // Primeiro, notifique sobre o upgrade de memória
                if (G.hasMemoryUpgrade) {
                    this.scene.get('HudScene').events.emit('showMemoryIcon');
                }
                
                // Depois atualize os textos da HUD
                this.scene.get('HudScene').events.emit('updateHUD');
            }
        });
        
        // Cria três textos informativos em diferentes posições da tela
        G.textoInfo1 = this.add.text(240, 530, 'PC 1\nlet falar = Olá Mundo', {
            fontSize: '16px',
            fill: '#ffffff',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: 8,
            align: 'center'
        });
        G.textoInfo1.setOrigin(0.5);

        G.textoInfo2 = this.add.text(490, 530, 'PC 2\nlet falar = "Olá mundo!"', {
            fontSize: '16px',
            fill: '#ffffff',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: 8,
            align: 'center'
        });
        G.textoInfo2.setOrigin(0.5);

        G.textoInfo3 = this.add.text(720, 530, 'PC 3\nlet falar = true', {
            fontSize: '16px',
            fill: '#ffffff',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: 8,
            align: 'center'
        });
        G.textoInfo3.setOrigin(0.5);
        
        // Guarda a referência da cena atual para uso no sistema de colisão
        G.currentScene = this;

        // Função melhorada para criar barreiras com colisão confiável
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

        // Agora crie as paredes e bordas invisíveis para delimitar a área jogável
        // Barreira da HUD (mantenha a que já existe usando sprite)

        // Barreiras para delimitar a área de jogo
        // Bordas superior, inferior, esquerda e direita
        createBarrier(this, G.gameWidth/2 - 250, 250, G.gameWidth - 500, 20, 0xff0000); // Topo
        createBarrier(this, G.gameWidth/2 - 250, G.gameHeight - 110, G.gameWidth - 500, 20, 0xff0000); // Base
        createBarrier(this, 40, G.gameHeight/2, 20, G.gameHeight, 0xff0000); // Esquerda
        createBarrier(this, 900, G.gameHeight/2, 20, G.gameHeight, 0xff0000); // Direita

        // Barreiras para passagens estreitas
        createBarrier(this, 380, 200, 20, 100, 0x00ff00); // Passagem verde
        createBarrier(this, 565, 200, 20, 100, 0x00ff00); // Passagem verde

        // Sistema de diálogo avançado com botões para o NPC da Fase 3
        // Cria um container para agrupar todos os elementos do diálogo
        G.fase3DialogContainer = this.add.container(0, 0);
        G.fase3DialogContainer.setVisible(false);

        // Fundo do diálogo 
        G.fase3DialogBg = this.add.graphics();
        G.fase3DialogBg.fillStyle(0x000000, 0.8);
        G.fase3DialogBg.fillRoundedRect(0, 0, 420, 160, 16);
        G.fase3DialogBg.lineStyle(2, 0x4a6cd3, 1);
        G.fase3DialogBg.strokeRoundedRect(0, 0, 420, 160, 16);
        G.fase3DialogContainer.add(G.fase3DialogBg);

        // Texto com espaçamento maior entre linhas
        G.fase3DialogText = this.add.text(20, 15, '', {
            fontSize: '20px',
            fill: '#fff',
            wordWrap: { width: 340 },
            lineSpacing: 8
        });
        G.fase3DialogContainer.add(G.fase3DialogText);

        // Botão OK com estilo consistente
        G.fase3DialogOkButton = this.add.text(350, 110, 'OK', {
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

        // Eventos de hover para o botão OK
        G.fase3DialogOkButton.on('pointerover', () => {
            G.fase3DialogOkButton.setStyle({
                fontSize: '20px',
                fill: '#ffffff',
                backgroundColor: '#5e84f5', // Azul um pouco mais claro no hover
                padding: {
                    left: 15,
                    right: 15,
                    top: 8,
                    bottom: 8
                },
                borderRadius: 5
            });
        });

        G.fase3DialogOkButton.on('pointerout', () => {
            G.fase3DialogOkButton.setStyle({
                fontSize: '20px',
                fill: '#ffffff',
                backgroundColor: '#4a6cd3', // Volta ao azul original
                padding: {
                    left: 15,
                    right: 15,
                    top: 8,
                    bottom: 8
                },
                borderRadius: 5
            });
        });

        // Adiciona o botão ao container
        G.fase3DialogContainer.add(G.fase3DialogOkButton);

        // Sistema de diálogo para os computadores
        G.computerDialogContainer = this.add.container(0, 0);
        G.computerDialogContainer.setVisible(false);

        // Fundo do diálogo 
        G.computerDialogBg = this.add.graphics();
        G.computerDialogBg.fillStyle(0x000000, 0.8);
        G.computerDialogBg.fillRoundedRect(0, 0, 420, 160, 16);
        G.computerDialogBg.lineStyle(2, 0x4a6cd3, 1);
        G.computerDialogBg.strokeRoundedRect(0, 0, 420, 160, 16);
        G.computerDialogContainer.add(G.computerDialogBg);

        // Texto com espaçamento maior entre linhas
        G.computerDialogText = this.add.text(20, 15, '', {
            fontSize: '20px',
            fill: '#fff',
            wordWrap: { width: 340 },
            lineSpacing: 8
        });
        G.computerDialogContainer.add(G.computerDialogText);

        // Botão OK com estilo consistente
        G.computerDialogOkButton = this.add.text(350, 110, 'OK', {
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

        // Eventos de hover para o botão OK
        G.computerDialogOkButton.on('pointerover', () => {
            G.computerDialogOkButton.setStyle({
                fontSize: '20px',
                fill: '#ffffff',
                backgroundColor: '#5e84f5', // Azul um pouco mais claro no hover
                padding: {
                    left: 15,
                    right: 15,
                    top: 8,
                    bottom: 8
                },
                borderRadius: 5
            });
        });

        G.computerDialogOkButton.on('pointerout', () => {
            G.computerDialogOkButton.setStyle({
                fontSize: '20px',
                fill: '#ffffff',
                backgroundColor: '#4a6cd3', // Volta ao azul original
                padding: {
                    left: 15,
                    right: 15,
                    top: 8,
                    bottom: 8
                },
                borderRadius: 5
            });
        });

        // Adiciona o botão ao container
        G.computerDialogContainer.add(G.computerDialogOkButton);

        // 2. Adicione as funções para mostrar os diálogos
        // Função para mostrar o diálogo do NPC da fase 3
        function showFase3Dialog(message) {
            // Se receber um array de mensagens, trata como sequência
            if (Array.isArray(message)) {
                G.fase3DialogSequence = message;
                G.fase3DialogIndex = 0;
                
                // Exibe o primeiro diálogo da sequência
                if (G.fase3DialogSequence.length > 0) {
                    showFase3Dialog(G.fase3DialogSequence[G.fase3DialogIndex]);
                }
                return;
            }
            
            // Define o texto no diálogo (mensagem simples)
            G.fase3DialogText.setText(message);
            
            // Calcula a altura do texto
            const textHeight = G.fase3DialogText.height;
            
            // Altura mínima para o diálogo (160px) ou altura do texto + margens
            const dialogHeight = Math.max(160, textHeight + 60);
            
            // Redesenha o fundo com a nova altura
            G.fase3DialogBg.clear();
            G.fase3DialogBg.fillStyle(0x000000, 0.8);
            G.fase3DialogBg.fillRoundedRect(0, 0, 420, dialogHeight, 16);
            G.fase3DialogBg.lineStyle(2, 0x4a6cd3, 1);
            G.fase3DialogBg.strokeRoundedRect(0, 0, 420, dialogHeight, 16);
            
            // Posiciona o botão OK
            const buttonY = Math.max(textHeight + 15, 110);
            G.fase3DialogOkButton.setPosition(350, buttonY);
            
            // CENTRALIZA o container de diálogo na tela
            const centerX = (G.gameWidth - 500) / 2;
            const centerY = G.gameHeight / 2;
            
            // Define a posição do container
            G.fase3DialogContainer.setPosition(centerX - 210, centerY - dialogHeight/2);
            
            // Torna o container visível
            G.fase3DialogContainer.setVisible(true);
            G.dialogActive = true;
            G.inDialog = true;
        }

        // Função para mostrar o diálogo dos computadores
        function showComputerDialog(message) {
            // Se receber um array de mensagens, trata como sequência
            if (Array.isArray(message)) {
                G.computerDialogSequence = message;
                G.computerDialogIndex = 0;
                
                // Exibe o primeiro diálogo da sequência
                if (G.computerDialogSequence.length > 0) {
                    showComputerDialog(G.computerDialogSequence[G.computerDialogIndex]);
                }
                return;
            }
            
            // Define o texto no diálogo (mensagem simples)
            G.computerDialogText.setText(message);
            
            // Calcula a altura do texto
            const textHeight = G.computerDialogText.height;
            
            // Altura mínima para o diálogo (160px) ou altura do texto + margens
            const dialogHeight = Math.max(160, textHeight + 60);
            
            // Redesenha o fundo com a nova altura
            G.computerDialogBg.clear();
            G.computerDialogBg.fillStyle(0x000000, 0.8);
            G.computerDialogBg.fillRoundedRect(0, 0, 420, dialogHeight, 16);
            G.computerDialogBg.lineStyle(2, 0x4a6cd3, 1);
            G.computerDialogBg.strokeRoundedRect(0, 0, 420, dialogHeight, 16);
            
            // Posiciona o botão OK
            const buttonY = Math.max(textHeight + 15, 110);
            G.computerDialogOkButton.setPosition(350, buttonY);
            
            // CENTRALIZA o container de diálogo na tela
            const centerX = (G.gameWidth - 500) / 2;
            const centerY = G.gameHeight / 2;
            
            // Define a posição do container
            G.computerDialogContainer.setPosition(centerX - 210, centerY - dialogHeight/2);
            
            // Torna o container visível
            G.computerDialogContainer.setVisible(true);
            G.dialogActive = true;
            G.inDialog = true;
        }

        // 5. Crie um container de diálogo para a máquina final
        G.maquinaDialogContainer = this.add.container(0, 0);
        G.maquinaDialogContainer.setVisible(false);

        // Fundo do diálogo 
        G.maquinaDialogBg = this.add.graphics();
        G.maquinaDialogBg.fillStyle(0x000000, 0.8);
        G.maquinaDialogBg.fillRoundedRect(0, 0, 420, 160, 16);
        G.maquinaDialogBg.lineStyle(2, 0x4a6cd3, 1);
        G.maquinaDialogBg.strokeRoundedRect(0, 0, 420, 160, 16);
        G.maquinaDialogContainer.add(G.maquinaDialogBg);

        // Texto com espaçamento maior entre linhas
        G.maquinaDialogText = this.add.text(20, 15, '', {
            fontSize: '20px',
            fill: '#fff',
            wordWrap: { width: 340 },
            lineSpacing: 8
        });
        G.maquinaDialogContainer.add(G.maquinaDialogText);

        // Botão OK com estilo consistente
        G.maquinaDialogOkButton = this.add.text(350, 110, 'OK', {
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

        // Eventos de hover para o botão OK
        G.maquinaDialogOkButton.on('pointerover', () => {
            G.maquinaDialogOkButton.setStyle({
                fontSize: '20px',
                fill: '#ffffff',
                backgroundColor: '#5e84f5',
                padding: {
                    left: 15,
                    right: 15,
                    top: 8,
                    bottom: 8
                },
                borderRadius: 5
            });
        });

        G.maquinaDialogOkButton.on('pointerout', () => {
            G.maquinaDialogOkButton.setStyle({
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
            });
        });

        // Adiciona o botão ao container
        G.maquinaDialogContainer.add(G.maquinaDialogOkButton);

        // Função para mostrar o diálogo da máquina final
        function showMaquinaDialog(message) {
            // Para o jogador imediatamente (reforçado)
            if (G.player) {
                G.isMoving = false;
                G.player.setVelocity(0, 0);
                G.player.anims.stop();
                G.player.setFrame(4); // Frame parado olhando para baixo
            }
            
            // Cancela TODOS os tweens
            this.tweens.killAll();
            
            // Define o texto no diálogo
            G.maquinaDialogText.setText(message);
            
            // Calcula a altura do texto
            const textHeight = G.maquinaDialogText.height;
            
            // Altura mínima para o diálogo ou altura do texto + margens
            const dialogHeight = Math.max(160, textHeight + 60);
            
            // Redesenha o fundo com a nova altura
            G.maquinaDialogBg.clear();
            G.maquinaDialogBg.fillStyle(0x000000, 0.8);
            G.maquinaDialogBg.fillRoundedRect(0, 0, 420, dialogHeight, 16);
            G.maquinaDialogBg.lineStyle(2, 0x4a6cd3, 1);
            G.maquinaDialogBg.strokeRoundedRect(0, 0, 420, dialogHeight, 16);
            
            // Posiciona o botão OK (será escondido depois se necessário)
            const buttonY = Math.max(textHeight + 15, 110);
            G.maquinaDialogOkButton.setPosition(350, buttonY);
            
            // CENTRALIZA o container de diálogo na tela
            const centerX = (G.gameWidth - 500) / 2;
            const centerY = G.gameHeight / 2;
            
            // Define a posição do container
            G.maquinaDialogContainer.setPosition(centerX - 210, centerY - dialogHeight/2);
            
            // Torna o container visível
            G.maquinaDialogContainer.setVisible(true);
            G.dialogActive = true;
            G.inDialog = true;
            
            // Limpa a sequência de ações
            G.actionSequence = [];
            G.currentActionIndex = 0;
            G.isProgramming = true;
        }

        // Configura o evento de clique do botão OK do NPC
        G.fase3DialogOkButton.on('pointerdown', () => {
            console.log("Botão OK do NPC fase 3 clicado");
            
            // Verifica se estamos em uma sequência de diálogos
            if (G.fase3DialogSequence.length > 0 && G.fase3DialogIndex < G.fase3DialogSequence.length - 1) {
                // Avança para o próximo diálogo na sequência
                G.fase3DialogIndex++;
                showFase3Dialog(G.fase3DialogSequence[G.fase3DialogIndex]);
            } else {
                // Fecha o diálogo quando não há mais mensagens
                G.fase3DialogContainer.setVisible(false);
                G.dialogActive = false;
                G.inDialog = false;
                G.isProgramming = true; // Permite programar novamente
                
                // Limpa a sequência de diálogos
                G.fase3DialogSequence = [];
                G.fase3DialogIndex = 0;
            }
        });

        // Configura o evento de clique do botão OK dos computadores
        G.computerDialogOkButton.on('pointerdown', () => {
            console.log("Botão OK do computador clicado");
            
            // Verifica se estamos em uma sequência de diálogos
            if (G.computerDialogSequence && G.computerDialogSequence.length > 0 && 
                G.computerDialogIndex < G.computerDialogSequence.length - 1) {
                // Avança para o próximo diálogo na sequência
                G.computerDialogIndex++;
                showComputerDialog(G.computerDialogSequence[G.computerDialogIndex]);
            } else {
                // Fecha o diálogo quando não há mais mensagens
                G.computerDialogContainer.setVisible(false);
                G.dialogActive = false;
                G.inDialog = false;
                G.isProgramming = true; // Permite programar novamente
                
                // Limpa a sequência de diálogos
                if (G.computerDialogSequence) {
                    G.computerDialogSequence = [];
                    G.computerDialogIndex = 0;
                }
            }
        });

        // Configura o evento de clique do botão OK da máquina final
        G.maquinaDialogOkButton.on('pointerdown', () => {
            console.log("Botão OK da máquina final clicado");
            G.maquinaDialogContainer.setVisible(false);
            G.dialogActive = false;
            G.inDialog = false;
            G.isProgramming = true; // Permite programar novamente
        });

        // Guarda referências das funções para uso no update
        this.showFase3Dialog = showFase3Dialog;
        this.showComputerDialog = showComputerDialog;
        this.showMaquinaDialog = showMaquinaDialog;
        
        // 3. Modifique o estilo visual do elemento que simula o alert (linha ~550)
        // Console log de sucesso (inicialmente invisível) - agora simulará um alert
        G.alertBox = this.add.container(480, 350); // Movido de 400 para 480 (mais à direita)
        G.alertBox.setVisible(false);

        // Background do alert
        const alertBg = this.add.graphics();
        alertBg.fillStyle(0xffffff, 1);
        alertBg.fillRoundedRect(-200, -100, 400, 200, 10);
        alertBg.lineStyle(2, 0x000000, 1);
        alertBg.strokeRoundedRect(-200, -100, 400, 200, 10);
        G.alertBox.add(alertBg);

        // Título do alert
        const alertTitle = this.add.text(0, -70, 'JavaScript', {
            fontSize: '18px',
            fontFamily: 'Arial',
            fontWeight: 'bold',
            fill: '#000000',
            align: 'center'
        }).setOrigin(0.5);
        G.alertBox.add(alertTitle);

        // Linha divisória
        const alertLine = this.add.graphics();
        alertLine.lineStyle(1, 0x000000, 0.5);
        alertLine.lineBetween(-190, -45, 190, -45);
        G.alertBox.add(alertLine);

        // Texto do alert
        G.alertText = this.add.text(0, 0, '', {
            fontSize: '20px',
            fontFamily: 'Arial',
            fill: '#000000',
            align: 'center',
            wordWrap: { width: 350 }
        }).setOrigin(0.5);
        G.alertBox.add(G.alertText);

        // Botão OK
        const alertButton = this.add.rectangle(0, 70, 100, 30, 0xeeeeee);
        alertButton.setInteractive({ useHandCursor: true });
        G.alertBox.add(alertButton);

        // Borda do botão
        const alertButtonBorder = this.add.graphics();
        alertButtonBorder.lineStyle(1, 0x000000, 1);
        alertButtonBorder.strokeRect(-50, 55, 100, 30);
        G.alertBox.add(alertButtonBorder);

        // Texto do botão
        const alertButtonText = this.add.text(0, 70, 'OK', {
            fontSize: '16px',
            fontFamily: 'Arial',
            fill: '#000000'
        }).setOrigin(0.5);
        G.alertBox.add(alertButtonText);

        // Evento de clique no botão OK
        alertButton.on('pointerdown', () => {
            // Esconde o alert
            G.alertBox.setVisible(false);
            
            // Se esta foi a primeira vez que usou o alert, marca como aprendido
            if (!G.alertFunctionLearned) {
                G.alertFunctionLearned = true;
                
                // Adiciona a função ao HDD
                this.scene.get('HudScene').events.emit('addFunction', 'alert()');
                
                // Após fechar o alert, mostra mensagem de sucesso
                this.time.delayedCall(200, () => {
                    this.showMaquinaDialog("Parabéns! Você aprendeu a usar a função alert() para exibir mensagens em pop-ups.\n\nA variável let que você utilizou poderia ter qualquer tipo de texto dentro, assim podendo escrever no alert o que você quiser!\n\nA função foi adicionada ao seu HDD e estará disponível na aba de Funções se você quiser ver.\n\nVocê completou a fase com sucesso!");
                });
            } else {
                // Se já aprendeu, apenas fecha o diálogo
                G.dialogActive = false;
                G.inDialog = false;
            }
        });
    }

    update() {
        // Chama o update.js para controlar movimentos programados
        update.call(this);
        
        // Lógica específica para o reset do jogador após terminar a sequência de movimentos
        if (!G.isMoving && G.currentActionIndex >= G.actionSequence.length && G.actionSequence.length > 0) {
            // Aqui o jogador terminou a sequência de movimentos, mas não chegou ao destino desejado
            if (!G.inDialog && !G.dialogActive) {
                // NÃO crie um novo texto de reset, apenas habilite a flag global
                G.podeResetar = true;
                
                // A HudScene lidará com a exibição do texto automaticamente
                // baseado na flag G.podeResetar
            }
        } else {
            // Se o jogador estiver se movendo ou não tiver terminado a sequência
            G.podeResetar = false;
        }
        
        // Verifica proximidade com o NPC da Fase 3
        if (
            G.fase3Npc &&
            Phaser.Math.Distance.Between(G.player.x, G.player.y, G.fase3Npc.x, G.fase3Npc.y) < 150 &&
            !G.inDialog &&
            !G.dialogActive
        ) {
            G.fase3NpcInteractionText.setText('Pressione E para falar');
            G.fase3NpcInteractionText.setPosition(
                G.fase3Npc.x - G.fase3NpcInteractionText.width / 2,
                G.fase3Npc.y - 100
            );
            G.fase3NpcInteractionText.setVisible(true);
            
            if (Phaser.Input.Keyboard.JustDown(G.keyE)) {
                G.fase3NpcInteractionText.setVisible(false);
                
                // Verifique se o jogador já tem o HDD
                if (!G.hasHDD) {
                    // Diálogo inicial - dá o HDD ao jogador (sequência de diálogos)
                    this.showFase3Dialog([
                        "Parece que nos encontramos de novo.",
                        "Vamos direto ao ponto. Para te ajudar na sua jornada, vou te dar um HDD que armazenará as funções que você aprender.",
                        "As funções são blocos de código reutilizáveis que executam tarefas específicas e são essenciais para programadores.",
                        "Mas elas não são exatamente o foco aqui, vamos continuar no assunto de variáveis.",
                        "O meu Assistente instalou em você uma memória RAM para armazenamento temporário, certo?",
                        "Estou vendo aqui que ele te deu uma constante chamada 'senha' com o valor 1234.",
                        "Vamos continuar então, agora te explicarei o let. Para ajudar nesse desafio, vamos usar esse HDD que instalei em você para utilizar uma função com o let.",
                        "Abaixo de nós temos 3 computadores, um com uma váriavel de texto incorreta, outra com uma váriavel boolean, e uma com uma variável string que é a correta.",
                        "Nós vamos utilizar a função alert(), que é usada para exibir mensagens em uma janela pop-up no navegador.",
                        "Pra exibir uma mensagem com alert, precisamos de uma variável de texto (string) que esteja entre aspas.",
                        "Vá até o computador que você acha que tem a variável correta e armazene ela na sua memória. Após isso vamos utilizar essa variável.",
                    ]);
                    
                    // Dá o HDD ao jogador
                    G.hasHDD = true;
                    
                    // Mostra o HDD na HUD
                    this.scene.get('HudScene').events.emit('showHDD');
                } else if (!G.senhaCorretaEscolhida) {
                    // Já tem o HDD mas ainda não escolheu a variável correta
                    this.showFase3Dialog([
                        "Vejo que você já tem o HDD, agora precisa escolher a variável correta.",
                        "Uma string (texto) precisa estar entre aspas para ser reconhecida pelo JavaScript.",
                        "Examine os três computadores ao fundo da sala e escolha o formato correto."
                    ]);
                } else if (!G.alertFunctionLearned) { // Renomeado de consoleFunctionLearned para alertFunctionLearned
                    // Já escolheu a variável correta mas ainda não usou o alert
                    this.showFase3Dialog([
                        "Muito bem! Você encontrou o formato correto para armazenar texto: let falar = \"Olá mundo!\"",
                        "A variável foi armazenada na sua memória RAM. Agora vamos usá-la!",
                        "Vá até a máquina à esquerda e use a função alert() para exibir a mensagem.",
                        "alert() exibe uma janela pop-up com a mensagem, útil para comunicar informações ao usuário."
                    ]);
                } else {
                    // Já completou tudo
                    this.showFase3Dialog([
                        "Parabéns! Você aprendeu conceitos fundamentais de JavaScript:",
                        "1. Como criar uma variável de texto (string) usando let e aspas",
                        "2. Como exibir mensagens em pop-up usando alert()",
                        "Essas são habilidades que você usará constantemente como programador.",
                        "Fique à vontade para explorar mais ou avançar para o próximo desafio!"
                    ]);
                }
            }
        } else if (G.fase3NpcInteractionText && G.fase3NpcInteractionText.visible && !G.inDialog) {
            G.fase3NpcInteractionText.setVisible(false);
        }
        
        // Fecha diálogos quando o jogador pressiona E
        if (G.inDialog && G.dialogActive && G.dialogText.visible && Phaser.Input.Keyboard.JustDown(G.keyE)) {
            G.dialogText.setVisible(false);
            G.inDialog = false;
            G.dialogActive = false;
        }
        
        // Atualiza o cooldown do diálogo
        if (G.dialogCooldown > 0) {
            G.dialogCooldown--;
        }
        
        // ADICIONE ESTE CÓDIGO: Verificação de distância para os computadores - similar à Street
        if (!G.inDialog && !G.dialogActive && G.dialogCooldown === 0) {
            // Verifica proximidade com qualquer computador
            G.computerPoints.forEach((computer, index) => {
                const dist = Phaser.Math.Distance.Between(
                    G.player.x, G.player.y, 
                    computer.x, computer.y
                );
                
                // Se estiver próximo o suficiente do computador, inicia o diálogo
                if (dist < 120) // Detecção antecipada
                {
                    console.log("Proximidade com computador detectada:", index, "distância:", dist);
                    
                    // Mostra a mensagem quando se aproxima do computador
                    if (G.dialogText && !G.inDialog) {
                        // Para IMEDIATAMENTE qualquer movimento do jogador
                        G.isMoving = false;
                        G.player.setVelocity(0, 0);
                        G.player.anims.stop();
                        
                        // IMPORTANTE: Interrompe qualquer tween em andamento
                        this.tweens.killTweensOf(G.player);
                        
                        let mensagem = "";
                        
                        // Mensagens específicas para cada computador
                        if (index === 0) { // PC 1
                            mensagem = "Incorreto. Este let não possui \" \" para ser string e não é considerado number pois é apenas letras.";
                        } else if (index === 1) { // PC 2
                            mensagem = "Correto! A string let falar = \"Olá mundo!\" vai funcionar como comando!";

                            // Agora não substituímos a senha antiga, mas adicionamos uma nova variável
                            G.senhaCorretaEscolhida = true;
                            G.senhaAtual = 'Olá mundo!';
                            G.comandoFalar = true; // Nova flag para indicar que o comando de fala foi encontrado
                            
                            // Atualiza o texto da memória para mostrar AMBAS as senhas
                            if (G.hasMemoryUpgrade && G.memoryText) {
                                // Verifica se já tem a senha anterior da Fase 2
                                if (G.passwordFound) {
                                    // Mostra ambas as senhas/variáveis na memória
                                    G.memoryText.setText("Sua Memória:\nconst senha = 1234;\nlet falar = 'Olá mundo!';");
                                } else {
                                    // Caso não tenha a senha anterior (improvável, mas por segurança)
                                    G.memoryText.setText("Sua Memória:\nlet falar = 'Olá mundo!';");
                                }
                            }
                        } else if (index === 2) { // PC 3
                            mensagem = "Incorreto. Este é um boolean, ele não salva textos e sim TRUE ou FALSE.";
                        }
                        
                        G.dialogText.setText(mensagem);
                        G.dialogText.setPosition(
                            computer.x - G.dialogText.width / 2,
                            computer.y - 240  // Alterado de -200 para -300 para subir o texto
                        );
                        G.dialogText.setVisible(true);
                        G.dialogActive = true;
                        G.inDialog = true;
                        
                        // Afasta o jogador do computador para evitar interação imediata
                        const angle = Phaser.Math.Angle.Between(computer.x, computer.y, G.player.x, G.player.y);
                        G.player.x += Math.cos(angle) * 50;
                        G.player.y += Math.sin(angle) * 50;
                        
                        // Define um cooldown longo
                        G.dialogCooldown = 120;
                        
                        // Reinicia o jogador para modo de programação
                        G.actionSequence = [];
                        G.currentActionIndex = 0;
                        G.isProgramming = true;
                        
                        // Atualiza o texto da HUD
                        if (G.hudActionsText) {
                            G.hudActionsText.setText('');
                        }
                    }
                }
            });
        }
    }
    
    resetPlayer() {
        // Reset do jogador para a posição inicial
        G.player.setPosition(G.startPosition.x, G.startPosition.y);
        
        // MODIFICADO: Para explicitamente qualquer animação e define o quadro parado
        G.player.anims.stop();
        G.player.setFrame(4); // Frame parado olhando para baixo
        
        // Limpa a sequência de ações e prepara para nova programação
        G.actionSequence = [];
        G.currentActionIndex = 0;
        G.isProgramming = true;
        G.isMoving = false;
        G.podeResetar = false;
        
        // Atualiza o texto da HUD
        if (G.hudActionsText) {
            G.hudActionsText.setText('');
        }
        
        // Esconde o texto de reset
        if (G.resetText) {
            G.resetText.setVisible(false);
        }
        
        console.log("Jogador resetado na Fase 3");
    }
}