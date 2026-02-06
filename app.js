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

// Função para abrir o WhatsApp
window.sendWa = function(nome, preco) {
    const telefone = window.lojaTelefone || "5511999999999";
    const msg = encodeURIComponent(`Olá! Gostaria de adquirir o item: ${nome} (R$ ${preco})`);
    window.open(`https://wa.me/${telefone}?text=${msg}`);
}

async function inicializarSaaS() {
    const grid = document.getElementById('product-grid');
    const menuList = document.getElementById('menu-list');
    const urlParams = new URLSearchParams(window.location.search);
    
    // Parâmetros da URL
    const lojaSlug = urlParams.get('loja') || 'loja-verde';
    let categoriaFiltro = urlParams.get('cat');

    try {
        // 1. CARREGA CONFIGURAÇÕES DA LOJA
        const qLoja = query(collection(db, "config_lojas"), where("slug", "==", lojaSlug));
        const lojaSnap = await getDocs(qLoja);

        if (lojaSnap.empty) {
            document.getElementById('store-name').innerText = "Loja não encontrada";
            return;
        }

        lojaSnap.forEach(doc => {
            const d = doc.data();
            window.lojaTelefone = d.whatsapp;

            document.getElementById('store-name').innerText = d.nome_loja || d.slug.toUpperCase();
            document.getElementById('store-description').innerText = d.descricao || "";
            
            if(d.cor_tema) document.documentElement.style.setProperty('--cor-primaria', d.cor_tema);
            
            if(d.logo_url) {
                const logo = document.getElementById('store-logo');
                logo.src = d.logo_url;
                logo.style.display = 'block';
            }

            // Gera o Menu Interativo Corrigido
            if (d.links_cabecalho && d.links_cabecalho.length > 0) {
                menuList.innerHTML = d.links_cabecalho.map(link => {
                    let urlDestino = link.url;
                    
                    // Se o lojista escreveu apenas "Camisetas", transformamos em link de filtro
                    if (!urlDestino.startsWith('?') && !urlDestino.startsWith('http')) {
                        urlDestino = `?cat=${urlDestino}`;
                    }

                    // Monta o link final preservando o slug da loja
                    const hrefFinal = urlDestino.startsWith('?cat=') 
                        ? `?loja=${lojaSlug}${urlDestino.replace('?', '&')}` 
                        : urlDestino;

                    return `<li><a href="${hrefFinal}">${link.texto}</a></li>`;
                }).join('');
            }
        });

        // 2. CARREGA PRODUTOS (COM OU SEM FILTRO)
        let qProd;
        if (categoriaFiltro) {
            // decodeURIComponent limpa espaços e caracteres da URL para comparar com o banco
            const categoriaLimpa = decodeURIComponent(categoriaFiltro);
            
            qProd = query(
                collection(db, "produtos"), 
                where("loja_id", "==", lojaSlug),
                where("categoria", "==", categoriaLimpa)
            );
        } else {
            qProd = query(collection(db, "produtos"), where("loja_id", "==", lojaSlug));
        }

        onSnapshot(qProd, (snap) => {
            grid.innerHTML = snap.empty ? 
                `<div style="grid-column: 1/-1; text-align:center; padding: 50px; opacity: 0.5;">
                    Nenhum produto encontrado em "${categoriaFiltro || 'Geral'}".
                </div>` : '';

            snap.forEach(doc => {
                const p = doc.data();
                grid.innerHTML += `
                    <div class="product-card">
                        <div class="image-container"><img src="${p.url_imagem}" alt="${p.nome}"></div>
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
        console.error("Erro Crítico:", e);
    }
}

inicializarSaaS();
