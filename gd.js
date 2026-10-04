// ==========================================
// 1. TỰ ĐỘNG KHỞI TẠO GIAO DIỆN (HTML/CSS) BẰNG JS
// ==========================================

// Thiết lập CSS cho toàn bộ trang web trực tiếp từ JS
const style = document.createElement("style");
style.textContent = `
    body {
        margin: 0;
        background-color: #1a1a1a;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        overflow: hidden;
        font-family: Arial, sans-serif;
    }
    canvas {
        border: 4px solid #fff;
        box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
        background: linear-gradient(to bottom, #001f3f, #0074D9);
    }
`;
document.head.appendChild(style);

// Tạo thẻ Canvas và đưa vào trong Body
const canvas = document.createElement("canvas");
canvas.id = "gameCanvas";
canvas.width = 800;
canvas.height = 400;
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");

// ==========================================
// 2. CẤU HÌNH LOGIC VÀ THÔNG SỐ TRÒ CHƠI
// ==========================================
const GRAVITY = 0.6;
const JUMP_FORCE = -11;
const GROUND_Y = 320;
let gameSpeed = 5;
let score = 0;
let isGameOver = false;

// ĐỐI TƯỢNG NGƯỜI CHƠI (KHỐI LẬP PHƯƠNG)
const player = {
    x: 100,
    y: GROUND_Y - 40,
    size: 40,
    vy: 0,
    isGrounded: false,
    rotation: 0, // Góc xoay của khối vuông khi nhảy
    
    jump() {
        if (this.isGrounded) {
            this.vy = JUMP_FORCE;
            this.isGrounded = false;
        }
    },
    
    update() {
        // Áp dụng trọng lực rơi tự do
        this.vy += GRAVITY;
        this.y += this.vy;

        // Xử lý va chạm chuẩn xác với mặt đất
        if (this.y >= GROUND_Y - this.size) {
            this.y = GROUND_Y - this.size;
            this.vy = 0;
            this.isGrounded = true;
            
            // Tự động bo góc xoay về bội số của 90 độ gần nhất khi tiếp đất
            this.rotation = Math.round(this.rotation / 90) * 90;
        } else {
            // Xoay khối vuông liên tục khi đang bay trên không
            this.rotation += 4; 
        }
    },

    draw() {
        ctx.save();
        // Di chuyển hệ tọa độ đến tâm khối vuông để xoay mượt mà
        ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
        ctx.rotate((this.rotation * Math.PI) / 180);
        
        // Vẽ thân khối vuông màu vàng Neon
        ctx.fillStyle = "#FFDC00";
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        
        // Vẽ viền đen sắc nét xung quanh khối vuông
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        ctx.strokeRect(-this.size / 2, -this.size / 2, this.size, this.size);
        
        // Vẽ đôi mắt đen đặc trưng của Geometry Dash
        ctx.fillStyle = "#000";
        ctx.fillRect(-12, -12, 8, 8);
        ctx.fillRect(4, -12, 8, 8);
        
        ctx.restore();
    }
};

// ĐỐI TƯỢNG CHƯỚNG NGẠI VẬT (CÁC KHỐI GAI NHỌN)
let obstacles = [];
let spawnTimer = 0;

function spawnObstacle() {
    // Thời gian tối thiểu giữa các lần xuất hiện gai sẽ giảm dần khi game tăng tốc
    let minTime = Math.max(50, 120 - gameSpeed * 5); 
    if (spawnTimer <= 0) {
        obstacles.push({
            x: canvas.width,
            y: GROUND_Y,
            width: 30,
            height: 40
        });
        spawnTimer = minTime + Math.random() * 60; // Ngẫu nhiên khoảng cách tạo độ khó
    }
    spawnTimer--;
}

function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.x -= gameSpeed;

        // Thuật toán kiểm tra va chạm diện rộng (Khối vuông va chạm với khối gai tam giác)
        if (
            player.x < obs.x + obs.width &&
            player.x + player.size > obs.x &&
            player.y < obs.y &&
            player.y + player.size > obs.y - obs.height
        ) {
            isGameOver = true;
        }

        // Tự động xóa gai khi vượt ra khỏi màn hình để giải phóng RAM
        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
            score++;
            // Cứ mỗi 5 điểm, tốc độ game sẽ tăng thêm để tăng tính thử thách
            if (score % 5 === 0) gameSpeed += 0.5; 
        }
    }
}

function drawObstacles() {
    ctx.fillStyle = "#FF4136"; // Gai màu đỏ rực nguy hiểm
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;

    obstacles.forEach(obs => {
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y); // Điểm góc trái dưới
        ctx.lineTo(obs.x + obs.width / 2, obs.y - obs.height); // Đỉnh gai nhọn ở giữa
        ctx.lineTo(obs.x + obs.width, obs.y); // Điểm góc phải dưới
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    });
}

// VẼ MÔI TRƯỜNG NỀN & ĐIỂM SỐ
function drawEnvironment() {
    // Tô màu nền cho mặt đất phía dưới
    ctx.fillStyle = "#001f3f";
    ctx.fillRect(0, GROUND_Y, canvas.width, canvas.height - GROUND_Y);
    
    // Đường chạy Neon màu xanh lá
    ctx.strokeStyle = "#01FF70"; 
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(canvas.width, GROUND_Y);
    ctx.stroke();

    // Hiển thị điểm số hiện tại ở góc trái màn hình
    ctx.fillStyle = "#fff";
    ctx.font = "bold 24px Arial";
    ctx.fillText(`SCORE: ${score}`, 30, 40);
}

// ==========================================
// 3. HỆ THỐNG ĐIỀU KHIỂN & KHỞI CHẠY VÒNG LẶP GAME
// ==========================================

// Lắng nghe sự kiện phím Cách (Space) và Click chuột để nhảy hoặc chơi lại
window.addEventListener("keydown", (e) => {
    if (e.code === "Space") handleAction();
});
canvas.addEventListener("mousedown", handleAction);

function handleAction() {
    if (isGameOver) {
        resetGame();
    } else {
        player.jump();
    }
}

function resetGame() {
    obstacles = [];
    score = 0;
    gameSpeed = 5;
    player.y = GROUND_Y - player.size;
    player.vy = 0;
    player.rotation = 0;
    isGameOver = false;
    gameLoop();
}

// VÒNG LẶP CHÍNH CỦA GAME (GAME LOOP)
function gameLoop() {
    if (isGameOver) {
        // Phủ lớp màn hình tối khi thua cuộc
        ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = "#FF4136";
        ctx.font = "bold 48px Arial";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);
        
        ctx.fillStyle = "#fff";
        ctx.font = "20px Arial";
        ctx.fillText("Nhấn SPACE hoặc CLICK để chơi lại", canvas.width / 2, canvas.height / 2 + 30);
        ctx.textAlign = "left"; 
        return;
    }

    // Xóa khung hình cũ
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Cập nhật vị trí logic
    player.update();
    spawnObstacle();
    updateObstacles();

    // Render đồ họa mới lên màn hình
    drawEnvironment();
    player.draw();
    drawObstacles();

    // Đệ quy chạy mượt mà theo tần số quét màn hình (60fps+)
    requestAnimationFrame(gameLoop);
}

// Kích hoạt chạy game ngay khi file JS được tải xong
gameLoop();
