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

onAuthStateChanged(auth, user => { if (!user) window.location.href = "login.html"; });
document.getElementById("btn-logout").onclick = () => signOut(auth);

// --- FUNÇÃO PARA CARREGAR DADOS DA LOJA ---
async function carregarDadosLoja(slug) {
    if (!slug) return;
    const q = query(collection(db, "config_lojas"), where("slug", "==", slug));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
        const d = snap.docs[0].data();
        document.getElementById("nome_loja").value = d.nome_loja || "";
        document.getElementById("whatsapp_loja").value = d.whatsapp || "";
        document.getElementById("desc_loja").value = d.descricao || "";
        if(d.cor_tema) document.getElementById("cor_tema").value = d.cor_tema;
        listarProdutos(slug);
    }
}

document.getElementById("loja_id").addEventListener("blur", (e) => carregarDadosLoja(e.target.value));

// SALVAR CONFIG
document.getElementById("btn-salvar-config").onclick = async () => {
    const slug = document.getElementById("loja_id").value;
    const dados = {
        slug: slug,
        nome_loja: document.getElementById("nome_loja").value,
        whatsapp: document.getElementById("whatsapp_loja").value,
        descricao: document.getElementById("desc_loja").value,
        cor_tema: document.getElementById("cor_tema").value
    };

    const q = query(collection(db, "config_lojas"), where("slug", "==", slug));
    const snap = await getDocs(q);

    if (!snap.empty) {
        await updateDoc(doc(db, "config_lojas", snap.docs[0].id), dados);
    } else {
        await addDoc(collection(db, "config_lojas"), dados);
    }
    alert("Loja Atualizada!");
};

// CADASTRAR PRODUTO
document.getElementById("btn-cadastrar").onclick = async () => {
    const btn = document.getElementById("btn-cadastrar");
    const files = document.getElementById("arquivo_imagem").files;
    const slug = document.getElementById("loja_id").value;

    if (files.length === 0 || !slug) return alert("Faltam dados!");

    btn.innerText = "Enviando...";
    const urls = [];
    for (let file of files) {
        const fd = new FormData();
        fd.append("image", file);
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: "POST", body: fd });
        const j = await res.json();
        urls.push(j.data.url);
    }

    await addDoc(collection(db, "produtos"), {
        nome: document.getElementById("nome").value,
        preco: document.getElementById("preco").value,
        categoria: document.getElementById("categoria_prod").value,
        url_imagem: urls[0],
        imagens: urls,
        loja_id: slug
    });
    alert("Produto Salvo!");
    location.reload();
};

function listarProdutos(slug) {
    const q = query(collection(db, "produtos"), where("loja_id", "==", slug));
    onSnapshot(q, s => {
        const area = document.getElementById("lista-produtos");
        area.innerHTML = "";
        s.forEach(d => {
            const p = d.data();
            area.innerHTML += `<div class="prod-item"><img src="${p.url_imagem}"><div class="prod-info"><strong>${p.nome}</strong><br>R$ ${p.preco}</div><button class="btn-del" onclick="removerProd('${d.id}')">Excluir</button></div>`;
        });
    });
}
window.removerProd = async id => { if(confirm("Excluir?")) await deleteDoc(doc(db, "produtos", id)); };
