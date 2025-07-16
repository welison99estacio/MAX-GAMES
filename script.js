// script.js
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
let tempoSelecionado = null;

// --- persistência ---
function salvarClientes() { localStorage.setItem("clientes", JSON.stringify(clientes)); }
function salvarHistorico() { localStorage.setItem("historico", JSON.stringify(historico)); }
function carregarHistorico() {
  historicoUl.innerHTML = "";
  historico.forEach(i => {
    const li = document.createElement("li");
    li.textContent = `${i.tipo} ${i.nome} — ${i.tempo} min — R$ ${i.valor.toFixed(2)}`;
    historicoUl.appendChild(li);
  });
}

// --- configurações ---
limparHistoricoBtn.onclick = () => {
  if (confirm("Limpar histórico?")) {
    historico = []; salvarHistorico(); carregarHistorico();
  }
};
abrirConfigBtn.onclick = () => { configSection.classList.remove("escondido"); carregarHistorico(); };
fecharConfigBtn.onclick = () => configSection.classList.add("escondido");

// --- combobox dinâmica ---
function atualizarNomeCombo() {
  const tipo = tipoSelect.value;
  nomeSelect.innerHTML = "";
  const usados = clientes.filter(c => c.tipo===tipo).map(c=>c.nome);
  let i=1;
  while (usados.includes(`${tipo} ${i}`)) i++;
  nomeSelect.add(new Option(`${tipo} ${i}`, `${tipo} ${i}`));
}
tipoSelect.onchange = atualizarNomeCombo;

// --- seleção de tempo rápido ---
document.querySelectorAll("#temposRapidos button").forEach(btn=>{
  btn.onclick = () => {
    tempoSelecionado = parseFloat(btn.dataset.min);
    document.querySelectorAll("#temposRapidos button")
      .forEach(x=>x.classList.remove("selecionado"));
    btn.classList.add("selecionado");
  };
});

// --- adicionar cliente ---
form.onsubmit = e => {
  e.preventDefault();
  if (tempoSelecionado===null) return alert("Selecione um tempo!");
  const tipo = tipoSelect.value;
  const nome = nomeSelect.value;
  const tempoMin = tempoSelecionado;
  const precoHora = parseFloat(precoHoraInput.value)||0;
  // valor fixo para tempos >0
  const valorFixo = tempoMin>0 ? (tempoMin/60)*precoHora : 0;
  const now = Date.now();
  clientes.push({
    tipo, nome,
    tempoMin, valor: valorFixo,
    inicio: now,
    alertado: false,
    aberto: tempoMin===0
  });
  salvarClientes(); renderClientes(); atualizarNomeCombo();
  tempoSelecionado = null;
  form.querySelectorAll("#temposRapidos button").forEach(x=>x.classList.remove("selecionado"));
};

// --- renderização e contadores ---
function renderClientes() {
  clientesDiv.innerHTML = "";
  clientes.forEach((c, idx) => {
    const div = document.createElement("div");
    div.className = "cliente" + (c.aberto && c.alertado ? " expirado" : "");

    // imagem
    const img = document.createElement("img");
    img.src = c.tipo==="PS5"?"ps5.jpg":"PC.png";
    img.className = "cliente-img";

    // nome e valor
    const h3 = document.createElement("h3"); h3.textContent = c.nome;
    const pVal = document.createElement("p");
    pVal.textContent = c.aberto
      ? `R$ ${((Date.now()-c.inicio)/3600000*parseFloat(precoHoraInput.value)).toFixed(2)}`
      : `R$ ${c.valor.toFixed(2)}`;

    // tempo
    const pTime = document.createElement("p");
    if (c.aberto) {
      // cronômetro cresce
      setInterval(()=>{
        const ms = Date.now()-c.inicio;
        const m = Math.floor(ms/60000), s = Math.floor((ms%60000)/1000);
        pTime.textContent = `Usado: ${m}m ${s}s`;
      }, 1000);
    } else {
      // countdown fixo
      const target = c.inicio + c.tempoMin*60000;
      const iv = setInterval(()=>{
        const rem = target - Date.now();
        if (rem<=0) {
          pTime.textContent = "Tempo esgotado!";
          if (!c.alertado) { alarme.play(); c.alertado=true; }
          clearInterval(iv);
        } else {
          const m = Math.floor(rem/60000), s = Math.floor((rem%60000)/1000);
          pTime.textContent = `Restante: ${m}m ${s}s`;
        }
      }, 1000);
    }

    // botões
    const actions = document.createElement("div"); actions.className="actions";
    const stopBtn = document.createElement("button"); stopBtn.textContent="Parar";
    stopBtn.onclick = ()=>{
      // adiciona ao histórico
      const tempoUsado = c.aberto
        ? ((Date.now()-c.inicio)/60000).toFixed(0)
        : c.tempoMin;
      const valorFinal = c.aberto
        ? ((Date.now()-c.inicio)/3600000*parseFloat(precoHoraInput.value))
        : c.valor;
      historico.push({ tipo:c.tipo, nome:c.nome, tempo:tempoUsado, valor:valorFinal });
      salvarHistorico(); carregarHistorico();
      clientes.splice(idx,1); salvarClientes(); renderClientes(); atualizarNomeCombo();
    };
    const addTimeBtn = document.createElement("button"); addTimeBtn.textContent="Adicionar Tempo";
    addTimeBtn.onclick = ()=>{
      const escolha = prompt("Digite minutos para adicionar (30,60,90,120,0 para aberto):");
      const m = parseFloat(escolha);
      if (isNaN(m)) return;
      c.tempoMin = c.aberto ? 0 : c.tempoMin + (m>0? m: 0);
      if (m>0) c.valor += (m/60)*parseFloat(precoHoraInput.value);
      c.alertado = false;
      c.inicio = Date.now();
      salvarClientes(); renderClientes(); atualizarNomeCombo();
    };
    const remBtn = document.createElement("button"); remBtn.textContent="Remover";
    remBtn.onclick = ()=>{
      if (confirm("Remover cliente?")) {
        clientes.splice(idx,1); salvarClientes(); renderClientes(); atualizarNomeCombo();
      }
    };

    actions.append(stopBtn, addTimeBtn, remBtn);
    div.append(img,h3,pTime,pVal,actions);
    clientesDiv.append(div);
  });
}

window.onload = () => {
  // inicializa selects
  ["PS5","PC"].forEach(t=>tipoSelect.add(new Option(t,t)));
  atualizarNomeCombo();
  renderClientes();
  carregarHistorico();
};
