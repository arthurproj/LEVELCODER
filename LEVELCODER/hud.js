import { G } from './globals.js';

export class HudScene extends Phaser.Scene {
    constructor() {
        super({ key: 'HudScene', active: true });
    }
    preload() {
        this.load.image('bg_sistema', 'assets/PNG/Tiles/bg_sistema.png');
        this.load.image('cpu', 'assets/PNG/Items/cpu.png');
        this.load.image('ram', 'assets/PNG/Items/ram.png');
        this.load.image('hdd', 'assets/PNG/Items/hdd.png'); // Adicione esta linha
    }
    create() {
        this.add.image(980, 0, 'bg_sistema')
            .setOrigin(0, 0)
            .setDisplaySize(G.gameWidth - 980, G.gameHeight)
            .setScrollFactor(0)
            .setDepth(0);

        // Adicione após a definição da CPU
        G.cpu = this.add.image(1125, 125, 'cpu');
        G.cpu.setDisplaySize(150, 150);
        
        // Referência para o HDD (inicialmente invisível)
        G.hdd = this.add.image(1165, 300, 'hdd'); // 300 é abaixo da CPU
        G.hdd.setDisplaySize(250, 250); 
        G.hdd.setVisible(false); // Inicialmente invisível

        this.add.text(1150, 4, '== SEU SISTEMA ==', {
            fontSize: '28px',
            fill: '#fff',
            fontFamily: 'VT323'
        });

        // Texto de reset
        G.resetText = this.add.text(
            1085, 640,
            'Pressione R para resetar',
            { fontSize: '32px', fill: '#fff', fontFamily: 'VT323' }
        ).setDepth(2);
        G.resetText.setVisible(false);

        // Sistema de abas/menu
        const menuX = 1060;
        const menuY = 450;
        G.menuContainer = this.add.container(menuX, menuY);

        const tabNames = ['Movimentação', 'Funções', 'Memória'];
        const tabTextOffsets = [
            { x: 8, y: 8 },  // Movimentação
            { x: 30, y: 8 }, // Funções
            { x: 31, y: 8 }  // Memória
        ];

        G.tabs = [];
        G.tabBgGraphics = [];
        G.tabTexts = [];

        tabNames.forEach((name, i) => {
            // Fundo da aba
            const tabBgGraphics = this.add.graphics();
            tabBgGraphics.fillStyle(0x333366, 1);
            tabBgGraphics.fillRoundedRect(i * 120, 0, 120, 40, 12);
            tabBgGraphics.lineStyle(2, 0xffffff, 0.7);
            tabBgGraphics.strokeRoundedRect(i * 120, 0, 120, 40, 12);

            // Texto da aba com deslocamento individual
            const offset = tabTextOffsets[i];
            const tabText = this.add.text(i * 120 + offset.x, offset.y, name, {
                fontSize: '22px',
                fill: '#fff',
                fontFamily: 'VT323'
            });

            // Zona interativa
            const tabZone = this.add.zone(i * 120, 0, 120, 40)
                .setOrigin(0, 0)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => selectTab(i));

            G.menuContainer.add([tabBgGraphics, tabText, tabZone]);
            G.tabs.push(tabZone);
            G.tabBgGraphics.push(tabBgGraphics);
            G.tabTexts.push(tabText);
        });

        G.tabContainers = [
            this.add.container(0, 50), // Movimentação
            this.add.container(0, 50), // Funções
            this.add.container(0, 50)  // Memória
        ];

        // Conteúdo das abas
        //G.moveListText = this.add.text(0, 0, 'Movimentos disponíveis\n', { fontSize: '28px', fill: '#fff', fontFamily: 'VT323' });
        //G.tabContainers[0].add(G.moveListText);

        G.functionListText = this.add.text(0, 0, 'Funções indisponíveis.\nInstale o HDD primeiro.', { 
            fontSize: '28px', 
            fill: '#fff', 
            fontFamily: 'VT323',
            wordWrap: { width: 350 }
        });
        G.tabContainers[1].add(G.functionListText);

        G.memoryText = this.add.text(0, 0, 'Memória indisponível.\n', { 
            fontSize: '28px', 
            fill: '#fff', 
            fontFamily: 'VT323', 
            wordWrap: { width: 350 }, // Aumentado de 250 para 350
            fixedWidth: 350           // Define uma largura fixa maior
        });
        G.tabContainers[2].add(G.memoryText);

        G.tabContainers.forEach((cont, i) => {
            G.menuContainer.add(cont);
            cont.setVisible(i === 0);
        });

        // Função para selecionar a aba
        function selectTab(tabIndex) {
            G.tabContainers.forEach((cont, i) => cont.setVisible(i === tabIndex));
            G.tabBgGraphics.forEach((bg, i) => {
                bg.clear();
                if (i === tabIndex) {
                    bg.fillStyle(0x66aaff, 1); // azul clara
                } else {
                    bg.fillStyle(0x333366, 1); // azul escuro
                }
                bg.fillRoundedRect(i * 120, 0, 120, 40, 12);
                bg.lineStyle(2, 0xffffff, 0.7);
                bg.strokeRoundedRect(i * 120, 0, 120, 40, 12);
            });
            // Reposicione os textos das abas
            G.tabTexts.forEach((tabText, i) => {
                const offset = tabTextOffsets[i];
                tabText.setPosition(i * 120 + offset.x, offset.y);
            });
        }

        this.input.keyboard.on('keydown-R', () => {
            if (G.podeResetar) {
                // Chame a função de reset global ou envie um evento
                if (this.scene.get('LabScene') && this.scene.isActive('LabScene')) {
                    this.scene.get('LabScene').events.emit('resetLab');
                }
                
                // ADICIONE ESTE TRECHO: Suporte para reset na Fase 3
                if (this.scene.get('Fase3Scene') && this.scene.isActive('Fase3Scene')) {
                    // Implementação do reset para a Fase 3
                    const fase3 = this.scene.get('Fase3Scene');
                    fase3.events.emit('resetFase3');
                    
                    // Ou chame diretamente o método resetPlayer da Fase 3 se existir
                    if (typeof fase3.resetPlayer === 'function') {
                        fase3.resetPlayer();
                    }
                }
            }
        });

        // Ouvinte para atualizar a HUD quando solicitado
        this.events.on('updateHUD', () => {
            console.log("Atualizando HUD, passwordFound:", G.passwordFound);
            
            // Atualiza o texto da memória se tiver o upgrade
            if (G.hasMemoryUpgrade && G.memoryText) {
                // Verifica explicitamente se a senha foi encontrada
                if (G.passwordFound === true) {
                    console.log("Senha encontrada, atualizando memoryText");
                    G.memoryText.setText("Sua Memória:\nconst senha = 1234;");
                } else {
                    console.log("Senha não encontrada, memória vazia");
                    G.memoryText.setText("Sua Memória:\n(vazia)");
                }
            }
            
            // Garante que o ícone da RAM esteja visível se o jogador tiver o upgrade
            if (G.hasMemoryUpgrade && !G.memoryIcon) {
                G.memoryIcon = this.add.image(1310, 125, 'ram').setScale(0.5);
            }
            
            // Atualiza a lista de ações
            if (G.hudActionsText) {
                G.hudActionsText.setText(G.actionSequence.join('\n'));
            }
        });

        this.events.on('showMemoryIcon', () => {
            if (!G.memoryIcon) {
                G.memoryIcon = this.add.image(1310, 125, 'ram').setScale(0.5);
            }
        });

        // Adicione este evento para garantir que a HUD seja atualizada quando a Fase 3 for iniciada
        this.events.on('reinitializeHUD', () => {
            console.log("Reinicializando HUD para Fase 3");
            this.forceMemoryUpdate();
        });

        // 4. Adicione o evento para mostrar o HDD
        this.events.on('showHDD', () => {
            console.log("Mostrando HDD na interface");
            
            if (G.hdd) {
                G.hdd.setVisible(true);
                
                // Efeito de fade in para o HDD
                G.hdd.setAlpha(0);
                this.tweens.add({
                    targets: G.hdd,
                    alpha: 1,
                    duration: 1000,
                    ease: 'Power2'
                });
                
                // Atualiza o texto da aba de Funções
                if (G.functionListText) {
                    G.functionListText.setText('Funções disponíveis:\n(Nenhuma função instalada)');
                }
            }
        });
        
        // 5. Adicione um evento para adicionar funções ao HDD
        this.events.on('addFunction', (functionName) => {
            console.log(`Adicionando função ${functionName} ao HDD`);
            
            if (!G.playerFunctions) {
                G.playerFunctions = [];
            }
            
            // Adiciona a função se ela não existir ainda
            if (!G.playerFunctions.includes(functionName)) {
                G.playerFunctions.push(functionName);
            }
            
            // Atualiza o texto da aba de Funções
            if (G.functionListText) {
                if (G.playerFunctions.length > 0) {
                    const functionsList = G.playerFunctions.join('\n');
                    G.functionListText.setText(`Funções disponíveis:\n${functionsList}`);
                } else {
                    G.functionListText.setText('Funções disponíveis:\n(Nenhuma função instalada)');
                }
            }
        });
    }
    update() {
        // Atualize a HUD conforme o progresso do jogo
        // Em vez disso:
        if (G.hudActionsText) {
            G.hudActionsText.setText(G.actionSequence.join('\n'));
            G.hudActionsText.setStyle(G.hudActionsStyle);
        }
        
        // Use isto:
        if (G.hudFunctionsText) {
            G.hudFunctionsText.setText(G.functionSequence.join('\n'));
            G.hudFunctionsText.setStyle(G.hudFunctionsStyle);
        }

        // Limpa as imagens antigas das setas, se existirem
        if (!G.moveListImages) G.moveListImages = [];
        G.moveListImages.forEach(img => img.destroy());
        G.moveListImages = [];

        // Mapeamento das ações para as imagens
        const setaKeys = {
            '↑': 'seta_cima',
            '↓': 'seta_baixo',
            '←': 'seta_esquerda',
            '→': 'seta_direita'
        };

        // Desenha as setas na HUD
        const setasPorLinha = 5;
        const espacamentoX = 40; // ajuste conforme o tamanho da seta
        const espacamentoY = 50; // ajuste conforme o tamanho da seta
        const inicioX = 5;      // posição inicial X
        const inicioY = 20;      // posição inicial Y

        G.actionSequence.forEach((acao, i) => {
            const key = setaKeys[acao];
            if (key) {
                const linha = Math.floor(i / setasPorLinha);
                const coluna = i % setasPorLinha;
                const x = inicioX + coluna * espacamentoX;
                const y = inicioY + linha * espacamentoY;
                const img = this.add.image(x, y, key)
                    .setOrigin(0, 0)
                    .setScale(0.3);
                G.tabContainers[0].add(img);
                G.moveListImages.push(img);
            }
        });

        // Adicione a imagem de referência das setas ao lado das setas clicadas
        const setasSetX = 10 + 5 * 40 + 30; // posição X ao lado das 5 primeiras setas (ajuste conforme necessário)
        const setasSetY = 20;                // mesma altura da primeira linha de setas

        // Antes de adicionar, destrua a imagem anterior se existir
        if (G.setasSetImage) {
            G.setasSetImage.destroy();
        }

        // Adicione a imagem de referência
        G.setasSetImage = this.add.image(setasSetX, setasSetY, 'seta_set')
            .setOrigin(0, 0)
            .setScale(0.3); // ajuste o scale conforme necessário

        // Se quiser adicionar ao container da aba Movimentação:
        G.tabContainers[0].add(G.setasSetImage);

        // Exemplo: dentro do update() da HudScene OU no update da fase Lab

        if (G.podeResetar && G.resetText) {
            G.resetText.setVisible(true);
        } else if (G.resetText) {
            G.resetText.setVisible(false);
        }
    }

    // Adicione este método explícito para atualizar a RAM
    forceMemoryUpdate() {
        console.log("Forçando atualização da memória - hasMemoryUpgrade:", G.hasMemoryUpgrade);
        
        if (G.hasMemoryUpgrade) {
            // Cria o ícone da RAM se não existir
            if (!G.memoryIcon) {
                G.memoryIcon = this.add.image(1310, 125, 'ram').setScale(0.5);
                G.memoryIcon.setVisible(true);
                console.log("Ícone da RAM criado");
            } else {
                G.memoryIcon.setPosition(1310, 125);
                G.memoryIcon.setScale(0.5);
                G.memoryIcon.setVisible(true);
                console.log("Ícone da RAM já existe, tornando visível");
            }
            
            // Atualiza o texto da memória
            if (G.memoryText) {
                if (G.passwordFound) {
                    G.memoryText.setText("Sua Memória:\nconst senha = 1234;");
                } else {
                    G.memoryText.setText("Sua Memória:\n(vazia)");
                }
                console.log("Texto da memória atualizado");
            }
        }
    }
}