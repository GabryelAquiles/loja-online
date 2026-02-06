import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. CONFIGURAÇÃO DO FIREBASE (Mantida a sua original)
const firebaseConfig = {
  apiKey: "AIzaSyC6g9nuso280y5ezxSQyyuF5EljE9raz0M",
  authDomain: "aquiles-sw-saas.firebaseapp.com",
  projectId: "aquiles-sw-saas",
  storageBucket: "aquiles-sw-saas.appspot.com",
  messagingSenderId: "878262536684",
  appId: "1:878262536684:web:e32ac0b9755ca101e398c9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 2. FUNÇÃO DO WHATSAPP
window.sendWa = function(nome, preco) {
    const telefone = window.lojaTelefone || "5511999999999"; 
    const mensagem = encodeURIComponent(`Olá! Tenho interesse no item: ${nome} (R$ ${preco}). Ainda está disponível?`);
    window.open(`https://wa.me/${telefone}?text=${mensagem}`);
}

// 3. CARREGAR TUDO (LOJA + PRODUTOS EM TEMPO REAL)
async function inicializarSaaS() {
    const grid = document.getElementById('product-grid');
    const urlParams = new URLSearchParams(window.location.search);
    const lojaSlug = urlParams.get('loja') || 'loja-padrao';

    try {
        // --- PARTE A: BUSCAR DADOS DA LOJA ---
        const qLoja = query(collection(db, "config_lojas"), where("slug", "==", lojaSlug));
        const lojaSnapshot = await getDocs(qLoja);

        lojaSnapshot.forEach(doc => {
            const dados = doc.data();
            
            if(dados.nome_loja) {
                const elNome = document.getElementById('store-name');
                if(elNome) elNome.innerText = dados.nome_loja;
            }
            
            if(dados.cor_tema) {
                document.documentElement.style.setProperty('--cor-primaria', dados.cor_tema);
            }

            window.lojaTelefone = dados.whatsapp;
        });

        // --- PARTE B: VITRINE EM TEMPO REAL (onSnapshot) ---
        const qProd = query(collection(db, "produtos"), where("loja_id", "==", lojaSlug));
        
        // Esta função fica "ouvindo" o banco. Se você add ou excluir no Admin, muda aqui na hora!
        onSnapshot(qProd, (querySnapshot) => {
            if (grid) {
                grid.innerHTML = ''; 

                if (querySnapshot.empty) {
                    grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; padding: 50px;">Nenhum produto disponível no momento.</p>';
                    return;
                }

                querySnapshot.forEach((doc) => {
                    const item = doc.data();
                    grid.innerHTML += `
                        <div class="product-card">
                            <div class="image-container">
                                <img src="${item.url_imagem || 'https://via.placeholder.com/400'}" alt="${item.nome}">
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
            }
        });

    } catch (error) {
        console.error("Erro crítico:", error);
        if (grid) grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">Erro ao carregar vitrine.</p>';
    }
}

inicializarSaaS();
inicializarSaaS();


