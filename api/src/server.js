const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

app.use('/photos', express.static(path.join(__dirname, '../photos')));

app.get('/api/gallery', (req, res) => {
    const photosDir = path.join(__dirname, '../photos');
    fs.readdir(photosDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        const images = files.filter(file =>
            /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file)
        );
        res.json(images);
    });
});

app.get('/api/album', (req, res) => {
    const dataPath = path.join(__dirname, '../data.json');
    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(JSON.parse(data));
    });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Backend rodando na porta ${PORT}`);
});