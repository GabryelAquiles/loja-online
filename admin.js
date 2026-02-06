import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    deleteDoc, 
    doc, 
    query, 
    where, 
    getDocs, 
    updateDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. CONFIGURAÇÃO FIREBASE
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

// 2. CONFIGURAÇÃO IMGBB
const IMGBB_API_KEY = "a4f3b254234cb475b12a0f303a1b30f7"; 

// --- FUNÇÃO A: ATUALIZAR IDENTIDADE DA LOJA ---
document.getElementById('btn-salvar-config').addEventListener('click', async () => {
    const btn = document.getElementById('btn-salvar-config');
    const arquivoLogo = document.getElementById('logo_loja').files[0];
    const descricao = document.getElementById('desc_loja').value;
    const cor = document.getElementById('cor_tema').value;
    const loja_slug = document.getElementById('loja_id').value;

    btn.innerText = "Salvando...";
    btn.disabled = true;

    try {
        let urlLogoFinal = null;

        // Se houver arquivo de logo, faz upload
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

        // Busca o documento da loja para atualizar
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
            alert("IDENTIDADE DA LOJA ATUALIZADA!");
        } else {
            alert("Erro: Loja não encontrada no banco.");
        }
    } catch (e) {
        console.error(e);
        alert("Erro ao salvar: " + e.message);
    } finally {
        btn.innerText = "Atualizar Loja";
        btn.disabled = false;
    }
});

// --- FUNÇÃO B: CADASTRAR PRODUTO COM CATEGORIA ---
document.getElementById('btn-cadastrar').addEventListener('click', async () => {
    const btn = document.getElementById('btn-cadastrar');
    const nome = document.getElementById('nome').value;
    const preco = document.getElementById('preco').value;
    const categoria = document.getElementById('categoria').value;
    const arquivo = document.getElementById('arquivo_imagem').files[0];
    const loja_id = document.getElementById('loja_id').value;

    if (!nome || !preco || !arquivo) {
        alert("Preencha nome, preço e foto!");
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

        alert("PRODUTO PUBLICADO!");
        
        // Limpar campos
        document.getElementById('nome').value = "";
        document.getElementById('preco').value = "";
        document.getElementById('arquivo_imagem').value = "";
        
    } catch (e) {
        alert("Erro: " + e.message);
    } finally {
        btn.innerText = "Publicar no Catálogo";
        btn.disabled = false;
    }
});

// --- FUNÇÃO C: LISTAR E EXCLUIR PRODUTOS ---
function carregarProdutosGestao() {
    const listaArea = document.getElementById('lista-produtos');
    const lojaIdAtual = document.getElementById('loja_id').value;

    const q = query(collection(db, "produtos"), where("loja_id", "==", lojaIdAtual));

    onSnapshot(q, (querySnapshot) => {
        listaArea.innerHTML = ""; 

        querySnapshot.forEach((recurso) => {
            const item = recurso.data();
            const id = recurso.id;

            const div = document.createElement('div');
            div.className = "produto-item";
            div.style = "display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding:10px 0;";
            div.innerHTML = `
                <div class="info-prod">
                    <span class="nome-prod">${item.nome}</span>
                    <span class="preco-prod">R$ ${item.preco} | ${item.categoria || 'Geral'}</span>
                </div>
                <button class="btn-excluir" onclick="removerProduto('${id}')">Excluir</button>
            `;
            listaArea.appendChild(div);
        });
    });
}

window.removerProduto = async (id) => {
    if (confirm("Deseja excluir este produto?")) {
        try {
            await deleteDoc(doc(db, "produtos", id));
        } catch (e) {
            alert("Erro: " + e.message);
        }
    }
};

carregarProdutosGestao();
