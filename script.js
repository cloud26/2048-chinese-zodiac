class Game2048 {
    constructor() {
        this.grid = Array(16).fill(0);
        this.score = 0;
        this.gridElement = document.querySelector('.grid');
        this.scoreElement = document.getElementById('score');
        this.modal = document.getElementById('game-over-modal');
        this.finalScoreElement = document.querySelector('.final-score');
        this.maxValue = 0;
        this.positions = new Map(); // 存储方块位置

        // 将事件监听器绑定移到构造函数中，只执行一次
        this.boundHandleKeyPress = this.handleKeyPress.bind(this);
        document.addEventListener('keydown', this.boundHandleKeyPress);

        // 添加触摸事件监听
        this.touchStartX = null;
        this.touchStartY = null;
        this.gridElement.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.gridElement.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.gridElement.addEventListener('touchend', this.handleTouchEnd.bind(this));

        this.init();
        this.loadLeaderboard();
    }

    init() {
        this.hideGameOver();
        // 创建网格单元格
        this.gridElement.innerHTML = '';
        for (let i = 0; i < 16; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            this.gridElement.appendChild(cell);
        }

        // 初始化游戏
        this.grid = Array(16).fill(0);
        this.score = 0;
        this.scoreElement.textContent = '0';
        this.maxValue = 0;
        this.addNewNumber();
        this.addNewNumber();
        this.updateDisplay();
    }

    addNewNumber() {
        const emptyCells = this.grid.reduce((acc, curr, idx) => {
            if (curr === 0) acc.push(idx);
            return acc;
        }, []);

        if (emptyCells.length > 0) {
            const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            this.grid[randomCell] = Math.random() < 0.7 ? 2 : 4;

            // 添加新方块动画
            requestAnimationFrame(() => {
                const cells = document.querySelectorAll('.cell');
                cells[randomCell].classList.add('new');
            });
        }
    }

    updateDisplay() {
        const cells = document.querySelectorAll('.cell');
        const oldPositions = new Map(this.positions);
        this.positions.clear();

        this.grid.forEach((value, index) => {
            let zodiac = '';
            switch (value) {
                case 2: zodiac = '🐭'; break;     // 鼠
                case 4: zodiac = '🐮'; break;     // 牛
                case 8: zodiac = '🐯'; break;     // 虎
                case 16: zodiac = '🐰'; break;    // 兔
                case 32: zodiac = '🐲'; break;    // 龙
                case 64: zodiac = '🐍'; break;    // 蛇
                case 128: zodiac = '🐎'; break;   // 马
                case 256: zodiac = '🐑'; break;   // 羊
                case 512: zodiac = '🐒'; break;   // 猴
                case 1024: zodiac = '🐔'; break;  // 鸡
                case 2048: zodiac = '🐕'; break;  // 狗
                case 4096: zodiac = '🐷'; break;  // 猪
                default: zodiac = '';
            }
            cells[index].textContent = zodiac;
            cells[index].setAttribute('data-value', value);

            if (value !== 0) {
                // 存储新位置
                this.positions.set(value + '-' + this.getTileId(index), index);
            }

            // 移除旧的动画类
            cells[index].classList.remove('new', 'merged');
        });

        // 添加移动动画
        this.positions.forEach((newPos, tileId) => {
            const oldPos = oldPositions.get(tileId);
            if (oldPos !== undefined && oldPos !== newPos) {
                const cell = cells[newPos];
                const x = (newPos % 4 - oldPos % 4) * (cell.offsetWidth + 10); // 10是grid-gap
                const y = (Math.floor(newPos / 4) - Math.floor(oldPos / 4)) * (cell.offsetHeight + 10);

                cell.style.transform = `translate(${-x}px, ${-y}px)`;
                requestAnimationFrame(() => {
                    cell.style.transform = 'translate(0, 0)';
                });
            }
        });

        this.scoreElement.textContent = this.score;
    }

    // 生成唯一的方块ID
    getTileId(index) {
        return Date.now() + '-' + index;
    }

    move(direction) {
        let moved = false;
        const oldGrid = [...this.grid];

        // 将网格转换为2D数组便于处理
        let rows = [];
        for (let i = 0; i < 4; i++) {
            rows.push(this.grid.slice(i * 4, (i + 1) * 4));
        }

        // 根据方向处理移动
        if (direction === 'ArrowLeft' || direction === 'ArrowRight') {
            rows = rows.map(row => this.processLine(row, direction === 'ArrowLeft'));
        } else {
            // 转置矩阵
            let cols = rows[0].map((_, i) => rows.map(row => row[i]));
            cols = cols.map(col => this.processLine(col, direction === 'ArrowUp'));
            rows = cols[0].map((_, i) => cols.map(col => col[i]));
        }

        // 将2D数组转回1D
        this.grid = rows.flat();

        // 检查是否有移动
        moved = !this.grid.every((value, index) => value === oldGrid[index]);

        if (moved) {
            this.addNewNumber();
            this.updateDisplay();
        }

        // 检查游戏是否结束
        if (this.isGameOver()) {
            this.updateLeaderboard(this.score);
            this.showGameOver();
        }
    }

    processLine(line, leftDirection) {
        let numbers = line.filter(x => x !== 0);
        let merged = false;

        if (leftDirection) {
            for (let i = 0; i < numbers.length - 1; i++) {
                if (numbers[i] === numbers[i + 1]) {
                    numbers[i] *= 2;
                    this.score += numbers[i];
                    this.maxValue = Math.max(this.maxValue, numbers[i]);
                    numbers.splice(i + 1, 1);
                    merged = true;
                }
            }
        } else {
            for (let i = numbers.length - 1; i > 0; i--) {
                if (numbers[i] === numbers[i - 1]) {
                    numbers[i] *= 2;
                    this.score += numbers[i];
                    this.maxValue = Math.max(this.maxValue, numbers[i]);
                    numbers.splice(i - 1, 1);
                    merged = true;
                }
            }
        }

        // 补充零
        while (numbers.length < 4) {
            leftDirection ? numbers.push(0) : numbers.unshift(0);
        }

        // 如果发生了合并，添加合并动画
        if (merged) {
            requestAnimationFrame(() => {
                const cells = document.querySelectorAll('.cell');
                numbers.forEach((num, idx) => {
                    if (num !== 0) {
                        cells[leftDirection ? idx : 3 - idx].classList.add('merged');
                    }
                });
            });
        }

        return numbers;
    }

    handleKeyPress(event) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            event.preventDefault();
            this.move(event.key);
        }
    }

    isGameOver() {
        // 检查是否还有空格
        if (this.grid.includes(0)) return false;

        // 检查是否还有可以合并的相邻数字
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const current = this.grid[i * 4 + j];
                if (
                    (j < 3 && current === this.grid[i * 4 + j + 1]) || // 检查右侧
                    (i < 3 && current === this.grid[(i + 1) * 4 + j])  // 检查下方
                ) {
                    return false;
                }
            }
        }
        return true;
    }

    // 添加新方法处理排行榜
    loadLeaderboard() {
        this.leaderboard = JSON.parse(localStorage.getItem('2048-leaderboard')) || [];
        this.updateLeaderboardDisplay();
    }

    updateLeaderboard(score) {
        const newScore = {
            score: score,
            date: new Date().toLocaleDateString()
        };

        this.leaderboard.push(newScore);
        this.leaderboard.sort((a, b) => b.score - a.score);
        this.leaderboard = this.leaderboard.slice(0, 10); // 只保留前10名

        localStorage.setItem('2048-leaderboard', JSON.stringify(this.leaderboard));
        this.updateLeaderboardDisplay(newScore);
    }

    updateLeaderboardDisplay(newScore = null) {
        const leaderboardElement = document.getElementById('leaderboard-list');
        leaderboardElement.innerHTML = '';

        this.leaderboard.forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            if (newScore && entry.score === newScore.score && entry.date === newScore.date) {
                item.className += ' new-score';
            }

            item.innerHTML = `
                <span>#${index + 1}. ${entry.score}分</span>
                <span>${entry.date}</span>
            `;
            leaderboardElement.appendChild(item);
        });
    }

    showGameOver() {
        this.finalScoreElement.textContent = this.score;
        const pigElement = document.querySelector('.pig');
        let zodiac = '';
        switch (this.maxValue) {
            case 2: zodiac = '🐭'; break;
            case 4: zodiac = '🐮'; break;
            case 8: zodiac = '🐯'; break;
            case 16: zodiac = '🐰'; break;
            case 32: zodiac = '🐲'; break;
            case 64: zodiac = '🐍'; break;
            case 128: zodiac = '🐎'; break;
            case 256: zodiac = '🐑'; break;
            case 512: zodiac = '🐒'; break;
            case 1024: zodiac = '🐔'; break;
            case 2048: zodiac = '🐕'; break;
            case 4096: zodiac = '🐷'; break;
            default: zodiac = '🐭';
        }
        pigElement.textContent = zodiac;
        this.modal.classList.add('show');
    }

    hideGameOver() {
        this.modal.classList.remove('show');
    }

    // 添加触摸事件处理方法
    handleTouchStart(event) {
        event.preventDefault();
        this.touchStartX = event.touches[0].clientX;
        this.touchStartY = event.touches[0].clientY;
    }

    handleTouchMove(event) {
        event.preventDefault();
    }

    handleTouchEnd(event) {
        if (!this.touchStartX || !this.touchStartY) return;

        const touchEndX = event.changedTouches[0].clientX;
        const touchEndY = event.changedTouches[0].clientY;

        const deltaX = touchEndX - this.touchStartX;
        const deltaY = touchEndY - this.touchStartY;

        // 最小滑动距离，防止误触
        const minSwipeDistance = 30;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // 水平滑动
            if (Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0) {
                    this.move('ArrowRight');
                } else {
                    this.move('ArrowLeft');
                }
            }
        } else {
            // 垂直滑动
            if (Math.abs(deltaY) > minSwipeDistance) {
                if (deltaY > 0) {
                    this.move('ArrowDown');
                } else {
                    this.move('ArrowUp');
                }
            }
        }

        // 重置触摸起始点
        this.touchStartX = null;
        this.touchStartY = null;
    }
}

// 初始化游戏
const game = new Game2048();

// 新游戏按钮
document.getElementById('new-game').addEventListener('click', () => {
    if (game.score > 0) {
        game.updateLeaderboard(game.score);
    }
    game.init();
});

// 添加重新开始按钮事件监听
document.getElementById('restart-game').addEventListener('click', () => {
    game.init();
}); 