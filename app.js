import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// Função global para o WhatsApp
window.sendWa = function(nome, preco) {
    const telefone = window.lojaTelefone || "5511999999999";
    const msg = encodeURIComponent(`Olá! Gostaria de adquirir o item: ${nome} (R$ ${preco})`);
    window.open(`https://wa.me/${telefone}?text=${msg}`);
}

async function inicializarSaaS() {
    const grid = document.getElementById('product-grid');
    const menuList = document.getElementById('menu-list');
    const urlParams = new URLSearchParams(window.location.search);
    
    // Captura os parâmetros da URL
    const lojaSlug = urlParams.get('loja') || 'loja-verde';
    let categoriaFiltro = urlParams.get('cat');

    try {
        // 1. BUSCAR CONFIGURAÇÕES DA LOJA
        const qLoja = query(collection(db, "config_lojas"), where("slug", "==", lojaSlug));
        const lojaSnap = await getDocs(qLoja);

        if (lojaSnap.empty) {
            document.getElementById('store-name').innerText = "LOJA NÃO ENCONTRADA";
            return;
        }

        lojaSnap.forEach(doc => {
            const d = doc.data();
            window.lojaTelefone = d.whatsapp;

            // Atualiza Identidade Visual
            document.getElementById('store-name').innerText = d.nome_loja || d.slug.toUpperCase();
            document.getElementById('store-description').innerText = d.descricao || "";
            
            if(d.cor_tema) document.documentElement.style.setProperty('--cor-primaria', d.cor_tema);
            
            if(d.logo_url) {
                const logo = document.getElementById('store-logo');
                logo.src = d.logo_url;
                logo.style.display = 'block';
            }

            // 2. GERAR MENU DINÂMICO (CORRIGIDO)
            if (d.links_cabecalho && d.links_cabecalho.length > 0) {
                menuList.innerHTML = d.links_cabecalho.map(link => {
                    let urlDestino = link.url;
                    
                    // Se for apenas o nome da categoria, monta o link técnico
                    if (!urlDestino.startsWith('?') && !urlDestino.startsWith('http')) {
                        urlDestino = `?cat=${urlDestino}`;
                    }

                    // Gera o HREF final mantendo o parâmetro da loja (crucial para o SaaS)
                    const hrefFinal = urlDestino.startsWith('?cat=') 
                        ? `?loja=${lojaSlug}&${urlDestino.replace('?', '')}` 
                        : urlDestino;

                    return `<li><a href="${hrefFinal}">${link.texto}</a></li>`;
                }).join('');
            }
        });

        // 3. CARREGAR PRODUTOS COM FILTRO EM TEMPO REAL
        let qProd;
        if (categoriaFiltro) {
            // Filtra por Loja E Categoria
            qProd = query(
                collection(db, "produtos"), 
                where("loja_id", "==", lojaSlug),
                where("categoria", "==", decodeURIComponent(categoriaFiltro))
            );
        } else {
            // Filtra apenas por Loja (Mostra tudo)
            qProd = query(collection(db, "produtos"), where("loja_id", "==", lojaSlug));
        }

        onSnapshot(qProd, (snap) => {
            grid.innerHTML = "";
            
            if (snap.empty) {
                grid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align:center; padding: 50px; opacity: 0.5;">
                        <p>NENHUM PRODUTO EM "${categoriaFiltro || 'GERAL'}"</p>
                    </div>`;
                return;
            }

            snap.forEach(doc => {
                const p = doc.data();
                grid.innerHTML += `
                    <div class="product-card">
                        <div class="image-container">
                            <img src="${p.url_imagem}" alt="${p.nome}" loading="lazy">
                        </div>
                        <div class="product-info">
                            <h2>${p.nome}</h2>
                            <p class="price">R$ ${p.preco}</p>
                            <button class="btn-wa" onclick="sendWa('${p.nome}', '${p.preco}')">
                                ADQUIRIR VIA WHATSAPP
                            </button>
                        </div>
                    </div>`;
            });
        });

    } catch (e) {
        console.error("Erro na inicialização:", e);
    }
}

inicializarSaaS();
