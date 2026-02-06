import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// 2. CONFIGURAÇÃO IMGBB (Sua chave)
const IMGBB_API_KEY = "a4f3b254234cb475b12a0f303a1b30f7"; 

// --- FUNÇÃO PARA CADASTRAR COM UPLOAD ---
document.getElementById('btn-cadastrar').addEventListener('click', async () => {
    const btn = document.getElementById('btn-cadastrar');
    const nome = document.getElementById('nome').value;
    const preco = document.getElementById('preco').value;
    const arquivo = document.getElementById('arquivo_imagem').files[0];
    const loja_id = document.getElementById('loja_id').value;

    if (!nome || !preco || !arquivo) {
        alert("Preencha o nome, preço e selecione uma foto!");
        return;
    }

    btn.innerText = "Subindo imagem...";
    btn.disabled = true;

    try {
        // A. Upload para ImgBB
        const formData = new FormData();
        formData.append("image", arquivo);

        const resp = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: "POST",
            body: formData
        });
        const json = await resp.json();
        const urlFinal = json.data.url;

        // B. Salvar no Firestore
        await addDoc(collection(db, "produtos"), {
            nome: nome,
            preco: preco,
            url_imagem: urlFinal,
            loja_id: loja_id
        });

        alert("PRODUTO PUBLICADO COM SUCESSO!");
        
        // Limpa campos
        document.getElementById('nome').value = "";
        document.getElementById('preco').value = "";
        document.getElementById('arquivo_imagem').value = "";
        
    } catch (e) {
        console.error("Erro:", e);
        alert("Erro ao publicar: " + e.message);
    } finally {
        btn.innerText = "Publicar";
        btn.disabled = false;
    }
});

// --- FUNÇÃO PARA LISTAR E EXCLUIR (REAL-TIME) ---
function carregarProdutosGestao() {
    const listaArea = document.getElementById('lista-produtos');
    const lojaIdAtual = document.getElementById('loja_id').value;

    const q = query(collection(db, "produtos"), where("loja_id", "==", lojaIdAtual));

    // onSnapshot faz a lista atualizar sozinha quando algo muda no banco
    onSnapshot(q, (querySnapshot) => {
        listaArea.innerHTML = ""; 

        querySnapshot.forEach((recurso) => {
            const item = recurso.data();
            const id = recurso.id;

            const div = document.createElement('div');
            div.style = "display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding:10px 0;";
            div.innerHTML = `
                <span><strong>${item.nome}</strong> - R$ ${item.preco}</span>
                <button onclick="removerProduto('${id}')" style="background:red; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Excluir</button>
            `;
            listaArea.appendChild(div);
        });
    });
}

// Função global para o botão de excluir funcionar
window.removerProduto = async (id) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
        try {
            await deleteDoc(doc(db, "produtos", id));
            alert("Produto removido!");
        } catch (e) {
            alert("Erro ao excluir: " + e.message);
        }
    }
};

// Inicia a lista assim que abrir a página
carregarProdutosGestao();
