const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const GOOGLE_SCRIPT_URL = 'https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnTpqNa-_pcbUKzLfa_NL50f1oCLGhCJLWNAmfdAiQuTB0IpfinGpW4a6gsugLmnltF0XTgs7SvY1PmpTSzv0ictaVjzE4rMQfbPcRKTbuM0P9TAjIai6ZLJ8X_BvCY5DLk-zsD4HmV6LgoimkO_3Q2gzzbmc3WjFLrTNDLkBsmVtQeHPu204mif4lJW38X-LC2TNicQNcEweUk8xO-5V1AvUbuQ9L8tm0dpihVuSW-TD_KDK1HnvtkyWPVkHa5Kge2fLitsq7MxdcnLJApVBG2SAPTa4w&lib=MbbZK1kVED2LFyBoS8MslnqLeasDJayMR';

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/bookings', async (req, res) => {
    try {
        const response = await fetch(GOOGLE_SCRIPT_URL);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("無法從 Google 試算表讀取資料:", error);
        res.status(500).json({ error: "無法從試算表讀取資料" });
    }
});

app.post('/api/booking', async (req, res) => {
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

    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newBooking)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            res.send(`
                <div style="text-align: center; margin-top: 100px; font-family: 'Microsoft JhengHei', sans-serif;">
                    <h1 style="color: #2ecc71;">🎉 登記成功！</h1>
                    <p style="font-size: 1.2em; color: #555;">資料已成功同步至 Google 試算表。</p>
                    <p style="color: #999;">網頁將在 3 秒後自動返回...</p>
                    <script>
                        setTimeout(() => { window.location.href = '/'; }, 3000);
                    </script>
                </div>
            `);
        } else {
            throw new Error("Google Script 回傳狀態異常");
        }
    } catch (error) {
        console.error("無法寫入 Google 試算表:", error);
        res.status(500).send("<h1>系統錯誤，無法寫入 Google 試算表。</h1>");
    }
});

app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(` 系統後端已成功啟動並串接 Google 試算表！`);
    console.log(`==================================================`);
});
