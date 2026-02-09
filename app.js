// Simulação de dados (depois conectamos ao Firebase)
const fakeStore = {
  name: "Minha Loja Modelo",
  menu: ["Início", "Produtos", "Contato"],
  products: [
    { name: "Camisa Premium", price: "129,90" },
    { name: "Tênis Esportivo", price: "299,90" }
  ]
};

document.addEventListener("DOMContentLoaded", ()=>{
  document.getElementById("storeTitle").innerText = fakeStore.name;
  document.getElementById("footerName").innerText = fakeStore.name;

  const menu = document.getElementById("menu");
  fakeStore.menu.forEach(item=>{
    const li = document.createElement("li");
    li.innerText = item;
    menu.appendChild(li);
  });

  const products = document.getElementById("products");
  fakeStore.products.forEach(p=>{
    const div = document.createElement("div");
    div.className = "product-card";
    div.innerHTML = `<h3>${p.name}</h3><p>R$ ${p.price}</p>`;
    products.appendChild(div);
  });
});
