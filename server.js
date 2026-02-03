const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors()); 
app.use(express.static('uploads')); // torna pasta pública

// configurando multer p/ salvar as imgs
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        // NOME: data-nome_da_img
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// GET -> listar imgs
app.get('/api/imagens', (req, res) => {
    const diretorioUploads = path.join(__dirname, 'uploads');
    
    // lista nomes dos arquivos
    fs.readdir(diretorioUploads, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao ler pasta' });
        }
        // filtragem p/ mandar apenas arquivos
        const imagens = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));
        
        // URL 
        const urls = imagens.map(img => ({
            url: `http://localhost:${PORT}/${img}`,
            nome: img
        }));
        
        res.json(urls);
    });
});

// POST -> subir imgs
app.post('/api/upload', upload.single('imagem'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('Nenhuma imagem foi enviada.');
    }
    res.json({ message: 'Imagem salva com sucesso!', arquivo: req.file });
});

// inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});