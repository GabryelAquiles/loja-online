import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

let lojaConfig = {};

async function init() {
    const params = new URLSearchParams(location.search);
    const slug = params.get("loja");

    if (!slug) return;

    const q = query(collection(db, "config_lojas"), where("slug", "==", slug));
    const snap = await getDocs(q);

    if (snap.empty) return;

    const d = snap.docs[0].data();
    lojaConfig = d;

    // Preenche Interface
    document.getElementById("store-name").innerText = d.nome_loja;
    document.getElementById("store-description").innerText = d.descricao;
    
    // Atualiza a cor dos botões se houver cor personalizada
    if(d.cor_tema) {
        document.documentElement.style.setProperty('--cor-whatsapp', d.cor_tema);
    }

    carregarProdutos(slug, params.get("cat"));
}

function carregarProdutos(slug, cat) {
    let q = query(collection(db, "produtos"), where("loja_id", "==", slug));
    if(cat) q = query(collection(db, "produtos"), where("loja_id", "==", slug), where("categoria", "==", cat));

    onSnapshot(q, s => {
        const grid = document.getElementById("product-grid");
        grid.innerHTML = "";
        s.forEach(doc => {
            const p = doc.data();
            // Transformamos o array de imagens em String para passar na função
            const imagensJson = btoa(JSON.stringify(p.imagens || [p.url_imagem]));
            
            grid.innerHTML += `
                <div class="product-card" onclick="abrirModal('${p.nome}', '${p.preco}', '${imagensJson}', '${encodeURIComponent(p.descricao || '')}')">
                    <div class="image-container"><img src="${p.url_imagem}"></div>
                    <div class="product-info">
                        <h2>${p.nome}</h2>
                        <span class="price">R$ ${p.preco}</span>
                        <button class="btn-wa">VER DETALHES</button>
                    </div>
                </div>
            `;
        });
    });
}

// Função aprimorada para abrir o modal com suporte a carrossel
window.abrirModal = (nome, preco, imagensBase64, descEncoded) => {
    const imagens = JSON.parse(atob(imagensBase64));
    const descricao = decodeURIComponent(descEncoded);
    const modal = document.getElementById("product-detail-view");
    
    modal.innerHTML = `
        <span class="close-detail" onclick="this.parentElement.style.display='none'">× FECHAR</span>
        <div class="detail-container">
            <div class="carousel" style="display:flex; overflow-x:auto; scroll-snap-type:x mandatory; gap:10px;">
                ${imagens.map(img => `<img src="${img}" style="width:100%; flex-shrink:0; scroll-snap-align:start; border-radius:8px;">`).join('')}
            </div>
            <div class="product-data" style="padding:20px; text-align:center;">
                <h1 style="font-weight:900; text-transform:uppercase;">${nome}</h1>
                <span class="price-detail" style="font-size:1.5rem; display:block; margin:10px 0;">R$ ${preco}</span>
                <p class="description" style="color:#666; margin-bottom:20px;">${descricao}</p>
                <button class="btn-whatsapp" onclick="contato('${nome}', '${preco}')" style="width:100%; padding:20px; background:#000; color:#fff; font-weight:900; border:none; border-radius:8px; cursor:pointer;">
                    PEDIR VIA WHATSAPP
                </button>
            </div>
        </div>
    `;
    modal.style.display = "block";
};

window.contato = (n, p) => {
    const msg = encodeURIComponent(`Olá! Tenho interesse no item: ${n} (R$ ${p})`);
    window.open(`https://wa.me/${lojaConfig.whatsapp}?text=${msg}`);
};

init();
