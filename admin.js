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
const IMGBB_API_KEY = "a4f3b254234cb475b12a0f303a1b30f7";

let linksTemporarios = []; 

// --- SEGURANÇA ---
onAuthStateChanged(auth, (user) => {
    if (!user) window.location.href = "login.html";
});

window.fazerLogout = () => {
    signOut(auth).then(() => window.location.href = "login.html");
};

// --- FUNÇÃO PARA GERENCIAR MENUS (AUTOMATIZADA) ---
window.adicionarLinkMenu = () => {
    const texto = document.getElementById('menu_texto').value;
    let url = document.getElementById('menu_url').value;

    if(texto && url) {
        // Se o lojista digitar apenas "Camisetas", o código transforma em "?cat=Camisetas"
        if (!url.startsWith('?') && !url.startsWith('http')) {
            url = `?cat=${url}`;
        }

        linksTemporarios.push({ texto, url });
        renderizarLinksAdmin();
        document.getElementById('menu_texto').value = "";
        document.getElementById('menu_url').value = "";
    } else {
        alert("Preencha o nome do menu e a categoria!");
    }
};

function renderizarLinksAdmin() {
    const div = document.getElementById('lista-links-admin');
    div.innerHTML = linksTemporarios.map((link, index) => `
        <div style="font-size: 0.8rem; background: #eee; padding: 8px; margin-bottom: 5px; display: flex; justify-content: space-between; border-radius:4px; align-items:center;">
            <span><strong>${link.texto}</strong> <small>(${link.url})</small></span> 
            <button onclick="removerLinkMenu(${index})" style="background:red; color:white; border:none; padding:2px 8px; border-radius:4px; cursor:pointer; width:auto;">X</button>
        </div>
    `).join('');
}

window.removerLinkMenu = (index) => {
    linksTemporarios.splice(index, 1);
    renderizarLinksAdmin();
};

// --- SALVAR CONFIGURAÇÕES ---
document.getElementById('btn-salvar-config').addEventListener('click', async () => {
    const btn = document.getElementById('btn-salvar-config');
    const arquivoLogo = document.getElementById('logo_loja').files[0];
    const descricao = document.getElementById('desc_loja').value;
    const cor = document.getElementById('cor_tema').value;
    const loja_slug = document.getElementById('loja_id').value;

    if (!loja_slug) return alert("Informe o ID da Loja!");

    btn.innerText = "Salvando...";
    btn.disabled = true;

    try {
        let urlLogoFinal = null;
        if (arquivoLogo) {
            const formData = new FormData();
            formData.append("image", arquivoLogo);
            const resp = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: formData });
            const json = await resp.json();
            urlLogoFinal = json.data.url;
        }

        const q = query(collection(db, "config_lojas"), where("slug", "==", loja_slug));
        const snap = await getDocs(q);

        if (!snap.empty) {
            const lojaDocRef = doc(db, "config_lojas", snap.docs[0].id);
            
            const novosDados = { 
                descricao: descricao, 
                cor_tema: cor,
                links_cabecalho: linksTemporarios 
            };
            
            if (urlLogoFinal) novosDados.logo_url = urlLogoFinal;

            await updateDoc(lojaDocRef, novosDados);
            alert("CONFIGURAÇÕES SALVAS COM SUCESSO!");
        } else {
            alert("Loja não encontrada. Verifique o ID (Slug).");
        }
    } catch (e) { 
        alert("Erro ao salvar: " + e.message); 
    } finally {
        btn.innerText = "Atualizar Loja"; 
        btn.disabled = false;
    }
});

// --- CARREGAR DADOS EXISTENTES AO TROCAR O ID ---
async function carregarDadosLoja() {
    const loja_slug = document.getElementById('loja_id').value;
    const listaArea = document.getElementById('lista-produtos');
    
    if(!loja_slug) {
        linksTemporarios = [];
        renderizarLinksAdmin();
        return;
    }

    const q = query(collection(db, "config_lojas"), where("slug", "==", loja_slug));
    const snap = await getDocs(q);
    
    if(!snap.empty) {
        const d = snap.docs[0].data();
        document.getElementById('desc_loja').value = d.descricao || "";
        document.getElementById('cor_tema').value = d.cor_tema || "#000000";
        linksTemporarios = d.links_cabecalho || [];
        renderizarLinksAdmin();
    } else {
        linksTemporarios = [];
        renderizarLinksAdmin();
    }
    carregarProdutosGestao();
}

document.getElementById('loja_id').addEventListener('change', carregarDadosLoja);

// --- GESTÃO DE PRODUTOS ---
document.getElementById('btn-cadastrar').addEventListener('click', async () => {
    const btn = document.getElementById('btn-cadastrar');
    const nome = document.getElementById('nome').value;
    const preco = document.getElementById('preco').value;
    const categoria = document.getElementById('categoria').value;
    const arquivo = document.getElementById('arquivo_imagem').files[0];
    const loja_id = document.getElementById('loja_id').value;

    if (!nome || !preco || !arquivo || !loja_id) return alert("Preencha todos os campos!");
    
    btn.innerText = "Publicando..."; 
    btn.disabled = true;

    try {
        const formData = new FormData();
        formData.append("image", arquivo);
        const resp = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: formData });
        const json = await resp.json();
        
        await addDoc(collection(db, "produtos"), {
            nome, 
            preco, 
            categoria, 
            url_imagem: json.data.url, 
            loja_id, 
            data_criacao: new Date()
        });
        
        alert("PRODUTO CADASTRADO!");
        document.getElementById('nome').value = ""; 
        document.getElementById('preco').value = "";
    } catch (e) { 
        alert("Erro: " + e.message); 
    } finally {
        btn.innerText = "Publicar no Catálogo"; 
        btn.disabled = false;
    }
});

let unsubscribeProdutos = null;
function carregarProdutosGestao() {
    const listaArea = document.getElementById('lista-produtos');
    const lojaId
