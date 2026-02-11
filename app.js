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
    const catFiltro = params.get("cat");
    if (!slug) return;

    const q = query(collection(db, "config_lojas"), where("slug", "==", slug));
    const snap = await getDocs(q);
    if (snap.empty) return;

    lojaConfig = snap.docs[0].data();
    document.getElementById("store-name").innerText = lojaConfig.nome_loja;
    document.getElementById("store-description").innerText = lojaConfig.descricao || "";

    carregarProdutos(slug, catFiltro);
}

function carregarProdutos(slug, catFiltro) {
    const q = query(collection(db, "produtos"), where("loja_id", "==", slug));
    onSnapshot(q, s => {
        const grid = document.getElementById("product-grid");
        const menuList = document.getElementById("menu-list");
        grid.innerHTML = "";
        
        let produtos = [];
        s.forEach(doc => produtos.push(doc.data()));

        // Criar Menu Dinâmico
        const categorias = [...new Set(produtos.map(p => p.categoria).filter(c => c))];
        menuList.innerHTML = `<li><a href="?loja=${slug}">TUDO</a></li>`;
        categorias.forEach(c => {
            menuList.innerHTML += `<li><a href="?loja=${slug}&cat=${c}">${c}</a></li>`;
        });

        // Filtrar e Mostrar Produtos
        produtos.filter(p => !catFiltro || p.categoria === catFiltro).forEach(p => {
            const imagensJson = btoa(JSON.stringify(p.imagens || [p.url_imagem]));
            grid.innerHTML += `
                <div class="product-card" onclick="abrirModal('${p.nome}', '${p.preco}', '${imagensJson}', '${encodeURIComponent(p.descricao || '')}')">
                    <div class="product-image-wrapper"><img src="${p.url_imagem}"></div>
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
    modal.innerHTML = `
        <span class="close-detail" onclick="fecharModal()">× FECHAR</span>
        <div class="detail-container">
            <div class="carousel"><img src="${imagens[0]}" style="width:100%"></div>
            <div class="product-data">
                <h1 style="font-weight:900; text-transform:uppercase;">${nome}</h1>
                <p style="font-size:1.5rem; margin:15px 0;">R$ ${preco}</p>
                <p style="color:#666;">${desc}</p>
                <button onclick="window.open('https://wa.me/${lojaConfig.whatsapp}?text=Interesse: ${nome}')" 
                        style="width:100%; padding:20px; background:#000; color:#fff; font-weight:900; border:none; margin-top:30px; cursor:pointer;">
                    PEDIR VIA WHATSAPP
                </button>
            </div>
        </div>`;
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
};

window.fecharModal = () => {
    document.getElementById("product-detail-view").style.display = "none";
    document.body.style.overflow = "auto";
};

init();
