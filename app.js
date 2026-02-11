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
    
    if (!slug) {
        document.body.innerHTML = "<h2 style='text-align:center; padding-top:100px;'>Selecione uma loja válida na URL.</h2>";
        return;
    }

    const q = query(collection(db, "config_lojas"), where("slug", "==", slug));
    const snap = await getDocs(q);
    if (snap.empty) return;

    lojaConfig = snap.docs[0].data();
    document.getElementById("store-name").innerText = lojaConfig.nome_loja;
    document.getElementById("store-description").innerText = lojaConfig.descricao || "";
    document.title = `${lojaConfig.nome_loja} | Vitrine`;

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

        // Geração Dinâmica do Menu com Verificação de Ativo
        const categorias = [...new Set(produtos.map(p => p.categoria).filter(c => c))];
        menuList.innerHTML = `<li><a href="?loja=${slug}" class="${!catFiltro ? 'active' : ''}">TUDO</a></li>`;
        categorias.forEach(c => {
            const isAtivo = catFiltro === c ? 'active' : '';
            menuList.innerHTML += `<li><a href="?loja=${slug}&cat=${c}" class="${isAtivo}">${c}</a></li>`;
        });

        // Filtro de produtos por categoria
        const produtosFiltrados = produtos.filter(p => !catFiltro || p.categoria === catFiltro);

        produtosFiltrados.forEach(p => {
            const imagensJson = btoa(JSON.stringify(p.imagens || [p.url_imagem]));
            grid.innerHTML += `
                <div class="product-card" onclick="abrirModal('${p.nome}', '${p.preco}', '${imagensJson}', '${encodeURIComponent(p.descricao || '')}')">
                    <div class="product-image-wrapper"><img src="${p.url_imagem}" loading="lazy"></div>
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
                <h1>${nome}</h1>
                <span class="price-detail">R$ ${preco}</span>
                <p class="description">${desc}</p>
                <button class="btn-whatsapp" onclick="window.open('https://wa.me/${lojaConfig.whatsapp}?text=Olá! Tenho interesse no produto: ${nome}')">
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
