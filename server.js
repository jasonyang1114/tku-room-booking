const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyE_rPAb-9k0MXRGqrdzKhanAW6k7DXTB_lLLg4fUBVqXiQfQkJjDpkmFC78GxayQ9toA/exec';

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/bookings', async (req, res) => {
    try {
        const fetchUrl = GOOGLE_SCRIPT_URL + '?t=' + Date.now();
        const response = await fetch(fetchUrl, { cache: 'no-store' });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("讀取失敗:", error);
        res.status(500).json({ error: "無法從試算表讀取資料" });
    }
});

app.post('/api/booking', async (req, res) => {
    const { room, date, start_time, end_time, meeting_name, host, attendees, department, contact_person, extension } = req.body;

    const time = `${start_time}~${end_time}`;

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
        
        let result;
        try {
            result = await response.json();
        } catch (e) {
            if(response.ok) {
                result = { status: 'success' };
            } else {
                throw new Error("回傳格式錯誤");
            }
        }
        
        if (result && result.status === 'success') {
            res.send(`
                <script>
                    alert('登記成功！');
                    window.location.href = '/';
                </script>
            `);
        } else {
            throw new Error("狀態異常");
        }
    } catch (error) {
        res.status(500).send(`
            <script>
                alert('系統錯誤，無法寫入！請確認 server.js 裡的網址是否正確');
                window.location.href = '/';
            </script>
        `);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
