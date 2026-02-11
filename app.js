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
        document.getElementById("store-name").innerText = "AQUILESSW | VITRINE";
        return;
    }

    const q = query(collection(db, "config_lojas"), where("slug", "==", slug));
    const snap = await getDocs(q);

    if (snap.empty) return;

    const d = snap.docs[0].data();
    lojaConfig = d;

    document.getElementById("store-name").innerText = d.nome_loja;
    document.getElementById("store-description").innerText = d.descricao || "";
    
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
            const imagens = p.imagens && p.imagens.length > 0 ? p.imagens : [p.url_imagem];
            const imagensJson = btoa(JSON.stringify(imagens));
            
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

window.abrirModal = (nome, preco, imagensBase64, descEncoded) => {
    const imagens = JSON.parse(atob(imagensBase64));
    const descricao = decodeURIComponent(descEncoded);
    const modal = document.getElementById("product-detail-view");
    
    modal.innerHTML = `
        <span class="close-detail" onclick="document.getElementById('product-detail-view').style.display='none'">× FECHAR</span>
        <div class="detail-container">
            <div class="carousel">
                ${imagens.map(img => `<img src="${img}">`).join('')}
            </div>
            <div style="padding:30px; text-align:center;">
                <h1 style="font-weight:900; text-transform:uppercase; margin-bottom:10px;">${nome}</h1>
                <span style="font-size:1.5rem; display:block; margin-bottom:15px; font-weight:bold;">R$ ${preco}</span>
                <p style="color:#666; margin-bottom:25px; font-size:0.9rem; line-height:1.5;">${descricao}</p>
                <button onclick="contato('${nome}', '${preco}')" style="width:100%; padding:20px; background:#000; color:#fff; font-weight:900; border:none; cursor:pointer; text-transform:uppercase;">
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
