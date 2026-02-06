import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, query, where, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
const auth = getAuth(app);
const IMGBB_KEY = "a4f3b254234cb475b12a0f303a1b30f7";

let linksTemporarios = [];

onAuthStateChanged(auth, (user) => { if (!user) window.location.href = "login.html"; });
window.fazerLogout = () => signOut(auth).then(() => window.location.href = "login.html");

// --- GESTÃO DE MENU ---
window.adicionarLinkMenu = () => {
    const texto = document.getElementById('menu_texto').value;
    let url = document.getElementById('menu_url').value;
    if(texto && url) {
        // AUTOMAÇÃO: Se não tiver HTTP ou ?, vira ?cat= automaticamente
        if (!url.startsWith('?') && !url.startsWith('http')) url = `?cat=${url}`;
        linksTemporarios.push({ texto, url });
        renderizarLinksAdmin();
        document.getElementById('menu_texto').value = "";
        document.getElementById('menu_url').value = "";
    }
};

function renderizarLinksAdmin() {
    const div = document.getElementById('lista-links-admin');
    div.innerHTML = linksTemporarios.map((l, i) => `
        <div class="item-row">
            <span>${l.texto} (${l.url})</span>
            <button class="btn-del" onclick="removerLinkMenu(${i})">X</button>
        </div>
    `).join('');
}
window.removerLinkMenu = (i) => { linksTemporarios.splice(i, 1); renderizarLinksAdmin(); };

// --- SALVAR ---
document.getElementById('btn-salvar-config').addEventListener('click', async () => {
    const btn = document.getElementById('btn-salvar-config');
    const slug = document.getElementById('loja_id').value;
    if (!slug) return alert("ID da Loja obrigatório!");

    btn.innerText = "SINCRONIZANDO...";
    btn.disabled = true;

    try {
        const logoFile = document.getElementById('logo_loja').files[0];
        let logoUrl = null;
        if (logoFile) {
            const fd = new FormData(); fd.append("image", logoFile);
            const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: "POST", body: fd });
            const j = await res.json(); logoUrl = j.data.url;
        }

        const q = query(collection(db, "config_lojas"), where("slug", "==", slug));
        const snap = await getDocs(q);
        if (!snap.empty) {
            const dados = {
                descricao: document.getElementById('desc_loja').value,
                cor_tema: document.getElementById('cor_tema').value,
                links_cabecalho: linksTemporarios
            };
            if (logoUrl) dados.logo_url = logoUrl;
            await updateDoc(doc(db, "config_lojas", snap.docs[0].id), dados);
            alert("AQUILESSW: DADOS ATUALIZADOS.");
        }
    } catch (e) { alert("Erro: " + e.message); }
    btn.innerText = "Sincronizar Loja"; btn.disabled = false;
});

// --- PRODUTOS ---
document.getElementById('btn-cadastrar').addEventListener('click', async () => {
    const btn = document.getElementById('btn-cadastrar');
    const nome = document.getElementById('nome').value;
    const preco = document.getElementById('preco').value;
    const cat = document.getElementById('categoria_prod').value;
    const file = document.getElementById('arquivo_imagem').files[0];
    const slug = document.getElementById('loja_id').value;

    if (!nome || !file || !slug) return alert("Dados insuficientes!");
    btn.innerText = "UPLOADING..."; btn.disabled = true;

    try {
        const fd = new FormData(); fd.append("image", file);
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: "POST", body: fd });
        const j = await res.json();
        await addDoc(collection(db, "produtos"), {
            nome, preco, categoria: cat, url_imagem: j.data.url, loja_id: slug, data_criacao: new Date()
        });
        alert("PRODUTO PUBLICADO.");
        document.getElementById('nome').value = ""; document.getElementById('preco').value = "";
    } catch (e) { alert("Erro: " + e.message); }
    btn.innerText = "Publicar Produto"; btn.disabled = false;
});

// --- CARREGAMENTO ---
async function carregarTudo() {
    const slug = document.getElementById('loja_id').value;
    if(!slug) return;
    const q = query(collection(db, "config_lojas"), where("slug", "==", slug));
    const snap = await getDocs(q);
    if(!snap.empty) {
        const d = snap.docs[0].data();
        document.getElementById('desc_loja').value = d.descricao || "";
        document.getElementById('cor_tema').value = d.cor_tema || "#000000";
        linksTemporarios = d.links_cabecalho || [];
        renderizarLinksAdmin();
    }
    carregarProdutosLista();
}

function carregarProdutosLista() {
    const slug = document.getElementById('loja_id').value;
    const q = query(collection(db, "produtos"), where("loja_id", "==", slug));
    onSnapshot(q, (s) => {
        const area = document.getElementById('lista-produtos');
        area.innerHTML = "";
        s.forEach(d => {
            const p = d.data();
            area.innerHTML += `
                <div class="item-row">
                    <span>${p.nome} - R$ ${p.preco}</span>
                    <button class="btn-del" onclick="removerProd('${d.id}')">EXCLUIR</button>
                </div>
            `;
        });
    });
}
window.removerProd = async (id) => { if(confirm("Remover?")) await deleteDoc(doc(db, "produtos", id)); };
document.getElementById('loja_id').addEventListener('change', carregarTudo);
carregarTudo();
