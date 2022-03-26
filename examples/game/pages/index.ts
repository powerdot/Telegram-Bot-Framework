import { ComponentExport, MessageButtons, ButtonsRowButton } from "../../../lib/types";

const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // horizontals
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // verticals
    [0, 4, 8], [2, 4, 6] // diagonals
];

// Bot texts
const botInGameText = [
    "🤖 Oh, good choice!",
    "🤖 Hm, you're good!",
    "🤖 Who is going to win?",
    "🤖 Looks like you're PRO!",
    "🤖 You're good at this!",
    "🤖 Damn boiiii",
    "🤖 Look at this!",
    "🤖 Can you beat me?",
    "🤖 You're so good!"
];

// Randomly choose bot text
function randomBotInGameMessage() {
    return botInGameText[Math.floor(Math.random() * botInGameText.length)];
}

// Restart button
let restartGameButton: ButtonsRowButton = { text: "🔄 Restart game", action: "main" };

// Buttons field builder
function buildField(field) {
    let buttonsRows: MessageButtons = [];
    for (let i = 0; i < 3; i++) {
        let row = [];
        for (let j = 0; j < 3; j++) {
            let index = i * 3 + j;
            let current = field[index];
            let symbol = "⚪"
            if (current === 1) {
                symbol = "❌"
            } else if (current === 2) {
                symbol = "⚫"
            }
            let button = {
                text: symbol,
                action: `tap`,
                data: index
            }
            row.push(button);
        }
        buttonsRows.push(row);
    }
    buttonsRows.push([restartGameButton]);
    return buttonsRows;
}

// Bot move decision
function randomRobotMove(field) {
    let emptyFields = [];
    for (let i = 0; i < 9; i++) {
        if (field[i] === 0) emptyFields.push(i);
    }
    let randomIndex = Math.floor(Math.random() * emptyFields.length);
    let new_field = [...field];
    new_field[emptyFields[randomIndex]] = 2;
    return new_field;
}

// Detect winner
function checkWinner(field) {
    for (let i = 0; i < winningConditions.length; i++) {
        let [a, b, c] = winningConditions[i];
        if (field[a] !== 0 && field[a] === field[b] && field[a] === field[c]) {
            return field[a];
        }
    }
    return 0;
}

// Game page
let page: ComponentExport = ({ db, config, paginator }) => {
    return {
        id: "index",
        actions: {
            // Main action - start new game
            async main() {
                await this.clearChat();
                let field = [0, 0, 0, 0, 0, 0, 0, 0, 0];
                let user = this.user();
                await user.setValue("field", field);
                await user.setValue("game_status", true);
                this.send({
                    text: `🤖 Let's play Tic-Tac-Toe!`,
                    buttons: buildField(field)
                });
            },

            // Tap action - user tap on field
            async tap({ data }) {
                let pos = Number(data); // Get tapped field position
                let user = this.user(); // Get user DB instance
                let current_field = await user.getValue("field"); // Get state of field
                let game_status = await user.getValue("game_status"); // Get game status
                if (!game_status) // If game is over
                    return this.update({
                        text: "🤖 Game is over, boi!",
                        buttons: [[restartGameButton]]
                    });
                if (current_field[pos] != 0) return; // If field is not empty - nothing to do
                current_field[pos] = 1; // Set field state to "X" - user's move
                current_field = randomRobotMove(current_field); // Make bot move
                await user.setValue("field", current_field); // Save updated field state
                let winner = checkWinner(current_field); // Check for winner
                let noSpaceLeft = current_field.filter(e => e === 0).length === 0; // Check for no space left
                let text = randomBotInGameMessage(); // Choose random bot message
                if (winner || noSpaceLeft) { // Logic for game over
                    await user.setValue("game_status", false);
                    if (winner) {
                        if (winner === 1) {
                            text = "🤖 You won!";
                        } else {
                            text = "🤖 I won!";
                        }
                    } else {
                        text = "🤖 It's a draw!";
                    }
                }

                // Update game state
                this.update({
                    text,
                    buttons: buildField(current_field)
                })
            },
        }
    }
}

module.exports = page;