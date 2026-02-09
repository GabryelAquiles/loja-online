import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
apiKey: "SUA_CHAVE_AQUI",
authDomain: "aquiles-sw-saas.firebaseapp.com",
projectId: "aquiles-sw-saas",
storageBucket: "aquiles-sw-saas.appspot.com",
messagingSenderId: "878262536684",
appId: "1:878262536684:web:e32ac0b9755ca101e398c9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.sendWa = (nome,preco)=>{
const tel = window.lojaTelefone;
const msg = encodeURIComponent(`Quero: ${nome} — R$ ${preco}`);
window.open(`https://wa.me/${tel}?text=${msg}`);
};

async function init(){
const params = new URLSearchParams(location.search);
const loja = params.get("loja");

if(!loja){
store-name.innerText="Nenhuma loja detectada";
return;
}

const q = query(collection(db,"config_lojas"), where("slug","==",loja));
const snap = await getDocs(q);

if(snap.empty){
store-name.innerText="Loja não encontrada";
return;
}

snap.forEach(d=>{
const loja = d.data();

store-name.innerText = loja.nome_loja;
store-description.innerText = loja.descricao;
footer-loja.innerText = loja.nome_loja;

if(loja.logo_url){
store-logo.src = loja.logo_url;
store-logo.style.display="block";
}

menu-list.innerHTML = loja.links_cabecalho.map(l=>{
return `<li><a href="?loja=${d.slug}&cat=${l.url}">${l.texto}</a></li>`;
}).join("");
});

// PRODUTOS
const q2 = query(collection(db,"produtos"), where("loja_id","==",loja));

onSnapshot(q2,s=>{
product-grid.innerHTML="";

s.forEach(doc=>{
const p = doc.data();
product-grid.innerHTML += `
<div class="product-card">
<img src="${p.url_imagem}">
<h2>${p.nome}</h2>
<p>R$ ${p.preco}</p>
<button onclick="sendWa('${p.nome}','${p.preco}')">Comprar</button>
</div>
`;
});
});
}

init();
