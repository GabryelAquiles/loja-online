import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// SUAS CONFIGURAÇÕES (Não mude nada aqui se já estiver funcionando)
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

// Função para salvar
document.getElementById('btn-cadastrar').addEventListener('click', async () => {
    const nome = document.getElementById('nome').value;
    const preco = document.getElementById('preco').value;
    const url_imagem = document.getElementById('url_imagem').value;
    const loja_id = document.getElementById('loja_id').value;

    if (!nome || !preco) {
        alert("Preencha o nome e o preço!");
        return;
    }

    try {
        await addDoc(collection(db, "produtos"), {
            nome: nome,
            preco: preco,
            url_imagem: url_imagem,
            loja_id: loja_id
        });
        alert("PRODUTO PUBLICADO!");
        // Limpa os campos
        document.getElementById('nome').value = "";
        document.getElementById('preco').value = "";
        document.getElementById('url_imagem').value = "";
    } catch (e) {
        console.error("Erro ao salvar: ", e);
        alert("Erro ao salvar: " + e.message);
    }
});
