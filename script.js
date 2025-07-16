const form = document.getElementById("formulario");
const tipoSelect = document.getElementById("tipo");
const nomeSelect = document.getElementById("nome");
const precoHoraInput = document.getElementById("precoHora");
const clientesDiv = document.getElementById("clientes");
const abrirConfigBtn = document.getElementById("abrirConfig");
const fecharConfigBtn = document.getElementById("fecharConfig");
const configSection = document.getElementById("config");
const historicoUl = document.getElementById("historico");
const limparHistoricoBtn = document.getElementById("limparHistorico");

const alarme = document.getElementById("alarme");

let clientes = JSON.parse(localStorage.getItem("clientes")) || [];
let historico = JSON.parse(localStorage.getItem("historico")) || [];

function salvarClientes() {
  localStorage.setItem("clientes", JSON.stringify(clientes));
}

function salvarHistorico() {
  localStorage.setItem("historico", JSON.stringify(historico));
}

function carregarHistorico() {
  historicoUl.innerHTML = "";
  historico.forEach(item => {
    const li = document.createElement("li");
    li.textContent = `${item.tipo} ${item.nome} - ${item.tempo} min - R$ ${item.valor.toFixed(2)}`;
    historicoUl.appendChild(li);
  });
}

limparHistoricoBtn.addEventListener("click", () => {
  if (confirm("Deseja realmente limpar o histórico?")) {
    historico = [];
    salvarHistorico();
    carregarHistorico();
  }
});

abrirConfigBtn.addEventListener("click", () => {
  configSection.classList.remove("escondido");
  carregarHistorico();
});

fecharConfigBtn.addEventListener("click", () => {
  configSection.classList.add("escondido");
});

function atualizarNomeCombo() {
  const tipo = tipoSelect.value;
  nomeSelect.innerHTML = "";
  const usados = clientes.filter(c => c.tipo === tipo).map(c => c.nome);

  let indice = 1;
  while (usados.includes(`${tipo} ${indice}`)) {
    indice++;
  }

  const opcao = document.createElement("option");
  opcao.value = `${tipo} ${indice}`;
  opcao.textContent = `${tipo} ${indice}`;
  nomeSelect.appendChild(opcao);
}

tipoSelect.addEventListener("change", atualizarNomeCombo);
window.addEventListener("load", atualizarNomeCombo);

document.querySelectorAll("#temposRapidos button").forEach(btn => {
  btn.addEventListener("click", () => {
    form.dataset.tempo = btn.dataset.min;
    document.querySelectorAll("#temposRapidos button").forEach(b => b.classList.remove("selecionado"));
    btn.classList.add("selecionado");
  });
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const tipo = tipoSelect.value;
  const nome = nomeSelect.value || `${tipo} ?`;
  const tempoMin = parseFloat(form.dataset.tempo);

  const precoHora = parseFloat(precoHoraInput.value);
  const tempoMs = tempoMin > 0 ? tempoMin * 60 * 1000 : 0;
  const valor = tempoMin > 0 ? (tempoMin / 60) * precoHora : 0;

  const cliente = {
    tipo,
    nome,
    tempoMin,
    valor,
    inicio: Date.now(),
    tempoRestante: tempoMs
  };

  clientes.push(cliente);
  salvarClientes();
  renderClientes();
  atualizarNomeCombo();
});

function renderClientes() {
  clientesDiv.innerHTML = "";

  clientes.forEach((cliente, index) => {
    const div = document.createElement("div");
    div.className = "cliente";

    const img = document.createElement("img");
    img.src = cliente.tipo === "PS5" ? "ps5.jpg" : "PC.png";
    img.alt = cliente.tipo;
    img.className = "cliente-img";

    const nome = document.createElement("h3");
    nome.textContent = cliente.nome;

    const tempo = document.createElement("p");
    tempo.className = "tempo";

    const valor = document.createElement("p");
    valor.textContent = cliente.tempoMin > 0 ? `R$ ${cliente.valor.toFixed(2)}` : "Tempo Aberto";

    const removerBtn = document.createElement("button");
    removerBtn.textContent = "Remover";
    removerBtn.onclick = () => {
      if (confirm("Remover este cliente?")) {
        clientes.splice(index, 1);
        salvarClientes();
        renderClientes();
      }
    };

    const pararBtn = document.createElement("button");
    pararBtn.textContent = "Parar";
    pararBtn.onclick = () => {
      const tempoUsado = cliente.tempoMin > 0
        ? ((Date.now() - cliente.inicio) / 60000)
        : 0;

      const valorFinal = cliente.tempoMin > 0
        ? (tempoUsado / 60) * parseFloat(precoHoraInput.value)
        : 0;

      historico.push({
        tipo: cliente.tipo,
        nome: cliente.nome,
        tempo: cliente.tempoMin > 0 ? tempoUsado.toFixed(0) : "Indefinido",
        valor: valorFinal
      });

      clientes.splice(index, 1);
      salvarClientes();
      salvarHistorico();
      renderClientes();
    };

    div.appendChild(img);
    div.appendChild(nome);
    div.appendChild(tempo);
    div.appendChild(valor);
    div.appendChild(pararBtn);
    div.appendChild(removerBtn);

    clientesDiv.appendChild(div);

    if (cliente.tempoMin > 0) {
      const interval = setInterval(() => {
        const restante = cliente.tempoRestante - (Date.now() - cliente.inicio);
        if (restante <= 0) {
          tempo.textContent = "Tempo esgotado!";
          alarme.play();
          clearInterval(interval);
        } else {
          const min = Math.floor(restante / 60000);
          const seg = Math.floor((restante % 60000) / 1000);
          tempo.textContent = `Restando: ${min}m ${seg}s`;
        }
      }, 1000);
    } else {
      tempo.textContent = "Tempo Livre";
    }
  });
}

window.addEventListener("load", () => {
  renderClientes();
  carregarHistorico();
});
