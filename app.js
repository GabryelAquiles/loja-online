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

    if (!slug) {
        document.getElementById("store-name").innerText = "LOJA NÃO ENCONTRADA";
        document.getElementById("store-description").innerText = "Por favor, acesse através de um link válido (ex: index.html?loja=nomedaloja)";
        return;
    }

    try {
        const q = query(collection(db, "config_lojas"), where("slug", "==", slug));
        const snap = await getDocs(q);

        if (snap.empty) {
            document.getElementById("store-name").innerText = "LOJA INEXISTENTE";
            return;
        }

        const d = snap.docs[0].data();
        lojaConfig = d;

        document.getElementById("store-name").innerText = d.nome_loja;
        document.getElementById("store-description").innerText = d.descricao || "";
        
        if(d.cor_tema) {
            document.documentElement.style.setProperty('--cor-whatsapp', d.cor_tema);
        }

        carregarProdutos(slug, params.get("cat"));
    } catch (error) {
        console.error("Erro ao carregar loja:", error);
    }
}

function carregarProdutos(slug, cat) {
    const grid = document.getElementById("product-grid");
    let q = query(collection(db, "produtos"), where("loja_id", "==", slug));
    
    if(cat) {
        q = query(collection(db, "produtos"), where("loja_id", "==", slug), where("categoria", "==", cat));
    }

    onSnapshot(q, s => {
        grid.innerHTML = "";
        if (s.empty) {
            grid.innerHTML = "<p>Nenhum produto encontrado nesta vitrine.</p>";
            return;
        }
        s.forEach(doc => {
            const p = doc.data();
            const imagensArray = p.imagens && p.imagens.length > 0 ? p.imagens : [p.url_imagem];
            const imagensJson = btoa(JSON.stringify(imagensArray));
            
            grid.innerHTML += `
                <div class="product-card" onclick="abrirModal('${p.nome}', '${p.preco}', '${imagensJson}', '${encodeURIComponent(p.descricao || '')}')">
                    <div class="image-container">
                        <img src="${p.url_imagem || 'placeholder.png'}" alt="${p.nome}">
                    </div>
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

window.abrirModal = (nome, preco, imagensBase64, descEncoded) => {
    const imagens = JSON.parse(atob(imagensBase64));
    const descricao = decodeURIComponent(descEncoded);
    const modal = document.getElementById("product-detail-view");
    
    modal.innerHTML = `
        <span class="close-detail" style="cursor:pointer; padding:20px; display:block; font-weight:bold;" onclick="document.getElementById('product-detail-view').style.display='none'">× FECHAR</span>
        <div class="detail-container">
            <div class="carousel" style="display:flex; overflow-x:auto; scroll-snap-type:x mandatory; gap:10px; padding:10px;">
                ${imagens.map(img => `<img src="${img}" style="width:100%; max-width:400px; flex-shrink:0; scroll-snap-align:start; border-radius:8px; object-fit:cover;">`).join('')}
            </div>
            <div class="product-data" style="padding:20px; text-align:center;">
                <h1 style="font-weight:900; text-transform:uppercase;">${nome}</h1>
                <span class="price-detail" style="font-size:1.5rem; display:block; margin:10px 0;">R$ ${preco}</span>
                <p class="description" style="color:#666; margin-bottom:20px;">${descricao}</p>
                <button class="btn-whatsapp" onclick="contato('${nome}', '${preco}')" style="width:100%; max-width:300px; padding:20px; background:#25D366; color:#fff; font-weight:900; border:none; border-radius:8px; cursor:pointer;">
                    PEDIR VIA WHATSAPP
                </button>
            </div>
        </div>
    `;
    modal.style.display = "block";
};

window.contato = (n, p) => {
    const tel = lojaConfig.whatsapp || "";
    const msg = encodeURIComponent(`Olá! Tenho interesse no item: ${n} (R$ ${p})`);
    window.open(`https://wa.me/${tel}?text=${msg}`);
};

init();
