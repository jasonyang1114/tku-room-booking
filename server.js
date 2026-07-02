const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
// 配合雲端部署修改的 Port 設定
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'bookings.json');

app.use(express.urlencoded({ extended: true }));

// 預設路由：直接開啟網頁
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 【新增的功能】提供給前端讀取預約資料的 API
app.get('/api/bookings', (req, res) => {
    if (fs.existsSync(DATA_FILE)) {
        try {
            const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
            // 將檔案內容回傳給網頁
            res.json(JSON.parse(fileContent));
        } catch (error) {
            res.status(500).json({ error: "讀取紀錄失敗" });
        }
    } else {
        // 如果檔案還不存在，回傳空陣列
        res.json([]);
    }
});

// 接收表單資料的 API
app.post('/api/booking', (req, res) => {
    const { room, date, time, meeting_name, host, attendees, department, contact_person, extension } = req.body;

    const newBooking = {
        id: Date.now(),
        room,
        date,
        time,
        meeting_name,
        host,
        attendees: parseInt(attendees, 10),
        department,
        contact_person,
        extension,
        created_at: new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
    };

    let bookings = [];
    if (fs.existsSync(DATA_FILE)) {
        try {
            const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
            bookings = JSON.parse(fileContent);
        } catch (error) {
            bookings = [];
        }
    }

    bookings.push(newBooking);

    fs.writeFile(DATA_FILE, JSON.stringify(bookings, null, 4), 'utf-8', (err) => {
        if (err) {
            return res.status(500).send("<h1>系統錯誤，登記失敗。</h1>");
        }
        
        res.send(`
            <div style="text-align: center; margin-top: 100px; font-family: 'Microsoft JhengHei', sans-serif;">
                <h1 style="color: #2ecc71;">🎉 登記成功！</h1>
                <p style="font-size: 1.2em; color: #555;">您已成功登記 ${room} 會議室 (${date} ${time})。</p>
                <p style="color: #999;">網頁將在 3 秒後自動返回...</p>
                <script>
                    setTimeout(() => { window.location.href = '/'; }, 3000);
                </script>
            </div>
        `);
    });
});

app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(` 系統後端已成功啟動！(Port: ${PORT})`);
    console.log(` 請在瀏覽器輸入網址： http://localhost:${PORT}`);
    console.log(`==================================================`);
});