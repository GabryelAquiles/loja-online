import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Configuração do seu Firebase
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
let lojaConfig = {};

async function init() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("loja");

    // Se não houver loja na URL, exibe aviso
    if (!slug) {
        document.getElementById("store-name").innerText = "LOJA NÃO ENCONTRADA";
        return;
    }

    try {
        const q = query(collection(db, "config_lojas"), where("slug", "==", slug));
        const snap = await getDocs(q);

        if (snap.empty) {
            document.getElementById("store-name").innerText = "LOJA INEXISTENTE";
            return;
        }

        const d = snap.docs[0].data();
        lojaConfig = d;

        // Atualiza o Cabeçalho (Header)
        document.getElementById("store-name").innerText = d.nome_loja.toUpperCase();
        document.getElementById("store-description").innerText = d.descricao || "";
        
        // Altera o título da aba do navegador
        document.title = `${d.nome_loja} | Vitrine Online`;

        carregarProdutos(slug);
    } catch (error) {
        console.error("Erro ao carregar configurações:", error);
    }
}

function carregarProdutos(slug) {
    const q = query(collection(db, "produtos"), where("loja_id", "==", slug));
    
    onSnapshot(q, (s) => {
        const grid = document.getElementById("product-grid");
        grid.innerHTML = "";
        
        if (s.empty) {
            grid.innerHTML = "<p style='grid-column: 1/-1; text-align:center; padding: 50px; opacity: 0.5;'>Nenhum produto cadastrado nesta loja.</p>";
            return;
        }

        s.forEach(doc => {
            const p = doc.data();
            // Prepara as imagens para o modal (garante que seja um array)
            const listaImagens = p.imagens && p.imagens.length > 0 ? p.imagens : [p.url_imagem];
            const imagensJson = btoa(JSON.stringify(listaImagens));
            
            grid.innerHTML += `
                <div class="product-card" onclick="abrirModal('${p.nome}', '${p.preco}', '${imagensJson}', '${encodeURIComponent(p.descricao || '')}')">
                    <div class="product-image-wrapper">
                        <img src="${p.url_imagem}" alt="${p.nome}" loading="lazy">
                    </div>
                    <div class="product-info">
                        <h2>${p.nome}</h2>
                        <span class="price">R$ ${p.preco}</span>
                    </div>
                </div>`;
        });
    });
}

// Função global para abrir o modal
window.abrirModal = (nome, preco, imagensBase64, descEncoded) => {
    const imagens = JSON.parse(atob(imagensBase64));
    const desc = decodeURIComponent(descEncoded);
    const modal = document.getElementById("product-detail-view");
    
    modal.innerHTML = `
        <span class="close-detail" onclick="document.getElementById('product-detail-view').style.display='none'">× FECHAR</span>
        <div class="detail-container">
            <div class="carousel">
                ${imagens.map(img => `<img src="${img}" alt="${nome}">`).join('')}
            </div>
            <div class="product-data">
                <h1 style="font-weight:900; text-transform:uppercase; margin-bottom:10px;">${nome}</h1>
                <p style="font-size:1.8rem; font-weight:900; margin-bottom:15px; color:#000;">R$ ${preco}</p>
                <div style="color:#666; line-height:1.6; margin-bottom:30px;">${desc}</div>
                <button class="btn-whatsapp" onclick="enviarWhatsApp('${nome}', '${preco}')">
                    PEDIR VIA WHATSAPP
                </button>
            </div>
        </div>`;
    
    modal.style.display = "block";
    // Trava a rolagem da página de fundo quando o modal abre
    document.body.style.overflow = 'hidden';
};

// Fechar modal ao clicar fora ou ESC (Opcional, mas melhora muito a experiência)
window.addEventListener('click', (e) => {
    const modal = document.getElementById("product-detail-view");
    if (e.target === modal) {
        modal.style.display = "none";
        document.body.style.overflow = 'auto';
    }
});

// Função para o botão do WhatsApp
window.enviarWhatsApp = (nome, preco) => {
    const numero = lojaConfig.whatsapp ? lojaConfig.whatsapp.replace(/\D/g, '') : '';
    const mensagem = encodeURIComponent(`Olá! Tenho interesse no produto: ${nome} (R$ ${preco})`);
    window.open(`https://wa.me/55${numero}?text=${mensagem}`, '_blank');
};

// Inicializa o sistema
init();
