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
    const msg = encodeURIComponent(`Olá! Quero o item: ${nome} (R$ ${preco})`);
    window.open(`https://wa.me/${telefone}?text=${msg}`);
}

async function inicializarSaaS() {
    const grid = document.getElementById('product-grid');
    const urlParams = new URLSearchParams(window.location.search);
    const lojaSlug = urlParams.get('loja') || 'loja-verde';

    try {
        // 1. CARREGA CONFIG DA LOJA (CABEÇALHO)
        const qLoja = query(collection(db, "config_lojas"), where("slug", "==", lojaSlug));
        const lojaSnap = await getDocs(qLoja);

        lojaSnap.forEach(doc => {
            const d = doc.data();
            if(d.nome_loja) document.getElementById('store-name').innerText = d.nome_loja;
            if(d.descricao) document.getElementById('store-description').innerText = d.descricao;
            if(d.cor_tema) document.documentElement.style.setProperty('--cor-primaria', d.cor_tema);
            if(d.logo_url) {
                const logo = document.getElementById('store-logo');
                logo.src = d.logo_url; logo.style.display = 'block';
            }
            window.lojaTelefone = d.whatsapp;
        });

        // 2. CARREGA PRODUTOS (VITRINE)
        const qProd = query(collection(db, "produtos"), where("loja_id", "==", lojaSlug));
        onSnapshot(qProd, (snap) => {
            grid.innerHTML = snap.empty ? '<p>Sem produtos.</p>' : '';
            snap.forEach(doc => {
                const p = doc.data();
                grid.innerHTML += `
                    <div class="product-card">
                        <div class="image-container"><img src="${p.url_imagem}"></div>
                        <div class="product-info">
                            <h2>${p.nome}</h2>
                            <p class="price">R$ ${p.preco}</p>
                            <button class="btn-wa" onclick="sendWa('${p.nome}', '${p.preco}')">ADQUIRIR VIA WHATSAPP</button>
                        </div>
                    </div>`;
            });
        });
    } catch (e) { console.error(e); }
}
inicializarSaaS();
