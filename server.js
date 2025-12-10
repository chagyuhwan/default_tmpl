const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// 정적 파일 제공
app.use(express.static(__dirname));

// 라우팅 처리 - _redirects 규칙과 동일하게
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'about', 'index.html'));
});

app.get('/about/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'about', 'index.html'));
});

app.get('/info', (req, res) => {
    res.sendFile(path.join(__dirname, 'info', 'index.html'));
});

app.get('/info/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'info', 'index.html'));
});

app.get('/gallery', (req, res) => {
    res.sendFile(path.join(__dirname, 'gallery', 'index.html'));
});

app.get('/gallery/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'gallery', 'index.html'));
});

app.get('/inquiry', (req, res) => {
    res.sendFile(path.join(__dirname, 'inquiry', 'index.html'));
});

app.get('/inquiry/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'inquiry', 'index.html'));
});

app.get('/location', (req, res) => {
    res.sendFile(path.join(__dirname, 'location', 'index.html'));
});

app.get('/gallery', (req, res) => {
    res.sendFile(path.join(__dirname, 'gallery', 'index.html'));
});

app.get('/gallery/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'gallery', 'index.html'));
});

app.get('/inquiry', (req, res) => {
    res.sendFile(path.join(__dirname, 'inquiry', 'index.html'));
});

app.get('/inquiry/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'inquiry', 'index.html'));
});

app.get('/location', (req, res) => {
    res.sendFile(path.join(__dirname, 'location', 'index.html'));
});

app.get('/location/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'location', 'index.html'));
});

// 나머지 모든 경로는 index.html로
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});


