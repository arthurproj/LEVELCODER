import { G } from './globals.js';

export function create() {
    // Inicializa o texto do diálogo como invisível
    G.dialogText = this.add.text(400, 300, '', { 
        fontSize: '32px', 
        fill: '#fff',
        wordWrap: { width: 600, useAdvancedWrap: true }
    }).setOrigin(0.5).setVisible(false);

    // Texto de reset
    G.resetText = this.add.text(400, 500, 'Pressione R para reiniciar', { 
        fontSize: '24px', 
        fill: '#f00',
        backgroundColor: '#000',
        padding: { x: 10, y: 5 },
        borderRadius: 10
    }).setOrigin(0.5).setVisible(false);

    // Adiciona a tecla R para reiniciar
    G.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    // Cria uma nova variável de tecla para E
    G.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // Cria uma nova variável de tecla para o espaço
    G.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Cria uma nova variável de tecla para o Enter
    G.keyEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    // Cria uma nova variável de tecla para o Escape
    G.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Define as teclas de direção
    G.cursors = this.input.keyboard.createCursorKeys();

    // Define a posição inicial do jogador
    G.startPosition = { x: 400, y: 300 };

    // Cria o jogador
    G.player = this.physics.add.sprite(G.startPosition.x, G.startPosition.y, 'player')
        .setOrigin(0.5, 0.5)
        .setCollideWorldBounds(true);

    // Animações do jogador
    this.anims.create({
        key: 'left',
        frames: [{ key: 'player', frame: 3 }],
        frameRate: 10,
    });

    this.anims.create({
        key: 'right',
        frames: [{ key: 'player', frame: 1 }],
        frameRate: 10,
    });

    this.anims.create({
        key: 'up',
        frames: [{ key: 'player', frame: 7 }],
        frameRate: 10,
    });

    this.anims.create({
        key: 'down',
        frames: [{ key: 'player', frame: 4 }],
        frameRate: 10,
    });

    // Grupo para as portas
    G.doorsGroup = this.physics.add.group();

    // Porta de saída (exemplo)
    const door = G.doorsGroup.create(700, 400, 'door').setOrigin(0.5, 0.5);
    door.setImmovable(true);
    door.body.setAllowGravity(false);

    // Adiciona colisão entre o jogador e as portas
    this.physics.add.collider(G.player, G.doorsGroup, (player, door) => {
        // Lógica para interação com a porta
        if (Phaser.Input.Keyboard.JustDown(G.keyE)) {
            // Exemplo: muda a cena ou faz algo quando o jogador aperta E na porta
            console.log('Interagiu com a porta');
        }
    });

    // Define a câmera para seguir o jogador
    this.cameras.main.startFollow(G.player);

    // Ajusta os limites da câmera
    this.cameras.main.setBounds(0, 0, 800, 600);

    // Ativa a física para a câmera (opcional, dependendo do efeito desejado)
    this.cameras.main.setPhysicsBounds(0, 0, 800, 600);

    // Texto de interação com NPC
    G.npcInteractionText = this.add.text(0, 0, '', { 
        fontSize: '24px', 
        fill: '#ff0',
        backgroundColor: '#000',
        padding: { x: 10, y: 5 },
        borderRadius: 10
    }).setOrigin(0.5).setVisible(false);

    // Exemplo de NPC
    G.npc = this.physics.add.sprite(400, 200, 'npc')
        .setOrigin(0.5, 0.5)
        .setCollideWorldBounds(true);

    // Animações do NPC (se necessário)
    this.anims.create({
        key: 'npc_idle',
        frames: [{ key: 'npc', frame: 0 }],
        frameRate: 10,
    });

    // Inicia a animação de idle do NPC
    G.npc.anims.play('npc_idle', true);

    // Colisão entre o jogador e o NPC (para interações)
    this.physics.add.overlap(G.player, G.npc, () => {
        // Lógica para interação com o NPC
        if (Phaser.Input.Keyboard.JustDown(G.keyE)) {
            // Exemplo: mostra um texto ou inicia um diálogo
            G.dialogText.setText('Olá, eu sou um NPC!').setVisible(true);
            G.dialogActive = true;
        }
    }, null, this);

    // Adiciona um evento de atualização para o diálogo
    this.events.on('update', () => {
        // Atualiza a posição do texto do diálogo em relação ao jogador
        if (G.dialogActive) {
            G.dialogText.setPosition(G.player.x, G.player.y - 50);
        }
    });

    // Reseta o jogador ao criar a cena (para garantir que comece na posição correta)
    resetPlayer.call(this);
}

// Função para atualização geral
export function update() {
    // Decrementa o cooldown a cada frame
    if (G.dialogCooldown > 0) {
        G.dialogCooldown--;
    }
    
    // Controle do diálogo
    if (G.dialogActive && !G.dialogContainer?.visible) {
        // Só processa diálogos antigos que não usam o novo container
        if (Phaser.Input.Keyboard.JustDown(G.keyE)) {
            G.dialogText.setVisible(false);
            G.dialogActive = false;
            G.inDialog = false;
            
            // NOVO: Verifica se estamos na fase Lab e falando com o NPC
            const currentScene = G.currentScene?.scene?.key;
            if (currentScene === 'LabScene' && G.npc) {
                // Reseta imediatamente o cooldown para o NPC do Lab
                G.dialogCooldown = 0;
                console.log("Resetando cooldown de diálogo para NPC do Lab");
            } else {
                // Para outras interações, mantém o cooldown normal
                G.dialogCooldown = 300; // 5 segundos a 60fps
            }
            
            G.wasInDialog = true;
            
            // Reseta completamente o sistema de movimento
            G.isProgramming = true;
            G.actionSequence = [];
            G.currentActionIndex = 0;
            G.isMoving = false;
            
            // Atualiza a HUD
            if (G.hudActionsText) {
                G.hudActionsText.setText('');
            }
            
            console.log("Diálogo fechado, cooldown:", G.dialogCooldown);
            return;
        }
        return;
    }

    // Modo de programação: captura as ações
    if (G.isProgramming) {
        if (G.actionSequence.length < G.maxActions) {
            if (Phaser.Input.Keyboard.JustDown(G.cursors.up)) {
                G.actionSequence.push('↑');
            } else if (Phaser.Input.Keyboard.JustDown(G.cursors.down)) {
                G.actionSequence.push('↓');
            } else if (Phaser.Input.Keyboard.JustDown(G.cursors.left)) {
                G.actionSequence.push('←');
            } else if (Phaser.Input.Keyboard.JustDown(G.cursors.right)) {
                G.actionSequence.push('→');
            }
        }

        if (G.hudActionsText) {
            G.hudActionsText.setText(G.actionSequence.join('\n'));
        }

        // Se atingiu o limite, começa a executar
        if (G.actionSequence.length === G.maxActions) {
            G.isProgramming = false;
            G.currentActionIndex = 0;
            G.actionTimer = 0;
        }
        return;
    }

    // Modo de execução: executa as ações programadas
    if (!G.isProgramming && G.actionSequence.length > 0) {
        // Executa uma ação por vez
        if (!G.isMoving && G.currentActionIndex < G.actionSequence.length) {
            startMovePlayerByAction.call(this, G.actionSequence[G.currentActionIndex]);
            G.currentActionIndex++;
        }

        // Se terminou todos os movimentos e não passou de fase, ativa o reset
        if (!G.isMoving && G.currentActionIndex >= G.actionSequence.length && !G.isTransitioning) {
            G.podeResetar = true;
            
            // Mostra o texto de reset se estiver disponível
            if (G.resetText) {
                G.resetText.setVisible(true);
            }
        } else {
            G.podeResetar = false;
            
            // Esconde o texto de reset durante movimentos
            if (G.resetText) {
                G.resetText.setVisible(false);
            }
        }
    }
}

// Função para iniciar o movimento animado do player conforme a ação
// Modifique a função startMovePlayerByAction para continuar a sequência mesmo após colisão
function startMovePlayerByAction(action) {
    const step = 120;
    let targetX = G.player.x;
    let targetY = G.player.y;
    let anim = null;

    switch (action) {
        case '↑': targetY -= step; anim = 'up'; break;
        case '↓': targetY += step; anim = 'down'; break;
        case '←': targetX -= step; anim = 'left'; break;
        case '→': targetX += step; anim = 'right'; break;
    }

    // Limite para não entrar na HUD
    const hudLimitX = 1020 - G.player.width / 2;
    if (targetX > hudLimitX) {
        targetX = hudLimitX;
    }

    G.isMoving = true;
    G.player.anims.play(anim, true);

    // Use um tween normal, mas com uma verificação de colisão simples antes
    // Primeiro, guarde a posição original
    const originalX = G.player.x;
    const originalY = G.player.y;
    
    // Tente mover o jogador diretamente para o destino para verificar colisão
    G.player.x = targetX;
    G.player.y = targetY;
    
    // Verifica se houve colisão
    const hasCollision = this.physics.world.colliders.getActive().some(collider => {
        if ((collider.object1 === G.player || collider.object2 === G.player) && 
            collider.active && !collider.overlapOnly) {
            return true;
        }
        return false;
    });
    
    // Restaura a posição original
    G.player.x = originalX;
    G.player.y = originalY;
    
    // Se houver colisão, modifique o alvo para ser um pouco antes da barreira
    if (hasCollision) {
        // Cálculo do ponto intermediário (90% do caminho)
        targetX = originalX + (targetX - originalX) * 0.9;
        targetY = originalY + (targetY - originalY) * 0.9;
    }
    
    // Usa o tween normal para o movimento
    this.tweens.add({
        targets: G.player,
        x: targetX,
        y: targetY,
        duration: 550,
        onComplete: () => {
            // ALTERAÇÃO CRÍTICA: Mesmo se bateu na parede, 
            // apenas marca que este movimento acabou e prepara para o próximo
            G.isMoving = false;
            G.player.anims.stop();
            
            switch (anim) {
                case 'left': G.player.setFrame(3); break;
                case 'right': G.player.setFrame(1); break;
                case 'up': G.player.setFrame(7); break;
                case 'down': G.player.setFrame(4); break;
            }
            
            // IMPORTANTE: Avance para o próximo movimento imediatamente se ainda houver
            if (G.currentActionIndex < G.actionSequence.length) {
                // Será tratado pelo código de update na próxima iteração
            }
        }
    });
}

// Função para verificar se um movimento é válido (não colide com barreiras)
function isMoveValid(scene, targetX, targetY) {
    // Cria um sprite temporário na posição alvo para testar colisões
    const testSprite = scene.physics.add.sprite(targetX, targetY, 'invisible');
    testSprite.setSize(G.player.width, G.player.height);
    testSprite.setVisible(false);
    
    // Flag para indicar se houve colisão
    let collision = false;
    
    // Testa colisão com todas as barreiras na cena
    scene.physics.world.colliders.getActive().forEach(collider => {
        // Verifica se o collider envolve o player
        if (collider.object1 === G.player || collider.object2 === G.player) {
            // Pega o outro objeto do collider (a barreira)
            const barrier = collider.object1 === G.player ? collider.object2 : collider.object1;
            
            // Testa colisão entre o sprite de teste e a barreira
            if (scene.physics.overlap(testSprite, barrier)) {
                collision = true;
            }
        }
    });
    
    // Destroi o sprite de teste
    testSprite.destroy();
    
    // Retorna verdadeiro se NÃO houver colisão
    return !collision;
}

// Função simplificada para resetar o player
export function resetPlayer() {
    console.log("Função resetPlayer chamada");
    
    if (G.startPosition) {
        G.player.setPosition(G.startPosition.x, G.startPosition.y);
    } else {
        G.player.setPosition(400, 200);
    }
    
    // Reseta flags
    G.wasInDialog = false;
    G.actionSequence = [];
    G.isProgramming = true;
    G.currentActionIndex = 0;
    G.isMoving = false;
    G.podeResetar = false;
    G.dialogCooldown = 0;
    
    // Atualiza a HUD
    if (G.hudActionsText) {
        G.hudActionsText.setText('');
    }
    
    if (G.resetText) {
        G.resetText.setVisible(false);
    }
}
