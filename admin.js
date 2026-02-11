// ... (Mantenha os imports do Firebase no topo igual ao seu admin.js anterior) ...

// ATUALIZAÇÃO NA FUNÇÃO DE LISTAR PRODUTOS (Para ficar mais visual)
function carregarProdutosLista() {
    const slug = document.getElementById("loja_id").value;
    if (!slug) return;

    const q = query(collection(db, "produtos"), where("loja_id", "==", slug));

    onSnapshot(q, (s) => {
        const area = document.getElementById("lista-produtos");
        area.innerHTML = "";

        s.forEach((d) => {
            const p = d.data();
            area.innerHTML += `
                <div class="product-list-item">
                    <img src="${p.url_imagem}" alt="thumb">
                    <div class="product-info-mini">
                        <div style="font-weight:900; text-transform:uppercase;">${p.nome}</div>
                        <div style="opacity:0.5">R$ ${p.preco} | ${p.categoria}</div>
                    </div>
                    <button class="btn-del" onclick="removerProd('${d.id}')">REMOVER</button>
                </div>
            `;
        });
    });
}

// O restante da lógica de Upload (ImgBB) e Salvar (Firestore) permanece 
// a mesma que você já tem, apenas certifique-se de que os IDs dos inputs batem.