import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

window.sendWa = function(nome, preco) {
    const telefone = window.lojaTelefone || "5511999999999"; 
    const mensagem = encodeURIComponent(`Olá! Tenho interesse no item: ${nome} (R$ ${preco}).`);
    window.open(`https://wa.me/${telefone}?text=${mensagem}`);
}

async function inicializarSaaS() {
    const grid = document.getElementById('product-grid');
    const urlParams = new URLSearchParams(window.location.search);
    const lojaSlug = urlParams.get('loja') || 'loja-verde';

    try {
        // CARREGA CONFIGURAÇÕES DA LOJA
        const qLoja = query(collection(db, "config_lojas"), where("slug", "==", lojaSlug));
        const lojaSnap = await getDocs(qLoja);

        lojaSnap.forEach(doc => {
            const dados = doc.data();
            if(dados.nome_loja) document.getElementById('store-name').innerText = dados.nome_loja;
            if(dados.descricao) document.getElementById('store-description').innerText = dados.descricao;
            if(dados.cor_tema) document.documentElement.style.setProperty('--cor-primaria', dados.cor_tema);
            if(dados.logo_url) {
                const img = document.getElementById('store-logo');
                img.src = dados.logo_url; img.style.display = 'block';
            }
            window.lojaTelefone = dados.whatsapp;
        });

        // CARREGA PRODUTOS EM TEMPO REAL
        const qProd = query(collection(db, "produtos"), where("loja_id", "==", lojaSlug));
        onSnapshot(qProd, (snap) => {
            if (!grid) return;
            grid.innerHTML = snap.empty ? '<p>Nenhum produto no momento.</p>' : '';
            snap.forEach((doc) => {
                const item = doc.data();
                grid.innerHTML += `
                    <div class="product-card">
                        <div class="image-container"><img src="${item.url_imagem}" alt="${item.nome}"></div>
                        <div class="product-info">
                            <h2>${item.nome}</h2>
                            <p class="price">R$ ${item.preco}</p>
                            <button class="btn-wa" onclick="sendWa('${item.nome}', '${item.preco}')">ADQUIRIR VIA WHATSAPP</button>
                        </div>
                    </div>`;
            });
        });
    } catch (e) { console.error(e); }
}

inicializarSaaS();
