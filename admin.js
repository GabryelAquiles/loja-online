import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, query, where, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 1. CONFIGURAÇÃO FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyC6g9nuso280y5ezxSQyyuF5EljE9raz0M",
    authDomain: "aquiles-sw-saas.firebaseapp.com",
    projectId: "aquiles-sw-saas",
    storageBucket: "aquiles-sw-saas.appspot.com",
    messagingSenderId: "878262536684",
    appId: "1:878262536684:web:e32ac0b9755ca101e398c9"
};

// Inicialização dos serviços
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const IMGBB_API_KEY = "a4f3b254234cb475b12a0f303a1b30f7";

// --- SEGURANÇA: CONTROLE DE ACESSO ---
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Se não estiver logado, redireciona para o login
        window.location.href = "login.html";
    }
});

// Função Global de Logout
window.fazerLogout = () => {
    signOut(auth).then(() => {
        window.location.href = "login.html";
    }).catch((error) => {
        alert("Erro ao sair: " + error.message);
    });
};

// --- FUNÇÃO A: ATUALIZAR IDENTIDADE DA LOJA ---
document.getElementById('btn-salvar-config').addEventListener('click', async () => {
    const btn = document.getElementById('btn-salvar-config');
    const arquivoLogo = document.getElementById('logo_loja').files[0];
    const descricao = document.getElementById('desc_loja').value;
    const cor = document.getElementById('cor_tema').value;
    const loja_slug = document.getElementById('loja_id').value;

    if (!loja_slug) return alert("Por favor, informe o ID da Loja (Slug).");

    btn.innerText = "Salvando...";
    btn.disabled = true;

    try {
        let urlLogoFinal = null;

        // Upload da Logo (opcional)
        if (arquivoLogo) {
            const formData = new FormData();
            formData.append("image", arquivoLogo);
            const resp = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                method: "POST",
                body: formData
            });
            const json = await resp.json();
            urlLogoFinal = json.data.url;
        }

        // Busca e atualiza o documento da loja
        const q = query(collection(db, "config_lojas"), where("slug", "==", loja_slug));
        const snap = await getDocs(q);

        if (!snap.empty) {
            const lojaDocRef = doc(db, "config_lojas", snap.docs[0].id);
            const novosDados = { 
                descricao: descricao, 
                cor_tema: cor 
            };
            if (urlLogoFinal) novosDados.logo_url = urlLogoFinal;

            await updateDoc(lojaDocRef, novosDados);
            alert("IDENTIDADE DA LOJA ATUALIZADA COM SUCESSO!");
        } else {
            alert("Erro: Loja não encontrada no banco. Verifique o ID digitado.");
        }
    } catch (e) {
        console.error(e);
        alert("Erro ao salvar: " + e.message);
    } finally {
        btn.innerText = "Atualizar Loja";
        btn.disabled = false;
    }
});

// --- FUNÇÃO B: CADASTRAR PRODUTO ---
document.getElementById('btn-cadastrar').addEventListener('click', async () => {
    const btn = document.getElementById('btn-cadastrar');
    const nome = document.getElementById('nome').value;
    const preco = document.getElementById('preco').value;
    const categoria = document.getElementById('categoria').value;
    const arquivo = document.getElementById('arquivo_imagem').files[0];
    const loja_id = document.getElementById('loja_id').value;

    if (!nome || !preco || !arquivo || !loja_id) {
        alert("Preencha todos os campos do produto e o ID da loja!");
        return;
    }

    btn.innerText = "Publicando...";
    btn.disabled = true;

    try {
        const formData = new FormData();
        formData.append("image", arquivo);

        const resp = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: "POST",
            body: formData
        });
        const json = await resp.json();
        const urlFinal = json.data.url;

        await addDoc(collection(db, "produtos"), {
            nome: nome,
            preco: preco,
            categoria: categoria,
            url_imagem: urlFinal,
            loja_id: loja_id,
            data_criacao: new Date()
        });

        alert("PRODUTO PUBLICADO NO CATÁLOGO!");
        
        // Limpa campos
        document.getElementById('nome').value = "";
        document.getElementById('preco').value = "";
        document.getElementById('arquivo_imagem').value = "";
        
    } catch (e) {
        alert("Erro ao publicar: " + e.message);
    } finally {
        btn.innerText = "Publicar no Catálogo";
        btn.disabled = false;
    }
});

// --- FUNÇÃO C: GESTÃO DE PRODUTOS EM TEMPO REAL ---
let unsubscribeProdutos = null;

function carregarProdutosGestao() {
    const listaArea = document.getElementById('lista-produtos');
    const lojaIdAtual = document.getElementById('loja_id').value;

    if (!lojaIdAtual) {
        listaArea.innerHTML = "<p style='text-align:center; color:#999;'>Digite o ID da loja para carregar os itens.</p>";
        return;
    }

    // Se já houver um monitoramento ativo, desliga antes de iniciar o novo
    if (unsubscribeProdutos) unsubscribeProdutos();

    const q = query(collection(db, "produtos"), where("loja_id", "==", lojaIdAtual));

    unsubscribeProdutos = onSnapshot(q, (querySnapshot) => {
        listaArea.innerHTML = ""; 

        if (querySnapshot.empty) {
            listaArea.innerHTML = "<p style='text-align:center; color:#999;'>Nenhum produto cadastrado neste ID.</p>";
            return;
        }

        querySnapshot.forEach((recurso) => {
            const item = recurso.data();
            const id = recurso.id;

            const div = document.createElement('div');
            div.className = "produto-item";
            div.style = "display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding:15px 0;";
            div.innerHTML = `
                <div class="info-prod">
                    <span style="display:block; font-weight:bold;">${item.nome}</span>
                    <span style="font-size:0.8rem; color:#666;">R$ ${item.preco} | ${item.categoria}</span>
                </div>
                <button class="btn-excluir" onclick="removerProduto('${id}')" 
                    style="background:#ff4d4d; color:white; border:none; padding:8px 12px; border-radius:4px; cursor:pointer;">
                    Excluir
                </button>
            `;
            listaArea.appendChild(div);
        });
    });
}

// Tornar a função de remoção global para o botão funcionar
window.removerProduto = async (id) => {
    if (confirm("Deseja realmente excluir este produto?")) {
        try {
            await deleteDoc(doc(db, "produtos", id));
        } catch (e) {
            alert("Erro ao excluir: " + e.message);
        }
    }
};

// Monitora mudança no ID da loja para atualizar a lista automaticamente
document.getElementById('loja_id').addEventListener('input', carregarProdutosGestao);

let linksTemporarios = [];

window.adicionarLinkMenu = () => {
    const texto = document.getElementById('menu_texto').value;
    const url = document.getElementById('menu_url').value;
    if(texto && url) {
        linksTemporarios.push({ texto, url });
        renderizarLinksAdmin();
        document.getElementById('menu_texto').value = "";
        document.getElementById('menu_url').value = "";
    }
};

function renderizarLinksAdmin() {
    const div = document.getElementById('lista-links-admin');
    div.innerHTML = linksTemporarios.map((link, index) => `
        <div style="font-size: 0.8rem; background: #eee; padding: 5px; margin-bottom: 5px; display: flex; justify-content: space-between;">
            ${link.texto} 
            <span onclick="linksTemporarios.splice(${index}, 1); renderizarLinksAdmin()" style="color:red; cursor:pointer;">(x)</span>
        </div>
    `).join('');
}

// ATENÇÃO: No seu 'btn-salvar-config', adicione 'links_cabecalho: linksTemporarios' nos novosDados.

// Inicializa a lista no carregamento
carregarProdutosGestao();

