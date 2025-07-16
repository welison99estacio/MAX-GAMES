const formulario = document.getElementById("formulario");
const clientesDiv = document.getElementById("clientes");
const precoHoraInput = document.getElementById("precoHora");
const tipoSelect = document.getElementById("tipo");
const nomeInput = document.getElementById("nome");
const temposRapidos = document.getElementById("temposRapidos");
const alarmeAudio = document.getElementById("alarme");
const abrirConfig = document.getElementById("abrirConfig");
const fecharConfig = document.getElementById("fecharConfig");
const configSection = document.getElementById("config");

let clientes = [];
let contadorTV = 1;
let contadorPC = 1;
let tempoSelecionado = null;

tipoSelect.addEventListener("change", aplicarNomePadrao);
abrirConfig.addEventListener("click", () => configSection.classList.toggle("escondido"));
fecharConfig.addEventListener("click", () => configSection.classList.add("escondido"));

function aplicarNomePadrao() {
  if (nomeInput.value.trim() === "") {
    if (tipoSelect.value === "PS5") {
      nomeInput.value = "TV " + contadorTV;
    } else {
      nomeInput.value = "PC " + contadorPC;
    }
  }
}

temposRapidos.addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON") {
    document.querySelectorAll("#temposRapidos button").forEach(btn => btn.classList.remove("selecionado"));
    e.target.classList.add("selecionado");
    tempoSelecionado = parseInt(e.target.dataset.min);
  }
});

formulario.addEventListener("submit", function (e) {
  e.preventDefault();

  const nome = nomeInput.value.trim();
  const tipo = tipoSelect.value;
  const tempoAberto = tempoSelecionado === 0;

  if (tempoSelecionado === null) return alert("Selecione um tempo!");

  const id = Date.now();
  const tempoFinal = tempoAberto ? null : Date.now() + tempoSelecionado * 60000;

  if (tipo === "PS5" && nome.startsWith("TV")) contadorTV++;
  if (tipo === "PC" && nome.startsWith("PC")) contadorPC++;

  clientes.push({ id, nome, tipo, tempoFinal, tempoAberto, alertado: false });
  atualizarLista();
  formulario.reset();
  tempoSelecionado = null;
  document.querySelectorAll("#temposRapidos button").forEach(btn => btn.classList.remove("selecionado"));
  aplicarNomePadrao();
});

function atualizarLista() {
  clientesDiv.innerHTML = "";

  clientes.forEach(cliente => {
    const tempoRestante = cliente.tempoFinal ? cliente.tempoFinal - Date.now() : null;
    const expirado = tempoRestante !== null && tempoRestante <= 0;

    if (expirado && !cliente.alertado) {
      alarmeAudio.play();
      cliente.alertado = true;
    }

    const div = document.createElement("div");
    div.className = "cliente" + (expirado ? " expirado" : "");

    const info = document.createElement("div");
    info.className = "info";

    const nomeSpan = document.createElement("span");
    nomeSpan.innerHTML = `<strong class="nome-editavel">${cliente.nome} 🖉</strong>`;
    nomeSpan.onclick = () => {
      const novoNome = prompt("Digite o novo nome:", cliente.nome);
      if (novoNome) {
        cliente.nome = novoNome;
        atualizarLista();
      }
    };

    const tempoTexto = cliente.tempoAberto
      ? "Tempo Aberto"
      : (tempoRestante < 0
        ? "00:00"
        : `${String(Math.floor(tempoRestante / 60000)).padStart(2, '0')}:${String(Math.floor((tempoRestante % 60000) / 1000)).padStart(2, '0')}`);

    const precoHora = parseFloat(precoHoraInput.value) || 0;
    let valor = "Valor: --";
    if (!cliente.tempoAberto) {
      let minutos = Math.ceil((cliente.tempoFinal - Date.now()) / 60000);
      minutos = Math.max(minutos, 0);
      const valorCobrado = ((minutos / 60) * precoHora).toFixed(2);
      valor = `Valor: R$ ${valorCobrado}`;
    }

    info.appendChild(nomeSpan);
    info.innerHTML += `
      <span>Tipo: ${cliente.tipo}</span>
      <span>Tempo restante: ${tempoTexto}</span>
      <span>${valor}</span>
    `;

    const btn = document.createElement("button");
    btn.className = "remover";
    btn.innerText = "Remover";
    btn.onclick = () => {
      clientes = clientes.filter(c => c.id !== cliente.id);
      atualizarLista();
    };

    const img = document.createElement("img");
    img.src = cliente.tipo === "PS5" ? "ps5.jpg" : "PC.png";
    img.alt = cliente.tipo;

    const conteudo = document.createElement("div");
    conteudo.className = "conteudo";
    conteudo.appendChild(img);
    conteudo.appendChild(info);

    div.appendChild(conteudo);
    div.appendChild(btn);
    clientesDiv.appendChild(div);
  });
}

setInterval(atualizarLista, 1000);
