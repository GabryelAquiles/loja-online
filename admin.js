import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, doc, updateDoc, query, where, getDocs, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// Importações necessárias para segurança
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyC6g9nuso280y5ezxSQyyuF5EljE9raz0M",
    authDomain: "aquiles-sw-saas.firebaseapp.com",
    projectId: "aquiles-sw-saas",
    storageBucket: "aquiles-sw-saas.appspot.com",
    messagingSenderId: "878262536684",
    appId: "1:878262536684:web:e32ac0b9755ca101e398c9"
};

// Inicialização
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- 0. TRAVA DE SEGURANÇA (VERIFICA SE ESTÁ LOGADO) ---
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Se não tiver usuário logado, manda de volta para o login
        window.location.href = "login.html";
    } else {
        console.log("Acesso autorizado: " + user.email);
    }
});

// Botão Sair (Logout)
document.getElementById("btn-logout").addEventListener("click", () => {
    signOut(auth).then(() => {
        window.location.href = "login.html";
    });
});

// 1. CARREGAR CONFIGURAÇÕES DA LOJA AO DIGITAR O SLUG
document.getElementById("loja_id").addEventListener("blur", async (e) => {
    const slug = e.target.value;
    if (!slug) return;

    const q = query(collection(db, "config_lojas"), where("slug", "==", slug));
    const snap = await getDocs(q);

    if (!snap.empty) {
        const d = snap.docs[0].data();
        document.getElementById("nome_loja").value = d.nome_loja || "";
        document.getElementById("whatsapp_loja").value = d.whatsapp || "";
        document.getElementById("desc_loja").value = d.descricao || "";
        document.getElementById("cor_tema").value = d.cor_tema || "#000000";
        
        listarProdutos(slug);
    } else {
        alert("Slug novo detectado. Preencha os campos para criar esta loja.");
    }
});

// 2. SALVAR OU ATUALIZAR CONFIG DA LOJA
document.getElementById("btn-salvar-config").addEventListener("click", async () => {
    const slug = document.getElementById("loja_id").value;
    if(!slug) return alert("Digite o Slug primeiro!");

    const dados = {
        slug: slug,
        nome_loja: document.getElementById("nome_loja").value,
        whatsapp: document.getElementById("whatsapp_loja").value,
        descricao: document.getElementById("desc_loja").value,
        cor_tema: document.getElementById("cor_tema").value
    };

    const q = query(collection(db, "config_lojas"), where("slug", "==", slug));
    const snap = await getDocs(q);

    try {
        if (snap.empty) {
            await addDoc(collection(db, "config_lojas"), dados);
        } else {
            await updateDoc(doc(db, "config_lojas", snap.docs[0].id), dados);
        }
        alert("Configurações salvas!");
    } catch (error) {
        alert("Erro ao salvar: " + error.message);
    }
});

// 3. CADASTRAR PRODUTO
document.getElementById("btn-cadastrar").addEventListener("click", async () => {
    const slug = document.getElementById("loja_id").value;
    const file = document.getElementById("arquivo_imagem").files[0];
    
    if (!slug || !file) {
        alert("Preencha o Slug da loja e selecione uma imagem!");
        return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        try {
            const novoProduto = {
                loja_id: slug,
                nome: document.getElementById("nome").value,
                preco: document.getElementById("preco").value,
                categoria: document.getElementById("categoria_prod").value.toLowerCase(),
                url_imagem: reader.result,
                imagens: [reader.result]
            };

            await addDoc(collection(db, "produtos"), novoProduto);
            alert("Produto publicado com sucesso!");
            
            // Limpar campos de texto
            document.getElementById("nome").value = "";
            document.getElementById("preco").value = "";
            document.getElementById("categoria_prod").value = "";
            document.getElementById("arquivo_imagem").value = "";
        } catch (error) {
            alert("Erro ao publicar produto: " + error.message);
        }
    };
});

// 4. LISTAR PRODUTOS DA LOJA
function listarProdutos(slug) {
    const q = query(collection(db, "produtos"), where("loja_id", "==", slug));
    onSnapshot(q, (s) => {
        const lista = document.getElementById("lista-produtos");
        lista.innerHTML = "";
        s.forEach(dDoc => {
            const p = dDoc.data();
            lista.innerHTML += `
                <div class="prod-item">
                    <img src="${p.url_imagem}">
                    <div style="flex:1">
                        <strong>${p.nome}</strong><br>
                        <small>${p.categoria} | R$ ${p.preco}</small>
                    </div>
                    <button onclick="deletarProduto('${dDoc.id}')" style="width:auto; padding:5px 10px; background:red; color:white; border:none; border-radius:4px; cursor:pointer;">Apagar</button>
                </div>
            `;
        });
    });
}

// 5. FUNÇÃO PARA DELETAR
window.deletarProduto = async (id) => {
    if (confirm("Deseja apagar este produto?")) {
        try {
            await deleteDoc(doc(db, "produtos", id));
        } catch (error) {
            alert("Erro ao deletar: " + error.message);
        }
    }
};
