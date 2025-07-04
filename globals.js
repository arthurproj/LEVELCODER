export const G = {
    debugMode: false, 
    player: null,
    lastDirection: 'down',
    cursors: null,
    npc: null,
    dialogText: null,
    inDialog: false,
    keyE: null,
    keyECooldown: 0, 
    npcInteractionText: null,
    doorInteractionText: null,
    door: null,
    canEnterDoor: false,
    cpu: null,
    gameWidth: 1500,
    gameHeight: 700,
    config: null,
    actionSequence: [],                
    maxActions: 5,                    
    isProgramming: true,               
    hudActionsText: null,              
    textStyle: { fontSize: '32px', fill: '#fff', fontFamily: "'VT323', monospace" },
    dialogCooldown: 0,
    podeResetar: false,
    dialogActive: false,
    hasMemoryUpgrade: false,
    assistenteNpcDialogShown: false,
    wasInDialog: false,
    passwordFound: false,
    passwordPoints: [],
    dialogContainer: null,
    dialogBg: null,
    dialogOkButton: null,
    dialogIndex: 0,
    dialogSequence: [],
    lastDialogSource: null, 
    isTransitioning: false, 
};

export function setupGlobals() {

}