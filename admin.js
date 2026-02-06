import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, query, where, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const auth = getAuth(app);

// Se o usuário não estiver logado, ele é jogado para a página de login na hora
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
    }
});
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
const IMGBB_API_KEY = "a4f3b254234cb475b12a0f303a1b30f7";
const auth = getAuth(app);

// VERIFICA SE ESTÁ LOGADO
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Se não tiver usuário logado, chuta de volta para o login
        window.location.href = "login.html";
    }
});

// ADICIONE UM BOTÃO DE LOGOUT NO SEU HTML E ESTA FUNÇÃO:
window.fazerLogout = () => {
    signOut(auth).then(() => {
        window.location.href = "login.html";
    });
}

// SALVAR CONFIGURAÇÕES DA LOJA
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
            const novosDados = { descricao: descricao, cor_tema: cor };
            if (urlLogoFinal) novosDados.logo_url = urlLogoFinal;
            await updateDoc(lojaDocRef, novosDados);
            alert("LOJA ATUALIZADA!");
        }
    } catch (e) { alert("Erro: " + e.message); }
    btn.innerText = "Atualizar Loja"; btn.disabled = false;
});

// CADASTRAR PRODUTO
document.getElementById('btn-cadastrar').addEventListener('click', async () => {
    const btn = document.getElementById('btn-cadastrar');
    const nome = document.getElementById('nome').value;
    const preco = document.getElementById('preco').value;
    const categoria = document.getElementById('categoria').value;
    const arquivo = document.getElementById('arquivo_imagem').files[0];
    const loja_id = document.getElementById('loja_id').value;

    if (!nome || !preco || !arquivo) return alert("Preencha tudo!");
    btn.innerText = "Publicando..."; btn.disabled = true;

    try {
        const formData = new FormData();
        formData.append("image", arquivo);
        const resp = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method: "POST", body: formData });
        const json = await resp.json();
        
        await addDoc(collection(db, "produtos"), {
            nome, preco, categoria, url_imagem: json.data.url, loja_id, data_criacao: new Date()
        });
        alert("PRODUTO PUBLICADO!");
        document.getElementById('nome').value = ""; document.getElementById('preco').value = "";
    } catch (e) { alert("Erro: " + e.message); }
    btn.innerText = "Publicar no Catálogo"; btn.disabled = false;
});

// LISTAGEM EM TEMPO REAL
let unsubscribe = null;
function carregarProdutos() {
    const listaArea = document.getElementById('lista-produtos');
    const lojaId = document.getElementById('loja_id').value;
    if (unsubscribe) unsubscribe();

    const q = query(collection(db, "produtos"), where("loja_id", "==", lojaId));
    unsubscribe = onSnapshot(q, (snap) => {
        listaArea.innerHTML = "";
        snap.forEach((recurso) => {
            const item = recurso.data();
            const div = document.createElement('div');
            div.className = "produto-item";
            div.innerHTML = `
                <div><strong>${item.nome}</strong><br><small>${item.categoria}</small></div>
                <button class="btn-excluir" onclick="removerProduto('${recurso.id}')">Excluir</button>
            `;
            listaArea.appendChild(div);
        });
    });
}

window.removerProduto = async (id) => {
    if (confirm("Excluir?")) await deleteDoc(doc(db, "produtos", id));
};

document.getElementById('loja_id').addEventListener('change', carregarProdutos);
carregarProdutos();


