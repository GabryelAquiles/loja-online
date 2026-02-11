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
    if(d.logo_url) document.getElementById("store-logo").src = d.logo_url;

    // Menu mantendo o slug
    const menu = document.getElementById("menu-list");
    menu.innerHTML = (d.links_cabecalho || []).map(l => `
        <li><a href="?loja=${slug}&cat=${l.url.replace('?cat=', '')}">${l.texto}</a></li>
    `).join("");

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
            grid.innerHTML += `
                <div class="product-card" onclick="verProduto('${p.nome}', '${p.preco}', '${p.url_imagem}', '${p.descricao || ''}')">
                    <div class="product-image-wrapper"><img src="${p.url_imagem}"></div>
                    <div class="product-info">
                        <h2>${p.nome}</h2>
                        <span class="price">R$ ${p.preco}</span>
                    </div>
                </div>
            `;
        });
    });
}

window.verProduto = (nome, preco, img, desc) => {
    const modal = document.getElementById("product-detail-view");
    modal.innerHTML = `
        <span class="close-detail" onclick="this.parentElement.style.display='none'">× CLOSE</span>
        <div class="detail-container">
            <div class="carousel"><img src="${img}"></div>
            <div class="product-data">
                <h1>${nome}</h1>
                <span class="price-detail">R$ ${preco}</span>
                <p class="description">${desc}</p>
                <button class="btn-whatsapp" onclick="contato('${nome}', '${preco}')">PEDIR VIA WHATSAPP</button>
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