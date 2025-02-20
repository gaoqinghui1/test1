const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');

const app = express();
const upload = multer();

app.post('/api/convert-pdf', upload.single('inputFile'), async (req, res) => {
    try {
        const formData = new FormData();
        formData.append('inputFile', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        const response = await fetch('https://api.cloudmersive.com/convert/pdf/to/docx', {
            method: 'POST',
            headers: {
                'Apikey': 'YOUR_API_KEY'
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error('API request failed');
        }

        const buffer = await response.buffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.send(buffer);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
}); 