import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, query, where, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
const auth = getAuth(app);
const IMGBB_KEY = "a4f3b254234cb475b12a0f303a1b30f7";

let linksTemporarios = [];

onAuthStateChanged(auth, user=>{
if(!user) window.location.href="login.html";
});

window.fazerLogout = ()=> signOut(auth).then(()=>location.href="login.html");

// ADICIONAR MENU
window.adicionarLinkMenu = ()=>{
const texto = menu_texto.value;
let url = menu_url.value;

if(texto && url){
linksTemporarios.push({texto,url});
renderizarLinksAdmin();
menu_texto.value="";
menu_url.value="";
}
};

function renderizarLinksAdmin(){
lista-links-admin.innerHTML = linksTemporarios.map((l,i)=>`
<div class="item-row">
<span>${l.texto} — ${l.url}</span>
<button class="btn-del" onclick="removerLinkMenu(${i})">X</button>
</div>
`).join("");
}

window.removerLinkMenu = i=>{
linksTemporarios.splice(i,1);
renderizarLinksAdmin();
};

// SALVAR CONFIG
btn-salvar-config.onclick = async ()=>{
const slug = loja_id.value;
if(!slug) return alert("Digite o ID da loja!");

let logoUrl=null;
const file = logo_loja.files[0];

if(file){
const fd=new FormData();
fd.append("image",file);
const r=await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`,{method:"POST",body:fd});
const j=await r.json();
logoUrl=j.data.url;
}

const q = query(collection(db,"config_lojas"), where("slug","==",slug));
const snap = await getDocs(q);

const dados={
slug,
nome_loja:nome_loja.value,
whatsapp:whatsapp_loja.value,
descricao:desc_loja.value,
cor_tema:cor_tema.value,
links_cabecalho:linksTemporarios
};

if(logoUrl) dados.logo_url=logoUrl;

if(!snap.empty){
await updateDoc(doc(db,"config_lojas",snap.docs[0].id),dados);
}else{
await addDoc(collection(db,"config_lojas"),dados);
}

alert("Loja sincronizada!");
};

// CADASTRAR PRODUTO
btn-cadastrar.onclick = async ()=>{
const slug = loja_id.value;
if(!slug) return alert("Preencha o ID da loja!");

const file = arquivo_imagem.files[0];
const fd=new FormData();
fd.append("image",file);
const r=await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`,{method:"POST",body:fd});
const j=await r.json();

await addDoc(collection(db,"produtos"),{
nome:nome.value,
preco:preco.value,
categoria:categoria_prod.value,
url_imagem:j.data.url,
loja_id:slug,
data_criacao:new Date()
});

alert("Produto publicado!");
};

// LISTAR PRODUTOS
function carregarProdutos(){
const slug = loja_id.value;
const q = query(collection(db,"produtos"), where("loja_id","==",slug));

onSnapshot(q,snap=>{
lista-produtos.innerHTML="";
snap.forEach(d=>{
const p=d.data();
lista-produtos.innerHTML+=`
<div class="item-row">
<span>${p.nome} — R$ ${p.preco}</span>
<button class="btn-del" onclick="removerProd('${d.id}')">EXCLUIR</button>
</div>
`;
});
});
}

window.removerProd = id => deleteDoc(doc(db,"produtos",id));

loja_id.addEventListener("blur",carregarProdutos);
