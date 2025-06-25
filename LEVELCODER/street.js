import { G } from './globals.js';
import { update, resetPlayer } from './update.js';

export class StreetScene extends Phaser.Scene {
    constructor() {
        super({ 
            key: 'StreetScene',
            physics: {
                arcade: {
                    debug: false // Ativa o debug da física para esta cena
                }
            }
        });
    }

    preload() {
        this.load.image('bg_street', 'assets/PNG/Tiles/bg_street.jpeg');
    }

    create() {
        // Reset a flag de transição
        G.isTransitioning = false;

        this.add.image(480, 350, 'bg_street')
        .setDisplaySize(G.gameWidth - 500, G.gameHeight)
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0);

        // Defina a posição inicial nesta fase
        G.startPosition = { x: 400, y: 200 };
        
        // Player
        G.player = this.physics.add.sprite(G.startPosition.x, G.startPosition.y, 'player', 1);
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

        // Inicialize variáveis globais para a nova sala
        G.actionSequence = [];
        G.isProgramming = true;
        G.currentActionIndex = 0;
        G.actionTimer = 0;
        G.isMoving = false;

        // Input
        G.cursors = this.input.keyboard.createCursorKeys();
        G.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

        G.dialogText = this.add.text(0, 0, '', {
            fontSize: '20px',
            fill: '#fff',
            backgroundColor: 'black',
            padding: 10,
            wordWrap: { width: 500 }
        });
        G.dialogText.setVisible(false);

        // Limpa NPC e porta para não dar erro no update.js
        G.npc = null;
        G.door = null;
        if (G.npcInteractionText) G.npcInteractionText.setVisible(false);
        if (G.doorInteractionText) G.doorInteractionText.setVisible(false);

        // Adiciona o NPC assistente na posição desejada
        G.assistenteNpc = this.physics.add.staticSprite(500, 200, 'assistente_npc');
        G.assistenteNpc.setScale(0.3);

        // Área de colisão REDUZIDA significativamente
        G.assistenteNpc.setSize(120, 120); // Reduzido de 180x180 para 120x120
        G.assistenteNpc.setOffset(140, 240); // Ajustado para manter centralizado

        // Texto de interação do assistente
        G.assistenteNpcInteractionText = this.add.text(0, 0, 'Pressione E para conversar', {
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: 8
        });
        G.assistenteNpcInteractionText.setVisible(false);
        
        // OVERLAP para o diálogo automático com o NPC assistente
        this.physics.add.overlap(G.player, G.assistenteNpc, () => {
            console.log("Overlap detectado com assistente_npc, passwordFound:", G.passwordFound);
            
            // Verifica se tem a senha e pode mostrar o diálogo - SIMPLIFICA CONDIÇÕES
            if (G.passwordFound && !G.dialogActive && !G.inDialog && !G.assistantDialogShown && G.dialogCooldown === 0) {
                console.log("Mostrando diálogo automático com novo sistema via overlap");
                
                // Para o jogador imediatamente
                G.isMoving = false;
                G.player.setVelocity(0, 0);
                G.player.anims.stop();
                
                // Define a sequência de diálogos
                G.dialogSequence = [
                    "Perfeito! Parece que você conseguiu encontrar e armazenar a senha.",
                    "É importante saber que no JavaScript, as variáveis são armazenadas em let, var e const.",
                    "O const deixa você armazenar dados que não podem ser mudados após sua declaração.",
                    "Ele é perfeito para aquelas variáveis que você quer manter sempre igual, como uma senha.",
                    "Já o 'var' é uma variavél que pode ser modificada quando você quiser.",
                    "Variáveis são muito utilizadas para salvar informações que você quer modificar durante seu trabalho.",
                    "Por últimos temos o let, que é uma variável que pode ser modificada, mas só dentro do escopo onde foi criada.",
                    "Na programação, é essencial entender como e onde armazenar suas informações.",
                    "Na próxima fase, o Professor vai te explicar sobre let e como utiliza-lás de forma prática.",
                    "Agora que você tem a senha, siga para baixo para continuar. Boa sorte!"
                ];
                
                // Reseta o índice de diálogos
                G.dialogIndex = 0;
                
                // CENTRALIZA o container de diálogo na tela
                const centerX = (G.gameWidth - 500) / 2;
                const centerY = G.gameHeight / 2;
                
                // Posiciona o container de diálogo no centro da tela
                G.assistenteDialogContainer.setPosition(centerX - 210, centerY - 80);
                
                // Mostra o primeiro diálogo
                this.showNextAssistenteDialog();
                
                // Afasta o jogador do NPC para evitar entrar na sprite
                const angle = Phaser.Math.Angle.Between(G.assistenteNpc.x, G.assistenteNpc.y, G.player.x, G.player.y);
                G.player.x += Math.cos(angle) * 100; // Aumentado para afastar mais
                G.player.y += Math.sin(angle) * 100; // Aumentado para afastar mais
                
                // Define um cooldown
                G.dialogCooldown = 300;
            }
            // Quando NÃO tem a senha, apenas mostra o texto de interação
            else if (!G.passwordFound && !G.dialogActive && !G.inDialog) {
                if (G.assistenteNpcInteractionText) {
                    G.assistenteNpcInteractionText.setText('Pressione E para conversar');
                    G.assistenteNpcInteractionText.setPosition(
                        G.assistenteNpc.x - 100,
                        G.assistenteNpc.y - 70
                    );
                    G.assistenteNpcInteractionText.setVisible(true);
                }
            }
        }, null, this);

        // Cria uma textura invisível para os pontos de interação
        if (!this.textures.exists('invisible')) {
            const graphics = this.add.graphics();
            graphics.fillStyle(0xffffff, 0);
            graphics.fillRect(0, 0, 1, 1);
            graphics.generateTexture('invisible', 1, 1);
            graphics.destroy();
        }

        // Adiciona pontos de interação invisíveis para as mesas no background
        G.passwordFound = false;
        G.passwordPoints = [];

        // Posições das 4 mesas no background (ajuste conforme o seu layout)
        const tablePositions = [
            { x: 120, y: 370 },
            { x: 160, y: 580 },
            { x: 870, y: 330 },
            { x: 820, y: 550 }
        ];
        
        // Cria os pontos de interação invisíveis - SIMILAR AO SISTEMA DA FASE 3
        tablePositions.forEach((pos, index) => {
            // Cria um sprite invisível com área de colisão maior e visível para debug
            const table = this.physics.add.staticSprite(pos.x, pos.y, 'invisible');
            table.setDisplaySize(0, 0); // Mesmo tamanho usado na fase 3
            table.setSize(180, 180);        // Tamanho de colisão igual
            table.setAlpha(0.3);            // Ligeiramente visível para debug
            
            G.passwordPoints.push(table);
            
            // Adiciona overlap para cada mesa - USANDO O MESMO SISTEMA DA FASE 3
            this.physics.add.overlap(G.player, table, () => {
                console.log("Colisão com mesa detectada, index:", index);
                
                // IMPORTANTE: Sempre para o movimento imediatamente
                G.isMoving = false;
                G.player.setVelocity(0, 0);
                G.player.anims.stop();
                
                // CRUCIAL: Cancela TODOS os tweens existentes
                this.tweens.killTweensOf(G.player);
                
                // Limpa todos os movimentos programados
                G.actionSequence = [];
                G.currentActionIndex = 0;
                G.isProgramming = true;
                
                // Atualiza a HUD para mostrar sequência vazia
                if (G.hudActionsText) {
                    G.hudActionsText.setText('');
                }
                
                // Só mostra o diálogo se não estiver já em diálogo e o cooldown estiver zerado
                if (!G.inDialog && !G.dialogActive && G.dialogCooldown === 0) {
                    console.log("Iniciando diálogo com mesa", index);
                    
                    // MODIFICADO: Posiciona o container de diálogo no CENTRO da tela
                    // Usando as dimensões do jogo para centralizar
                    let dialogX = (G.gameWidth - 500) / 2; // Centro da área jogável (deixando espaço para HUD)
                    let dialogY = G.gameHeight / 2;        // Centro vertical da tela
                    
                    // Aplica a posição centralizada
                    G.mesaDialogContainer.setPosition(dialogX, dialogY - 80); // -80 para ficar um pouco acima do centro
                    
                    // VERIFICAÇÃO DO UPGRADE DE MEMÓRIA
                    if (!G.hasMemoryUpgrade) {
                        // Não tem o upgrade de memória, mostra mensagem diferente
                        G.mesaDialogText.setText("Fale com o Assistente para pegar sua memória primeiro.");
                        
                        // Calcula a altura do texto
                        const textHeight = G.mesaDialogText.height;
                        
                        // Posiciona o botão OK
                        const buttonY = Math.max(textHeight + 15, 110);
                        G.mesaDialogOkButton.setPosition(350, buttonY);
                        
                        // Torna o container visível
                        G.mesaDialogContainer.setVisible(true);
                        G.dialogActive = true;
                        G.inDialog = true;
                    } else {
                        // Tem o upgrade de memória, mostra o diálogo normal
                        this.showMesaDialog();
                        
                        // Salva a senha apenas na primeira vez e se tiver o upgrade
                        if (!G.passwordFound) {
                            // Define que a senha foi encontrada
                            G.passwordFound = true;
                            
                            // Atualiza a memória
                            if (G.memoryText) {
                                G.memoryText.setText("Sua Memória:\nconst senha = 1234;");
                            }
                        }
                    }
                    
                    // Afasta o jogador da mesa para evitar interação repetida
                    const angle = Phaser.Math.Angle.Between(table.x, table.y, G.player.x, G.player.y);
                    G.player.x += Math.cos(angle) * 80;
                    G.player.y += Math.sin(angle) * 80;
                    
                    // Define um cooldown longo
                    G.dialogCooldown = 300;
                }
            }, null, this);
        });
        
        // Adiciona uma porta invisível na parte inferior da tela
        G.door = this.physics.add.sprite(500, 650, 'invisible');
        G.door.setDisplaySize(300, 20);
        G.door.setImmovable(true);
        G.door.setAlpha(0); // Totalmente invisível

        // Texto de interação da porta
        G.doorInteractionText = this.add.text(0, 0, 'Pressione E para continuar', {
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            padding: 8
        });
        G.doorInteractionText.setVisible(false);

        // Adiciona verificação de overlap com a porta
        this.physics.add.overlap(G.player, G.door, () => {
            // Interrompe IMEDIATAMENTE qualquer movimento
            G.isMoving = false;
            G.player.setVelocity(0, 0);
            G.player.anims.stop();
            
            // Cancela qualquer tween de movimento em andamento
            this.tweens.killTweensOf(G.player);
            
            if (G.passwordFound && !G.isTransitioning) {
                // Adicione uma flag para evitar múltiplas transições
                G.isTransitioning = true;
                
                // Guarda explicitamente os valores importantes
                const passwordStatus = G.passwordFound;
                const memoryUpgrade = G.hasMemoryUpgrade;
                
                console.log("Antes da transição - senha:", passwordStatus, "upgrade:", memoryUpgrade);
                
                // Faz o fade out e muda para a próxima fase
                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    // IMPORTANTE: Salve explicitamente os valores globais antes da transição
                    console.log("Antes da transição - senha:", G.passwordFound, "upgrade:", G.hasMemoryUpgrade);
                    
                    // Armazene valores importantes em variáveis globais persistentes
                    window.GAME_STATE = {
                        passwordFound: G.passwordFound,
                        hasMemoryUpgrade: G.hasMemoryUpgrade,
                        memoryContent: G.passwordFound ? "const senha = 1234" : "(vazia)" // Removidas as aspas
                    };
                    
                    // Inicia a próxima fase
                    this.scene.start('Fase3Scene');
                });
            } else if (!G.passwordFound) {
                // Cria um container para agrupar os elementos do alerta
                if (!G.doorAlertContainer) {
                    // Cria um novo container para o alerta da porta - posicionado mais à esquerda
                    G.doorAlertContainer = this.add.container(G.gameWidth/2 - 250, G.gameHeight / 2 - 50);
                    
                    // Adiciona um fundo para o alerta simplificado
                    const alertBg = this.add.graphics();
                    alertBg.fillStyle(0x990000, 0.9); // Vermelho escuro com alta opacidade
                    alertBg.fillRoundedRect(-150, -50, 300, 100, 12); // Caixa mais simples e compacta
                    alertBg.lineStyle(3, 0xff3333, 1); // Borda vermelha
                    alertBg.strokeRoundedRect(-150, -50, 300, 100, 12);
                    
                    G.doorAlertContainer.add(alertBg);
                    
                    // Título do alerta simplificado
                    const alertTitle = this.add.text(0, -30, "ACESSO NEGADO", {
                        fontSize: '20px',
                        fontFamily: 'Arial, sans-serif',
                        fontWeight: 'bold',
                        fill: '#ffffff',
                        align: 'center'
                    });
                    alertTitle.setOrigin(0.5);
                    G.doorAlertContainer.add(alertTitle);
                    
                    // Texto do alerta simplificado
                    G.doorAlertText = this.add.text(0, 10, "Encontre a senha primeiro!", {
                        fontSize: '18px',
                        fontFamily: 'Arial, sans-serif',
                        fill: '#ffffff',
                        align: 'center'
                    });
                    G.doorAlertText.setOrigin(0.5);
                    G.doorAlertContainer.add(G.doorAlertText);
                    
                    // Efeito de aparecimento simplificado
                    G.doorAlertContainer.setAlpha(0);
                    
                    this.tweens.add({
                        targets: G.doorAlertContainer,
                        alpha: 1,
                        duration: 200,
                        ease: 'Linear'
                    });
                    
                    // Define a profundidade para garantir que fique acima de tudo
                    G.doorAlertContainer.setDepth(1000);
                } else {
                    // Se o container já existe, apenas o torna visível
                    G.doorAlertContainer.setVisible(true);
                    G.doorAlertContainer.setAlpha(0);
                    
                    this.tweens.add({
                        targets: G.doorAlertContainer,
                        alpha: 1,
                        duration: 200,
                        ease: 'Linear'
                    });
                }
                
                // Define um timer para esconder o alerta após 1.8 segundos
                this.time.delayedCall(1800, () => {
                    if (G.doorAlertContainer && G.doorAlertContainer.visible) {
                        this.tweens.add({
                            targets: G.doorAlertContainer,
                            alpha: 0,
                            duration: 200,
                            ease: 'Linear',
                            onComplete: () => {
                                G.doorAlertContainer.setVisible(false);
                            }
                        });
                    }
                });
                
                // Afasta o jogador da porta
                const angle = Phaser.Math.Angle.Between(G.door.x, G.door.y, G.player.x, G.player.y);
                G.player.x += Math.cos(angle) * 70;
                G.player.y += Math.sin(angle) * 70;
                
                // Força o jogador a voltar ao modo de programação após o alerta
                G.isProgramming = true;
                G.actionSequence = [];
                G.currentActionIndex = 0;
                
                // Define um cooldown
                G.dialogCooldown = 60;
            }
        }, null, this);

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

        // Exemplo de uso da função createBarrier
        // Cria barreiras ao redor da área jogável - AJUSTE AS COORDENADAS E TAMANHOS
        createBarrier(this, 400, 150, 800, 10);    // Topo
        createBarrier(this, 400, 690, 800, 10);  // Fundo
        createBarrier(this, 0, 350, 10, 700);    // Esquerda
        createBarrier(this, 790, 350, 10, 700);  // Direita

        // Sistema de diálogo avançado com botões para o NPC assistente
        // Cria um container para agrupar todos os elementos do diálogo do assistente
        G.assistenteDialogContainer = this.add.container(0, 0);
        G.assistenteDialogContainer.setVisible(false);

        // Fundo do diálogo 
        G.assistenteDialogBg = this.add.graphics();
        G.assistenteDialogBg.fillStyle(0x000000, 0.8);
        G.assistenteDialogBg.fillRoundedRect(0, 0, 420, 160, 16);
        G.assistenteDialogBg.lineStyle(2, 0x4a6cd3, 1);
        G.assistenteDialogBg.strokeRoundedRect(0, 0, 420, 160, 16);
        G.assistenteDialogContainer.add(G.assistenteDialogBg);

        // Texto com espaçamento maior entre linhas
        G.assistenteDialogText = this.add.text(20, 15, '', {
            fontSize: '20px',
            fill: '#fff',
            wordWrap: { width: 340 },
            lineSpacing: 8
        });
        G.assistenteDialogContainer.add(G.assistenteDialogText);

        // Botão OK com estilo consistente
        G.assistenteDialogOkButton = this.add.text(350, 110, 'OK', {
            fontSize: '20px',
            fill: '#ffffff',
            backgroundColor: '#4a6cd3', // Azul consistente
            padding: {
                left: 15,
                right: 15,
                top: 8,
                bottom: 8
            },
            borderRadius: 5
        }).setInteractive({ useHandCursor: true });

        // Substitua os eventos de hover por versões mais sutis
        G.assistenteDialogOkButton.on('pointerover', () => {
            G.assistenteDialogOkButton.setStyle({
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

        G.assistenteDialogOkButton.on('pointerout', () => {
            G.assistenteDialogOkButton.setStyle({
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
        G.assistenteDialogContainer.add(G.assistenteDialogOkButton);

        // Função para mostrar o próximo diálogo do assistente
        function showNextAssistenteDialog() {
            console.log("showNextAssistenteDialog chamado", G.dialogIndex, G.dialogSequence.length);
            
            // Verifica se ainda existem diálogos na sequência
            if (G.dialogIndex >= G.dialogSequence.length) {
                // Código para fechar o diálogo permanece igual
                G.assistenteDialogContainer.setVisible(false);
                G.dialogActive = false;
                G.inDialog = false;
                G.dialogIndex = 0;
                
                // Parar o jogador e limpar ações
                G.isMoving = false;
                G.player.setVelocity(0, 0);
                G.player.anims.stop();
                G.player.setFrame(4);
                G.actionSequence = [];
                G.currentActionIndex = 0;
                G.isProgramming = true;
                
                if (G.hudActionsText) {
                    G.hudActionsText.setText('');
                }
                
                if (G.passwordFound) {
                    G.assistantDialogShown = true;
                }
                
                this.tweens.killTweensOf(G.player);
                
                console.log("Diálogo do assistente finalizado, jogador parado completamente");
                return;
            }
            
            // Pega o próximo diálogo da sequência
            const currentDialog = G.dialogSequence[G.dialogIndex];
            console.log("Mostrando diálogo do assistente:", currentDialog);
            
            // Define o texto no diálogo
            G.assistenteDialogText.setText(currentDialog);
            
            // Calcula a altura do texto atual
            const textHeight = G.assistenteDialogText.height;
            
            // Altura mínima para o diálogo (160px) ou altura do texto + margens
            const dialogHeight = Math.max(160, textHeight + 60);
            
            // Redesenha o fundo com a nova altura e mantém a largura fixa
            G.assistenteDialogBg.clear();
            G.assistenteDialogBg.fillStyle(0x000000, 0.8);
            G.assistenteDialogBg.fillRoundedRect(0, 0, 420, dialogHeight, 16);
            G.assistenteDialogBg.lineStyle(2, 0x4a6cd3, 1);
            G.assistenteDialogBg.strokeRoundedRect(0, 0, 420, dialogHeight, 16);
            
            // REMOVIDO: código que removia o botão do container
            
            // Posiciona o botão OK no canto inferior direito dentro da caixa
            const buttonY = Math.max(textHeight + 15, 110);
            G.assistenteDialogOkButton.setPosition(350, buttonY);
            G.assistenteDialogOkButton.setText('OK'); // Restaura o texto para "OK"
            
            // Restaura o estilo original do botão (consistente, sem vermelho)
            G.assistenteDialogOkButton.setStyle({
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
            
            // Se estivermos começando uma nova sequência de diálogos, centralize o container
            if (G.dialogIndex === 0) {
                // CENTRALIZA o container de diálogo na tela
                const centerX = (G.gameWidth - 500) / 2;
                const centerY = G.gameHeight / 2;
                
                // Define a posição do container, ajustando a posição Y com base na altura
                G.assistenteDialogContainer.setPosition(centerX - 210, centerY - dialogHeight/2);
            }
            
            // Torna o container visível
            G.assistenteDialogContainer.setVisible(true);
            G.dialogActive = true;
            G.inDialog = true;
            
            // Avança para o próximo diálogo
            G.dialogIndex++;
        }

        // Configura o evento de clique do botão OK
        G.assistenteDialogOkButton.on('pointerdown', () => {
            console.log("Botão OK do assistente clicado");
            
            // IMPORTANTE: Use o contexto correto para a função
            showNextAssistenteDialog.call(this);
            
            // ADICIONAR: Para o jogador mesmo durante o diálogo
            G.player.setVelocity(0, 0);
            G.player.anims.stop();
        });

        // Guarda a referência da função para uso no update
        this.showNextAssistenteDialog = showNextAssistenteDialog;

        // Sistema de diálogo para as mesas
        G.mesaDialogContainer = this.add.container(0, 0);
        G.mesaDialogContainer.setVisible(false);

        // Fundo do diálogo 
        G.mesaDialogBg = this.add.graphics();
        G.mesaDialogBg.fillStyle(0x000000, 0.8);
        G.mesaDialogBg.fillRoundedRect(0, 0, 420, 160, 16);
        G.mesaDialogBg.lineStyle(2, 0x4a6cd3, 1);
        G.mesaDialogBg.strokeRoundedRect(0, 0, 420, 160, 16);
        G.mesaDialogContainer.add(G.mesaDialogBg);

        // Texto com espaçamento maior entre linhas
        G.mesaDialogText = this.add.text(20, 15, '', {
            fontSize: '20px',
            fill: '#fff',
            wordWrap: { width: 410 },
            lineSpacing: 10
        });
        G.mesaDialogContainer.add(G.mesaDialogText);

        // Botão OK com estilo consistente
        G.mesaDialogOkButton = this.add.text(350, 110, 'OK', {
            fontSize: '20px',
            fill: '#ffffff',
            backgroundColor: '#4a6cd3', // Azul consistente
            padding: {
                left: 15,
                right: 15,
                top: 8,
                bottom: 8
            },
            borderRadius: 5
        }).setInteractive({ useHandCursor: true });

        // Substitua os eventos de hover por versões mais sutis
        G.mesaDialogOkButton.on('pointerover', () => {
            G.mesaDialogOkButton.setStyle({
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

        G.mesaDialogOkButton.on('pointerout', () => {
            G.mesaDialogOkButton.setStyle({
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
        G.mesaDialogContainer.add(G.mesaDialogOkButton);

        // Função para mostrar o diálogo da mesa
        function showMesaDialog() {
            // Define o texto no diálogo
            if (!G.mesaDialogContainer.visible) {
                G.mesaDialogText.setText("Você encontrou a senha da porta!\nconst senha = 1234 foi salva na sua memória.\nVolte para o Assistente.");
            }
            
            // ADICIONE: Garanta que o botão OK esteja visível
            G.mesaDialogOkButton.setVisible(true);
            
            // Calcule a altura do texto com base no conteúdo
            const textHeight = G.mesaDialogText.height;
            
            // Altura mínima para o diálogo (160px) ou altura do texto + margens
            const dialogHeight = Math.max(160, textHeight + 60);
            
            // Redesenha o fundo com a nova altura
            G.mesaDialogBg.clear();
            G.mesaDialogBg.fillStyle(0x000000, 0.8);
            G.mesaDialogBg.fillRoundedRect(0, 0, 420, dialogHeight, 16);
            G.mesaDialogBg.lineStyle(2, 0x4a6cd3, 1);
            G.mesaDialogBg.strokeRoundedRect(0, 0, 420, dialogHeight, 16);
            
            // CENTRALIZA o container de diálogo na tela
            const centerX = (G.gameWidth - 500) / 2;
            const centerY = G.gameHeight / 2;
            
            // Define a posição do container, ajustando a posição Y com base na altura
            G.mesaDialogContainer.setPosition(centerX - 210, centerY - dialogHeight/2);
            
            // REMOVIDO: código que removia o botão do container
            
            // Posiciona o botão OK no canto inferior direito dentro da caixa
            const buttonY = Math.max(textHeight + 15, 110);
            G.mesaDialogOkButton.setPosition(350, buttonY);
            G.mesaDialogOkButton.setText('OK'); // Restaura o texto para "OK"
            
            // Restaura o estilo original do botão (consistente, sem vermelho)
            G.mesaDialogOkButton.setStyle({
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
            
            // Torna o container visível
            G.mesaDialogContainer.setVisible(true);
            G.dialogActive = true;
            G.inDialog = true;
        }

        // Configura o evento de clique do botão OK
        G.mesaDialogOkButton.on('pointerdown', () => {
            console.log("Botão OK da mesa clicado");
            G.mesaDialogContainer.setVisible(false);
            
            // IMPORTANTE: Oculta explicitamente o botão OK
            G.mesaDialogOkButton.setVisible(false);
            
            G.dialogActive = false;
            G.inDialog = false;
            G.isProgramming = true; // Permite programar novamente
        });

        // Guarda a referência da função para uso no update
        this.showMesaDialog = showMesaDialog;

        // Garante que os botões OK estejam visíveis após criação
        if (G.mesaDialogOkButton) {
            G.mesaDialogOkButton.setVisible(true);
        }

        if (G.assistenteDialogOkButton) {
            G.assistenteDialogOkButton.setVisible(true);
        }

        // IMPORTANTE: Reset dos estados de diálogo no início da cena
        G.inDialog = false;
        G.dialogActive = false;
        G.dialogCooldown = 0;
    }

    update() {
        // Chama o update.js para controlar movimentos programados
        update.call(this);
        
        // Adiciona verificação explícita para reset
        if (G.podeResetar && Phaser.Input.Keyboard.JustDown(this.input.keyboard.addKey('R'))) {
            console.log("Tecla R pressionada, resetando jogador na StreetScene");
            
            // IMPORTANTE: Cancela TODOS os tweens antes de resetar
            this.tweens.killAll(); // Mata TODOS os tweens, não apenas do jogador
            
            // Para o jogador imediatamente
            G.player.anims.stop();
            G.player.anims.pause();
            G.player.setFrame(4); // Frame parado olhando para baixo
            G.player.setVelocity(0, 0);
            
            // Reset dos estados de diálogo
            G.inDialog = false;
            G.dialogActive = false;
            
            // Garanta que os botões OK estejam visíveis
            if (G.mesaDialogContainer) {
                G.mesaDialogContainer.setVisible(false);
            }
            
            if (G.assistenteDialogContainer) {
                G.assistenteDialogContainer.setVisible(false);
            }
            
            if (G.mesaDialogOkButton) {
                G.mesaDialogOkButton.setVisible(true);
            }
            
            if (G.assistenteDialogOkButton) {
                G.assistenteDialogOkButton.setVisible(true);
            }
            
            // Força o resetPlayer a usar 'this' da cena atual
            G.currentScene = this;
            resetPlayer.call(this);
            
            // Força o jogador a voltar para a posição inicial e parar completamente
            if (G.player && G.startPosition) {
                G.player.setPosition(G.startPosition.x, G.startPosition.y);
                G.player.setVelocity(0, 0);
                G.player.anims.stop();
                G.player.setFrame(4);
            }
            
            // NOVO: Força uma segunda verificação após um pequeno atraso
            this.time.delayedCall(50, () => {
                G.player.anims.stop();
                G.player.setFrame(4);
            });
        }
        
        // Verifica constantemente a distância para o NPC assistente para detecção antecipada
        if (
            G.assistenteNpc && 
            G.passwordFound && 
            !G.assistantDialogShown && 
            !G.dialogActive && 
            !G.inDialog &&
            !G.isTransitioning // Adicione esta verificação para evitar processamento durante transições
        ) {
            // Distância maior para detecção antecipada
            const dist = Phaser.Math.Distance.Between(
                G.player.x, G.player.y, 
                G.assistenteNpc.x, G.assistenteNpc.y
            );
            
            // AUMENTAR esta distância para detecção mais precoce, mas adicione um limite mínimo
            // Isso evita o problema quando está muito próximo/embaixo do NPC
            if (dist < 150 && dist > 30) { // Modificado de 100 para 150 e adicionado limite mínimo
                console.log("Detecção antecipada do NPC assistente, distância:", dist);
                
                // Para o jogador imediatamente - VERSÃO REFORÇADA
                G.isMoving = false;
                G.player.setVelocity(0, 0);
                G.player.anims.stop();
                G.player.setFrame(4); // Frame parado olhando para baixo
                
                // Cancela qualquer tween de movimento em andamento
                this.tweens.killTweensOf(G.player);
                
                // Para qualquer movimento programado - LIMPA COMPLETAMENTE
                G.actionSequence = [];
                G.currentActionIndex = 0;
                G.isProgramming = true; // Importante: permite programar novamente
                
                // Atualiza o texto da HUD para mostrar a sequência vazia
                if (G.hudActionsText) {
                    G.hudActionsText.setText('');
                }
                
                // Define a sequência de diálogos
                G.dialogSequence = [
                    "Perfeito! Parece que você conseguiu encontrar e armazenar a senha.",
                    "É importante saber que no JavaScript, as variáveis são armazenadas em let, var e const.",
                    "O const deixa você armazenar dados que não podem ser mudados após sua declaração.",
                    "Ele é perfeito para aquelas variáveis que você quer manter sempre igual, como uma senha.",
                    "Já o 'var' é uma variavél que pode ser modificada quando você quiser.",
                    "Variáveis são muito utilizadas para salvar informações que você quer modificar durante seu trabalho.",
                    "Por últimos temos o let, que é uma variável que pode ser modificada, mas só dentro do escopo onde foi criada.",
                    "Na programação, é essencial entender como e onde armazenar suas informações.",
                    "Na próxima fase, o Professor vai te explicar sobre let e como utiliza-lás de forma prática.",
                    "Agora que você tem a senha, siga para baixo para continuar. Boa sorte!"
                ];
                
                // Reseta o índice de diálogos
                G.dialogIndex = 0;
                
                // CENTRALIZA o container de diálogo na tela
                const centerX = (G.gameWidth - 500) / 2;
                const centerY = G.gameHeight / 2;
                
                // Posiciona o container de diálogo no centro da tela
                G.assistenteDialogContainer.setPosition(centerX - 210, centerY - 80);
                
                // Mostra o primeiro diálogo
                this.showNextAssistenteDialog();
                
                // Afasta o jogador do NPC para evitar entrar na sprite
                const angle = Phaser.Math.Angle.Between(G.assistenteNpc.x, G.assistenteNpc.y, G.player.x, G.player.y);
                G.player.x += Math.cos(angle) * 70;
                G.player.y += Math.sin(angle) * 70;
                
                // Define um cooldown
                G.dialogCooldown = 300;
            }
        }
        
        // MODIFIQUE ESTA PARTE: Código específico para o NPC assistente
        // Este código agora apenas lida com a interação de botão E quando NÃO tem a senha
        if (
            G.assistenteNpc &&
            Phaser.Math.Distance.Between(G.player.x, G.player.y, G.assistenteNpc.x, G.assistenteNpc.y) < 150 &&
            !G.inDialog && 
            !G.dialogActive &&
            !G.passwordFound // Só mostra este código se NÃO tiver a senha
        ) {
            // Mostra o texto de interação
            if (G.assistenteNpcInteractionText) {
                G.assistenteNpcInteractionText.setText('Pressione E para conversar');
                G.assistenteNpcInteractionText.setPosition(
                    G.assistenteNpc.x - 130,
                    G.assistenteNpc.y - 120
                );
                G.assistenteNpcInteractionText.setVisible(true);
            }
            
            // Se apertar E, mostra o diálogo inicial
            if (Phaser.Input.Keyboard.JustDown(G.keyE)) {
                // Esconde o texto de interação
                if (G.assistenteNpcInteractionText) {
                    G.assistenteNpcInteractionText.setVisible(false);
                }

                // Define a sequência de diálogos
                G.dialogSequence = [
                    "Você deve ser o robô que o Professor mencionou!",
                    "Eu sou o Arthur, assistente do Professor.",
                    "Vou te ensinar sobre a memória e como você pode armazenar informações utilizando variáveis.",
                    "Aqui, vou instalar em você uma memória RAM, ela consegue armazenar informações temporárias.",
                    "Você consegue ver ela na sua HUD, ao lado da sua CPU.",
                    "Após pegar a senha, você consegue ver ela e futuras variáveis na sua memória.",
                    "Ah! Quase esqueci. Seu objetivo aqui é ir em um desses quatro computadores abaixo de nós e pegar uma senha.",
                    "Após pegar essa senha, você vai armazenar ela na sua aba de Memória, na sua HUD.",
                    "Vamos lá, vá até um dos computadores e pegue a senha!",
                ];
                
                // Reseta o índice de diálogos
                G.dialogIndex = 0;
                
                // Posiciona o container de diálogo próximo ao NPC
                G.assistenteDialogContainer.setPosition(G.assistenteNpc.x - 200, G.assistenteNpc.y + 100);
                
                // Mostra o primeiro diálogo
                this.showNextAssistenteDialog();
                
                // Dá o upgrade de memória RAM (apenas na primeira conversa)
                if (!G.hasMemoryUpgrade) {
                    G.hasMemoryUpgrade = true;
                    if (this.scene.get('HudScene')) {
                        this.scene.get('HudScene').events.emit('showMemoryIcon');
                    }
                }
            }
        } else if (G.assistenteNpcInteractionText && !G.dialogActive && !G.passwordFound) {
            G.assistenteNpcInteractionText.setVisible(false);
        }
    }
}
