import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. CONFIGURAÇÃO DO FIREBASE (Preencher na escola)
const firebaseConfig = {
  apiKey: "COLE_AQUI",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "ID_AQUI",
  appId: "APP_ID_AQUI"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. FUNÇÃO DO WHATSAPP
window.sendWa = function(nome, preco) {
    // Buscaremos o número dinamicamente ou fixo para teste
    const telefone = window.lojaTelefone || "5511999999999"; 
    const mensagem = encodeURIComponent(`Salve! Tenho interesse no item: ${nome} (R$ ${preco}). Ainda está disponível?`);
    window.open(`https://wa.me/${telefone}?text=${mensagem}`);
}

// 3. CARREGAR TUDO (LOJA + PRODUTOS)
async function inicializarSaaS() {
    const grid = document.getElementById('product-grid');
    const urlParams = new URLSearchParams(window.location.search);
    const lojaSlug = urlParams.get('loja') || 'loja-padrao';

    try {
        // --- PARTE A: BUSCAR DADOS DA LOJA (COR, LOGO, NOME) ---
        const qLoja = query(collection(db, "config_lojas"), where("slug", "==", lojaSlug));
        const lojaSnapshot = await getDocs(qLoja);

        lojaSnapshot.forEach(doc => {
            const dados = doc.data();
            
            // Nome da Loja
            if(dados.nome_loja) document.getElementById('store-name').innerText = dados.nome_loja;
            
            // Logo (se houver)
            if(dados.url_logo) {
                const header = document.querySelector('header');
                const imgExistente = document.querySelector('.logo-cliente');
                if(!imgExistente) {
                    header.insertAdjacentHTML('afterbegin', `<img src="${dados.url_logo}" class="logo-cliente">`);
                }
            }

            // COR DINÂMICA: Só muda se estiver no Firebase. Se não, o CSS manda.
            if(dados.cor_tema) {
                document.documentElement.style.setProperty('--brand', dados.cor_tema);
            }

            // Guarda o telefone para o botão de Whats
            window.lojaTelefone = dados.whatsapp;
        });

        // --- PARTE B: BUSCAR PRODUTOS ---
        const qProd = query(collection(db, "produtos"), where("loja_id", "==", lojaSlug));
        const querySnapshot = await getDocs(qProd);
        
        grid.innerHTML = ''; // Limpa o "Carregando..."

        if (querySnapshot.empty) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">Nenhum produto encontrado nesta vitrine.</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const item = doc.data();
            grid.innerHTML += `
                <div class="product-card">
                    <div class="image-container">
                        <img src="${item.url_imagem}" alt="${item.nome}">
                        <span class="badge">DROP</span>
                    </div>
                    <div class="product-info">
                        <h2>${item.nome}</h2>
                        <p class="price">R$ ${item.preco}</p>
                        <button class="btn-wa" onclick="sendWa('${item.nome}', '${item.preco}')">
                            ADQUIRIR VIA WHATSAPP
                        </button>
                    </div>
                </div>
            `;
        });

    } catch (error) {
        console.error("Erro na operação:", error);
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">Erro de conexão.</p>';
    }
}

// Inicia o sistema
inicializarSaaS();

