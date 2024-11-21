class DungeonGenerator {
    constructor(size, difficulty, theme, treasureGoal) {
        this.size = size;
        this.difficulty = difficulty;
        this.theme = theme;
        this.treasureGoal = treasureGoal;
        this.rooms = [];
        this.gridSize = {
            small: { width: 3, height: 2 },
            medium: { width: 3, height: 3 },
            large: { width: 4, height: 3 }
        }[size];
        this.initialize();
    }

    initialize() {
        const roomCounts = {
            small: this.getRandomInt(4, 6),
            medium: this.getRandomInt(7, 9),
            large: this.getRandomInt(10, 12)
        };

        const numRooms = roomCounts[this.size];
        this.generateRooms(numRooms);
    }

    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    generateRooms(numRooms) {
        const themeDescriptions = {
            ancient: [
                "Crumbling stone pillars line the walls",
                "Ancient hieroglyphs cover the floor",
                "A broken statue stands in the corner",
                "Weathered stone archways frame the exits",
                "Dust-covered artifacts litter the ground"
            ],
            caves: [
                "Stalactites hang from the ceiling",
                "A underground stream flows through",
                "Glowing mushrooms provide dim light",
                "Crystal formations sparkle in the darkness",
                "The rough cave walls glisten with moisture"
            ],
            wizard: [
                "Magical runes float in the air",
                "Bubbling potions line the shelves",
                "A magical circle is etched on the floor",
                "Arcane devices hum with energy",
                "Spell books float on invisible pedestals"
            ]
        };

        const trapTypes = ["Spike Pit", "Poison Gas", "Arrow Trap"];
        const monsterTypes = ["Goblin", "Skeleton", "Dark Ooze", "Giant Rat"];

        // Create grid positions
        const positions = [];
        for (let y = 0; y < this.gridSize.height; y++) {
            for (let x = 0; x < this.gridSize.width; x++) {
                positions.push({ x, y });
            }
        }

        // Shuffle positions
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        // Generate rooms
        for (let i = 0; i < numRooms; i++) {
            const room = {
                id: i,
                description: themeDescriptions[this.theme][this.getRandomInt(0, 4)],
                hasMonster: this.shouldHaveMonster(),
                hasTreasure: this.shouldHaveTreasure(),
                hasTrap: this.shouldHaveTrap(),
                connections: [],
                position: positions[i]
            };

            if (room.hasMonster) {
                room.monster = monsterTypes[this.getRandomInt(0, monsterTypes.length - 1)];
            }
            if (room.hasTrap) {
                room.trap = trapTypes[this.getRandomInt(0, trapTypes.length - 1)];
            }

            this.rooms.push(room);
        }

        this.connectRooms();
    }

    shouldHaveMonster() {
        const chances = {
            easy: 0.3,
            normal: 0.5,
            hard: 0.7
        };
        return Math.random() < chances[this.difficulty];
    }

    shouldHaveTreasure() {
        const treasureCount = {
            low: 2,
            medium: 3,
            high: 4
        }[this.treasureGoal];

        return this.rooms.filter(r => r.hasTreasure).length < treasureCount &&
               Math.random() < 0.3;
    }

    shouldHaveTrap() {
        const chances = {
            easy: 0.2,
            normal: 0.4,
            hard: 0.6
        };
        return Math.random() < chances[this.difficulty];
    }

    connectRooms() {
        // Connect adjacent rooms
        this.rooms.forEach((room1, i) => {
            this.rooms.forEach((room2, j) => {
                if (i !== j) {
                    const dx = Math.abs(room1.position.x - room2.position.x);
                    const dy = Math.abs(room1.position.y - room2.position.y);
                    if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
                        if (!room1.connections.includes(room2.id)) {
                            room1.connections.push(room2.id);
                            room2.connections.push(room1.id);
                        }
                    }
                }
            });
        });

        // Add some random connections for more interesting layouts
        const extraConnections = Math.floor(this.rooms.length * 0.2);
        for (let i = 0; i < extraConnections; i++) {
            const room1 = this.getRandomInt(0, this.rooms.length - 1);
            const room2 = this.getRandomInt(0, this.rooms.length - 1);

            if (room1 !== room2 && !this.rooms[room1].connections.includes(room2)) {
                this.rooms[room1].connections.push(room2);
                this.rooms[room2].connections.push(room1);
            }
        }
    }
}

class GameRenderer {
    constructor(dungeon) {
        this.dungeon = dungeon;
        this.roomSize = 100;
        this.padding = 50;
        this.corridorWidth = 20;
    }

    renderDungeon() {
        const container = document.getElementById('dungeonContainer');
        container.innerHTML = '';

        const canvas = document.createElement('canvas');
        const width = (this.dungeon.gridSize.width * this.roomSize) + (this.padding * 2);
        const height = (this.dungeon.gridSize.height * this.roomSize) + (this.padding * 2);
        canvas.width = width;
        canvas.height = height;
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw corridors
        ctx.strokeStyle = '#666';
        ctx.lineWidth = this.corridorWidth;
        this.dungeon.rooms.forEach(room => {
            const pos1 = this.getRoomCenter(room);
            room.connections.forEach(connectedId => {
                const connectedRoom = this.dungeon.rooms.find(r => r.id === connectedId);
                const pos2 = this.getRoomCenter(connectedRoom);
                ctx.beginPath();
                ctx.moveTo(pos1.x, pos1.y);
                ctx.lineTo(pos2.x, pos2.y);
                ctx.stroke();
            });
        });

        // Draw rooms
        this.dungeon.rooms.forEach(room => {
            const x = this.padding + (room.position.x * this.roomSize);
            const y = this.padding + (room.position.y * this.roomSize);

            // Room rectangle
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.fillRect(x, y, this.roomSize, this.roomSize);
            ctx.strokeRect(x, y, this.roomSize, this.roomSize);

            // Room number
            ctx.fillStyle = '#000';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(room.id + 1, x + this.roomSize/2, y + this.roomSize/2);

            // Icons for room contents
            const iconSize = 20;
            if (room.hasMonster) this.drawIcon(ctx, '👾', x + iconSize, y + iconSize);
            if (room.hasTreasure) this.drawIcon(ctx, '💎', x + this.roomSize - iconSize, y + iconSize);
            if (room.hasTrap) this.drawIcon(ctx, '⚠️', x + this.roomSize/2, y + this.roomSize - iconSize);
        });

        // Store dungeon for PDF generation
        window.currentDungeon = this.dungeon;
    }

    getRoomCenter(room) {
        return {
            x: this.padding + (room.position.x * this.roomSize) + (this.roomSize/2),
            y: this.padding + (room.position.y * this.roomSize) + (this.roomSize/2)
        };
    }

    drawIcon(ctx, icon, x, y) {
        ctx.font = '20px Arial';
        ctx.fillText(icon, x, y);
    }

    renderGamePieces() {
        const container = document.getElementById('tokenContainer');
        container.innerHTML = '';

        // Hero token
        this.createToken('🦸‍♂️', 'Hero');

        // Monster tokens
        const monsters = new Set(this.dungeon.rooms
            .filter(r => r.hasMonster)
            .map(r => r.monster));

        monsters.forEach(monster => this.createToken('👾', monster));

        // Treasure tokens
        const treasureCount = this.dungeon.rooms.filter(r => r.hasTreasure).length;
        for (let i = 0; i < treasureCount; i++) {
            this.createToken('💎', 'Treasure');
        }

        // Trap tokens
        const traps = new Set(this.dungeon.rooms
            .filter(r => r.hasTrap)
            .map(r => r.trap));

        traps.forEach(trap => this.createToken('⚠️', trap));
    }

    createToken(emoji, label) {
        const token = document.createElement('div');
        token.style.cssText = `
            width: 80px;
            height: 80px;
            border: 2px solid #000;
            border-radius: 50%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: white;
            margin: 10px;
            font-size: 24px;
        `;

        const icon = document.createElement('div');
        icon.textContent = emoji;

        const text = document.createElement('div');
        text.textContent = label;
        text.style.fontSize = '12px';
        text.style.marginTop = '5px';

        token.appendChild(icon);
        token.appendChild(text);
        document.getElementById('tokenContainer').appendChild(token);
    }

    renderRoomCards() {
        const container = document.getElementById('cardContainer');
        container.innerHTML = '';

        this.dungeon.rooms.forEach(room => {
            const card = document.createElement('div');
            card.style.cssText = `
                border: 1px solid #000;
                padding: 15px;
                margin: 10px;
                background: white;
                min-height: 150px;
            `;

            const title = document.createElement('h3');
            title.textContent = `Room ${room.id + 1}`;

            const description = document.createElement('p');
            description.textContent = room.description;

            const contents = document.createElement('ul');
            if (room.hasMonster) {
                const li = document.createElement('li');
                li.textContent = `Monster: ${room.monster}`;
                contents.appendChild(li);
            }
            if (room.hasTrap) {
                const li = document.createElement('li');
                li.textContent = `Trap: ${room.trap}`;
                contents.appendChild(li);
            }
            if (room.hasTreasure) {
                const li = document.createElement('li');
                li.textContent = 'Contains Treasure!';
                contents.appendChild(li);
            }

            card.appendChild(title);
            card.appendChild(description);
            card.appendChild(contents);
            container.appendChild(card);
        });
    }

    generatePDF() {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'pt', 'a4');
        const margin = 40;
        let yOffset = margin;

        // Add dungeon map
        const dungeonCanvas = document.querySelector('#dungeonContainer canvas');
        const dungeonImage = dungeonCanvas.toDataURL('image/jpeg', 1.0);
        const imgWidth = 515; // A4 width - margins
        const imgHeight = (dungeonCanvas.height * imgWidth) / dungeonCanvas.width;

        pdf.text('Dungeon Map', margin, yOffset);
        yOffset += 20;
        pdf.addImage(dungeonImage, 'JPEG', margin, yOffset, imgWidth, imgHeight);
        yOffset += imgHeight + 30;

        // Add room cards
        pdf.addPage();
        yOffset = margin;
        pdf.text('Room Cards', margin, yOffset);
        yOffset += 30;

        this.dungeon.rooms.forEach((room, index) => {
            if (yOffset > 750) { // Check if we need a new page
                pdf.addPage();
                yOffset = margin;
            }

            pdf.text(`Room ${room.id + 1}`, margin, yOffset);
            yOffset += 20;
            pdf.text(room.description, margin, yOffset);
            yOffset += 20;

            if (room.hasMonster) {
                pdf.text(`Monster: ${room.monster}`, margin, yOffset);
                yOffset += 20;
            }
            if (room.hasTrap) {
                pdf.text(`Trap: ${room.trap}`, margin, yOffset);
                yOffset += 20;
            }
            if (room.hasTreasure) {
                pdf.text('Contains Treasure!', margin, yOffset);
                yOffset += 20;
            }

            yOffset += 20; // Space between cards
        });

        // Add game pieces page
        pdf.addPage();
        pdf.text('Game Pieces', margin, margin);

        // Save the PDF
        pdf.save('dungeon-game.pdf');
    }
}

// Form handling
document.getElementById('gameForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const size = document.getElementById('size').value;
    const difficulty = document.getElementById('difficulty').value;
    const theme = document.getElementById('theme').value;
    const treasureGoal = document.getElementById('treasure').value;

    const dungeon = new DungeonGenerator(size, difficulty, theme, treasureGoal);
    const renderer = new GameRenderer(dungeon);

    document.getElementById('gameOutput').classList.remove('hidden');

    renderer.renderDungeon();
    renderer.renderGamePieces();
    renderer.renderRoomCards();
});

// PDF generation
document.getElementById('printButton').addEventListener('click', function() {
    const renderer = new GameRenderer(window.currentDungeon);
    renderer.generatePDF();
});
