import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, query, where, getDocs, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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

// --- SALVAR CONFIGURAÇÕES (SINCRONIZAR) ---
document.getElementById('btn-salvar-config').addEventListener('click', async () => {
    const btn = document.getElementById('btn-salvar-config');
    const slug = document.getElementById('loja_id').value;
    if (!slug) return alert("ID da Loja (Slug) é obrigatório!");

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
        
        const dados = {
            slug: slug,
            nome_loja: document.getElementById('nome_loja').value,
            whatsapp: document.getElementById('whatsapp_loja').value,
            descricao: document.getElementById('desc_loja').value,
            cor_tema: document.getElementById('cor_tema').value,
            links_cabecalho: linksTemporarios
        };

        if (logoUrl) dados.logo_url = logoUrl;

        if (!snap.empty) {
            // Atualiza loja existente
            await updateDoc(doc(db, "config_lojas", snap.docs[0].id), dados);
        } else {
            // Cria nova loja se o slug não existir
            await addDoc(collection(db, "config_lojas"), dados);
        }
        
        alert("AQUILESSW: SISTEMA SINCRONIZADO COM SUCESSO.");
    } catch (e) { 
        console.error(e);
        alert("Erro ao salvar: " + e.message); 
    }
    btn.innerText = "ATUALIZAR IDENTIDADE DA LOJA"; btn.disabled = false;
});

// --- GESTÃO DE PRODUTOS ---
document.getElementById('btn-cadastrar').addEventListener('click', async () => {
    const btn = document.getElementById('btn-cadastrar');
    const nome = document.getElementById('nome').value;
    const preco = document.getElementById('preco').value;
    const cat = document.getElementById('categoria_prod').value;
    const file = document.getElementById('arquivo_imagem').files[0];
    const slug = document.getElementById('loja_id').value;

    if (!nome || !file || !slug) return alert("Preencha Nome, Imagem e o ID da Loja!");
    
    btn.innerText = "ENVIANDO CATALOGO..."; btn.disabled = true;

    try {
        const fd = new FormData(); fd.append("image", file);
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: "POST", body: fd });
        const j = await res.json();
        
        await addDoc(collection(db, "produtos"), {
            nome, 
            preco, 
            categoria: cat, 
            url_imagem: j.data.url, 
            loja_id: slug, 
            data_criacao: new Date()
        });
        
        alert("PRODUTO PUBLICADO COM SUCESSO.");
        document.getElementById('nome').value = ""; 
        document.getElementById('preco').value = "";
        document.getElementById('arquivo_imagem').value = "";
    } catch (e) { alert("Erro: " + e.message); }
    btn.innerText = "PUBLICAR NO CATÁLOGO"; btn.disabled = false;
});

// --- CARREGAMENTO DE DADOS ---
async function carregarTudo() {
    const slug = document.getElementById('loja_id').value;
    if(!slug) return;

    // Carregar Configurações
    const q = query(collection(db, "config_lojas"), where("slug", "==", slug));
    const snap = await getDocs(q);
    if(!snap.empty) {
        const d = snap.docs[0].data();
        document.getElementById('nome_loja').value = d.nome_loja || "";
        document.getElementById('whatsapp_loja').value = d.whatsapp || "";
        document.getElementById('desc_loja').value = d.descricao || "";
        document.getElementById('cor_tema').value = d.cor_tema || "#ffffff";
        linksTemporarios = d.links_cabecalho || [];
        renderizarLinksAdmin();
    } else {
        // Limpa campos se for um slug novo
        document.getElementById('nome_loja').value = "";
        document.getElementById('whatsapp_loja').value = "";
        document.getElementById('desc_loja').value = "";
        linksTemporarios = [];
        renderizarLinksAdmin();
    }
    carregarProdutosLista();
}

function carregarProdutosLista() {
    const slug = document.getElementById('loja_id').value;
    if(!slug) return;

    const q = query(collection(db, "produtos"), where("loja_id", "==", slug));
    onSnapshot(q, (s) => {
        const area = document.getElementById('lista-produtos');
        area.innerHTML = "";
        s.forEach(d => {
            const p = d.data();
            area.innerHTML += `
                <div class="item-row">
                    <span><strong>${p.categoria}</strong> | ${p.nome} - R$ ${p.preco}</span>
                    <button class="btn-del" onclick="removerProd('${d.id}')">EXCLUIR</button>
                </div>
            `;
        });
    });
}

window.removerProd = async (id) => { if(confirm("Deseja excluir este produto do catálogo?")) await deleteDoc(doc(db, "produtos", id)); };

// Escuta mudanças no ID da loja para carregar os dados automaticamente
document.getElementById('loja_id').addEventListener('blur', carregarTudo);

carregarTudo();
