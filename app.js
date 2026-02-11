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
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("loja");
    if (!slug) return;

    const q = query(collection(db, "config_lojas"), where("slug", "==", slug));
    const snap = await getDocs(q);
    if (snap.empty) {
        console.error("Loja não encontrada no banco de dados.");
        return;
    }

    const d = snap.docs[0].data();
    lojaConfig = d;

    // Garante que o cabeçalho apareça e atualiza os dados
    const header = document.getElementById("header-loja");
    if (header) {
        header.style.display = "flex"; // Força a exibição caso o CSS falhe
        document.getElementById("store-name").innerText = d.nome_loja.toUpperCase();
        document.getElementById("store-description").innerText = d.descricao || "";
    }

    carregarProdutos(slug);
}

function carregarProdutos(slug) {
    const q = query(collection(db, "produtos"), where("loja_id", "==", slug));
    onSnapshot(q, s => {
        const grid = document.getElementById("product-grid");
        if (!grid) return;
        
        grid.innerHTML = "";
        s.forEach(doc => {
            const p = doc.data();
            const imagensJson = btoa(JSON.stringify(p.imagens || [p.url_imagem]));
            grid.innerHTML += `
                <div class="product-card" onclick="abrirModal('${p.nome}', '${p.preco}', '${imagensJson}', '${encodeURIComponent(p.descricao || '')}')">
                    <div class="product-image-wrapper"><img src="${p.url_imagem}" alt="${p.nome}"></div>
                    <div class="product-info">
                        <h2>${p.nome}</h2>
                        <span class="price">R$ ${p.preco}</span>
                    </div>
                </div>`;
        });
    });
}

window.abrirModal = (nome, preco, imagensBase64, descEncoded) => {
    const imagens = JSON.parse(atob(imagensBase64));
    const desc = decodeURIComponent(descEncoded);
    const modal = document.getElementById("product-detail-view");
    
    // Injetamos uma estrutura com fundo branco sólido forçado
    modal.innerHTML = `
        <div style="background-color: #ffffff; min-height: 100vh; width: 100%; position: absolute; top: 0; left: 0;">
            <span class="close-detail" onclick="window.fecharModal()">× FECHAR</span>
            <div class="detail-container">
                <div class="carousel">
                    <img src="${imagens[0]}" style="width: 100%; border: 1px solid #eee;">
                </div>
                <div class="product-data">
                    <h1 style="font-weight:900; margin-bottom:10px; text-transform: uppercase;">${nome}</h1>
                    <p style="font-size:1.8rem; font-weight: 900; margin-bottom:15px;">R$ ${preco}</p>
                    <p style="color:#666; line-height: 1.6; margin-bottom: 25px;">${desc}</p>
                    <button onclick="window.open('https://wa.me/${lojaConfig.whatsapp}?text=Olá! Tenho interesse no produto: ${nome}')" 
                            style="width:100%; padding:20px; background:#000; color:#fff; font-weight:900; border:none; cursor:pointer; text-transform: uppercase; letter-spacing: 1px;">
                        PEDIR VIA WHATSAPP
                    </button>
                </div>
            </div>
        </div>`;
    
    modal.style.display = "block";
    document.body.style.overflow = "hidden"; // Bloqueia o scroll da página atrás
};

window.fecharModal = () => {
    const modal = document.getElementById("product-detail-view");
    modal.style.display = "none";
    document.body.style.overflow = "auto"; // Libera o scroll
};

// Inicializa a loja
init();
