// script.js

// Elementos do DOM
const mostrarFormBtn = document.getElementById("mostrarForm");
const formSection    = document.getElementById("form-section");
const tipoRadios     = document.getElementsByName("tipo");
const nomeSelect     = document.getElementById("nome");
const tempoSelect    = document.getElementById("tempo");
const adicionarBtn   = document.getElementById("adicionar");
const precoHoraInput = document.getElementById("precoHora");
const salvarPrecoBtn = document.getElementById("salvarPreco");
const abrirConfigBtn = document.getElementById("abrirConfig");
const configSection  = document.getElementById("config");
const limparHistBtn  = document.getElementById("limparHistorico");
const historicoTbody = document.querySelector("#historicoTable tbody");
const clientesDiv    = document.getElementById("clientes");
const alarme         = document.getElementById("alarme");

const modal        = document.getElementById("modal");
const mNomeText    = document.getElementById("modal-nome-text");
const mEdit        = document.getElementById("modal-edit");
const mInicio      = document.getElementById("modal-inicio");
const mTempo       = document.getElementById("modal-tempo");
const mValor       = document.getElementById("modal-valor");
const mParar       = document.getElementById("modal-parar");
const mAddTempo    = document.getElementById("modal-adicionar-tempo");
const mLista       = document.getElementById("modal-tempos-lista");
const mFechar      = document.getElementById("modal-fechar");

// Dados em memória
let clientes = JSON.parse(localStorage.getItem("clientes")) || [];
let historico = JSON.parse(localStorage.getItem("historico")) || [];
let ativoIndex = null;

// Carrega precoHora
precoHoraInput.value = localStorage.getItem("precoHora") || 6;

// Persistência
const salvarClientes  = () => localStorage.setItem("clientes", JSON.stringify(clientes));
const salvarHistorico = () => localStorage.setItem("historico", JSON.stringify(historico));
const salvarPreco     = () => {
  localStorage.setItem("precoHora", precoHoraInput.value);
  alert("Preço salvo!");
};

// Renderiza histórico na tabela
function carregarHistorico() {
  historicoTbody.innerHTML = "";
  historico.forEach(item => {
    const tr = document.createElement("tr");
    const data = new Date(item.data || Date.now()).toLocaleDateString('pt-BR');
    tr.innerHTML = `
      <td>${item.tipo} ${item.nome}</td>
      <td>R$ ${item.valor.toFixed(2)}</td>
      <td>${data}</td>
    `;
    historicoTbody.appendChild(tr);
  });
}

// Listeners de toggle
mostrarFormBtn.onclick = () => formSection.classList.toggle("escondido");
abrirConfigBtn.onclick = () => {
  configSection.classList.toggle("escondido");
  carregarHistorico();
};
salvarPrecoBtn.onclick = salvarPreco;
limparHistBtn.onclick = () => {
  if (confirm("Limpar histórico?")) {
    historico = [];
    salvarHistorico();
    carregarHistorico();
  }
};

// Combobox dinâmica e exibição de campos
function atualizarNomeETempo() {
  const tipo = [...tipoRadios].find(r => r.checked)?.value;
  nomeSelect.innerHTML = "";
  const usados = clientes.filter(c => c.tipo === tipo).map(c => c.nome);
  let i = 1;
  while (usados.includes(`${tipo} ${i}`)) i++;
  nomeSelect.add(new Option(`${tipo} ${i}`, `${tipo} ${i}`));
  nomeSelect.classList.remove("escondido");
  tempoSelect.classList.remove("escondido");
}
[...tipoRadios].forEach(r => r.onchange = atualizarNomeETempo);

// Adicionar cliente
adicionarBtn.onclick = () => {
  const tipo = [...tipoRadios].find(r => r.checked)?.value;
  const nome = nomeSelect.value;
  const tMin = parseFloat(tempoSelect.value);
  if (!tipo || !nome || isNaN(tMin)) return alert("Preencha todos os campos!");

  const now = Date.now();
  const preco = parseFloat(precoHoraInput.value) || 0;
  const valorFixo = tMin > 0 ? (tMin / 60) * preco : 0;

  clientes.push({
    tipo, nome, tMin, valor: valorFixo,
    inicio: now, alertado: false, aberto: tMin === 0
  });
  salvarClientes();
  renderClientes();

  // reset form
  formSection.classList.add("escondido");
  nomeSelect.classList.add("escondido");
  tempoSelect.classList.add("escondido");
  [...tipoRadios].forEach(r => r.checked = false);
};

// Atualização em tempo real dos cards
setInterval(() => {
  document.querySelectorAll(".cliente").forEach((card, idx) => {
    const c = clientes[idx];
    const p = card.querySelector("p");
    if (c.aberto) {
      p.textContent = formatDuration(Date.now() - c.inicio);
    } else {
      const rem = c.inicio + c.tMin * 60000 - Date.now();
      p.textContent = rem > 0
        ? `Restante ${formatDuration(rem)}`
        : "Esgotado";
      if (rem <= 0 && !c.alertado) {
        alarme.play();
        if (Notification.permission === "granted") {
          new Notification("Tempo esgotado", { body: `${c.nome} acabou!` });
        }
        c.alertado = true;
        salvarClientes();
      }
    }
  });
}, 1000);

// Renderiza clientes ativos
function renderClientes() {
  clientesDiv.innerHTML = "";
  clientes.forEach((c, idx) => {
    const card = document.createElement("div");
    card.className = "cliente";
    card.onclick = () => abrirModal(idx);
    card.innerHTML = `
      <img src="${c.tipo === 'PS5' ? 'ps5.jpg' : 'PC.png'}" alt="${c.tipo}">
      <p></p>
    `;
    clientesDiv.append(card);
  });
}

// Formata ms em “Xm Ys”
function formatDuration(ms) {
  const m = Math.floor(ms / 60000),
        s = Math.floor((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}

// Abre modal de um cliente
function abrirModal(idx) {
  ativoIndex = idx;
  const c = clientes[idx];
  mNomeText.textContent = c.nome;
  mInicio.textContent = new Date(c.inicio).toLocaleString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
  mValor.textContent = c.aberto
    ? ((Date.now() - c.inicio) / 3600000 * parseFloat(precoHoraInput.value)).toFixed(2)
    : c.valor.toFixed(2);
  atualizarModalTempo();

  mParar.classList.remove("escondido");
  const expirou = (!c.aberto && Date.now() >= c.inicio + c.tMin * 60000);
  mAddTempo.classList.toggle("escondido", !expirou);
  mLista.classList.toggle("escondido", !expirou);

  modal.classList.remove("escondido");
}

// Atualiza tempo no modal
function atualizarModalTempo() {
  const c = clientes[ativoIndex];
  mTempo.textContent = c.aberto
    ? formatDuration(Date.now() - c.inicio)
    : (Date.now() < c.inicio + c.tMin * 60000
        ? formatDuration(c.inicio + c.tMin * 60000 - Date.now())
        : "Esgotado");
}

// Ações do Modal
mFechar.onclick = () => modal.classList.add("escondido");

mParar.onclick = () => {
  const c = clientes[ativoIndex];
  historico.push({
    tipo: c.tipo,
    nome: c.nome,
    tempo: c.aberto
      ? Math.floor((Date.now() - c.inicio) / 60000)
      : c.tMin,
    valor: c.valor,
    data: Date.now()
  });
  clientes.splice(ativoIndex, 1);
  salvarClientes();
  salvarHistorico();
  renderClientes();
  carregarHistorico();
  modal.classList.add("escondido");
};

mAddTempo.onclick = () => {
  const extra = parseFloat(mLista.value);
  const c = clientes[ativoIndex];
  if (!c.aberto) {
    c.tMin += extra > 0 ? extra : 0;
    c.inicio = Date.now();
    c.valor += (extra / 60) * parseFloat(precoHoraInput.value);
    c.alertado = false;
    salvarClientes();
    renderClientes();
    abrirModal(ativoIndex);
  }
};

// **Listener do lápis para editar nome**
mEdit.onclick = () => {
  const novo = prompt("Digite o novo nome:", clientes[ativoIndex].nome);
  if (novo) {
    clientes[ativoIndex].nome = novo;
    salvarClientes();
    renderClientes();
    abrirModal(ativoIndex);
  }
};

// Inicialização
window.onload = () => {
  renderClientes();
  carregarHistorico();
  if ("Notification" in window) Notification.requestPermission();
};
