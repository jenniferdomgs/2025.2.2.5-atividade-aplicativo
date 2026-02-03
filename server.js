const UNSPLASH_ACCESS_KEY = '-_BSk3_ybufWr5rf3H2qoRihhsof04bkIEZHyWP4r8s'; 
const DB_NAME = 'GaleriaAppDB';
const DB_VERSION = 1;
const STORE_NAME = 'favoritos';

// banco de dados

const dbController = {
    open: () => {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
                }
            };

            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject('Erro no banco de dados');
        });
    },

    // salvar img
    add: async (imagemObj) => {
        const db = await dbController.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.add(imagemObj);

            request.onsuccess = () => resolve('Imagem salva com sucesso!');
            request.onerror = () => reject('Erro ao salvar.');
        });
    },

    // lista imgs
    getAll: async () => {
        const db = await dbController.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject('Erro ao listar.');
        });
    },

    // att titulo da img
    update: async (id, novoTitulo) => {
        const db = await dbController.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            
            // pega - edita - salva
            const getReq = store.get(id);
            getReq.onsuccess = () => {
                const item = getReq.result;
                item.titulo = novoTitulo;
                store.put(item);
                resolve();
            };
        });
    },

    // apagar
    delete: async (id) => {
        const db = await dbController.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.delete(id);
            tx.oncomplete = () => resolve();
        });
    }
};

// api unsplash

async function buscarFotosExternas(termo) {
    if (!termo) return;
    const container = document.getElementById('resultados-api');
    container.innerHTML = 'Carregando...';

    try {
        const response = await fetch(`https://api.unsplash.com/search/photos?query=${termo}&per_page=8&client_id=${UNSPLASH_ACCESS_KEY}`);
        const data = await response.json();

        container.innerHTML = ''; // limpa
        
        data.results.forEach(foto => {
            const div = document.createElement('div');
            div.className = 'card-foto';
            div.innerHTML = `
                <img src="${foto.urls.small}" alt="${foto.alt_description}">
                <button class="btn-salvar">❤️ Favoritar</button>
            `;
            
            // salvar
            div.querySelector('.btn-salvar').onclick = async () => {
                await dbController.add({
                    url: foto.urls.small,
                    titulo: termo, // titulo como termo de busca
                    data: new Date().toLocaleDateString()
                });
                alert('Salvo na galeria!');
                renderizarGaleriaPessoal();
            };

            container.appendChild(div);
        });

    } catch (error) {
        console.error(error);
        container.innerHTML = 'Erro ao buscar. Verifique a chave da API.';
    }
}

// exibir na tela -> função principal 

async function renderizarGaleriaPessoal() {
    const lista = await dbController.getAll();
    const container = document.getElementById('minha-galeria');
    container.innerHTML = '';

    if (lista.length === 0) {
        container.innerHTML = '<p>Sua galeria está vazia.</p>';
        return;
    }

    lista.forEach(item => {
        const div = document.createElement('div');
        div.className = 'card-salvo';
        div.innerHTML = `
            <img src="${item.url}">
            <p><strong>${item.titulo}</strong> <br> <small>${item.data}</small></p>
            <div class="acoes">
                <button class="btn-editar">✏️ Editar</button>
                <button class="btn-excluir">🗑️ Excluir</button>
            </div>
        `;

        // apagar - botão
        div.querySelector('.btn-excluir').onclick = async () => {
            if (confirm('Tem certeza?')) {
                await dbController.delete(item.id);
                renderizarGaleriaPessoal();
            }
        };

        // editar - botão
        div.querySelector('.btn-editar').onclick = async () => {
            const novo = prompt('Novo título:', item.titulo);
            if (novo) {
                await dbController.update(item.id, novo);
                renderizarGaleriaPessoal();
            }
        };

        container.appendChild(div);
    });
}

// inicialização
document.addEventListener('DOMContentLoaded', () => {
    // busca - botão
    const btnBuscar = document.getElementById('btn-buscar');
    if(btnBuscar) {
        btnBuscar.addEventListener('click', () => {
            const termo = document.getElementById('input-busca').value;
            buscarFotosExternas(termo);
        });
    }

    // carregar galeria 
    renderizarGaleriaPessoal();
});
