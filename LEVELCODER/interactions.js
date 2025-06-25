import { G } from './globals.js';

export function showNpcInteractionText() {
    if (G.npcInteractionText && G.npc) {
        G.npcInteractionText.setText('Pressione E para conversar.');
        G.npcInteractionText.setPosition(G.npc.x - 135, G.npc.y - 100);
        G.npcInteractionText.setVisible(true);
    }
}

export function checkDoorInput() {
    if (G.keyE.isDown && G.canEnterDoor) {
        goToStreet();
    }
}

function goToStreet() {
    alert("Indo para a rua!");
}

export function startDialogWithText(text, x, y) {
    G.inDialog = true;
    if (G.player) {
        G.player.setVelocity(0);
        G.player.anims.stop();
    }
    if (G.npcInteractionText) G.npcInteractionText.setVisible(false);
    if (G.assistenteNpcInteractionText) G.assistenteNpcInteractionText.setVisible(false);

    G.dialogText.setText(text);
    
    // Use as coordenadas x, y que foram PASSADAS para a função
    G.dialogText.setPosition(
        x - G.dialogText.width / 2,
        y - 430
    );
    
    G.dialogText.setVisible(true);
    G.dialogActive = true;
}
