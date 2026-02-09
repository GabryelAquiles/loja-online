// Simulação de banco simples (trocaremos por Firebase depois se quiser)

let store = { name: "", menu: [], products: [] };

function saveStore(){
  const name = document.getElementById("storeName").value;
  if(!name){
    alert("Digite um nome para a loja!");
    return;
  }
  store.name = name;
  alert("Identidade salva com sucesso!");
}

function addMenu(){
  const item = document.getElementById("menuItem").value;
  if(!item){
    alert("Digite um item de menu!");
    return;
  }
  store.menu.push(item);

  renderMenu();
  document.getElementById("menuItem").value = "";
}

function renderMenu(){
  const list = document.getElementById("menuList");
  list.innerHTML = "";

  store.menu.forEach((m, i)=>{
    const li = document.createElement("li");
    li.innerText = m;
    list.appendChild(li);
  });
}

function addProduct(){
  const name = document.getElementById("prodName").value;
  const price = document.getElementById("prodPrice").value;

  if(!name || !price){
    alert("Preencha nome e preço!");
    return;
  }

  store.products.push({ name, price });
  renderProducts();

  document.getElementById("prodName").value = "";
  document.getElementById("prodPrice").value = "";
}

function renderProducts(){
  const list = document.getElementById("productList");
  list.innerHTML = "";

  store.products.forEach(p=>{
    const li = document.createElement("li");
    li.innerText = `${p.name} — R$ ${p.price}`;
    list.appendChild(li);
  });
}
