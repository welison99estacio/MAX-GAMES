// script.js
const form = document.getElementById("formulario");
const tipoSelect = document.getElementById("tipo");
const nomeSelect = document.getElementById("nome");
const precoHoraInput = document.getElementById("precoHora");
const salvarPrecoBtn = document.getElementById("salvarPreco");
const clientesDiv = document.getElementById("clientes");
const abrirConfigBtn = document.getElementById("abrirConfig");
const configSection = document.getElementById("config");
const historicoUl = document.getElementById("historico");
const limparHistoricoBtn = document.getElementById("limparHistorico");
const alarme = document.getElementById("alarme");

const modal = document.getElementById("modal");
const mNomeText = document.getElementById("modal-nome-text");
const mEdit = document.getElementById("modal-edit");
const mInicio = document.getElementById("modal-inicio");
const mTempo = document.getElementById("modal-tempo");
const mValor = document.getElementById("modal-valor");
const mParar = document.getElementById("modal-parar");
const mAddTempo = document.getElementById("modal-adicionar-tempo");
const mLista = document.getElementById("modal-tempos-lista");
const mFechar = document.getElementById("modal-fechar");

let clientes = JSON.parse(localStorage.getItem("clientes")) || [];
let historico = JSON.parse(localStorage.getItem("historico")) || [];
let tempoSelecionado = null;
let ativoIndex = null;

// load precoHora
precoHoraInput.value = localStorage.getItem("precoHora") || 6;

// persistência
const salvarClientes = ()=> localStorage.setItem("clientes", JSON.stringify(clientes));
const salvarHistorico = ()=> localStorage.setItem("historico", JSON.stringify(historico));
const salvarPreco = ()=>{
  localStorage.setItem("precoHora", precoHoraInput.value);
  alert("Preço salvo!");
};

// histórico
function carregarHistorico(){
  historicoUl.innerHTML = "";
  historico.forEach(i=>{
    const li = document.createElement("li");
    li.textContent = `${i.tipo} ${i.nome} — ${i.tempo} min — R$ ${i.valor.toFixed(2)}`;
    historicoUl.appendChild(li);
  });
}

// config btn
abrirConfigBtn.onclick = ()=>{
  configSection.classList.toggle("escondido");
  carregarHistorico();
};
salvarPrecoBtn.onclick = salvarPreco;
limparHistoricoBtn.onclick = ()=>{
  if(confirm("Limpar histórico?")){
    historico=[]; salvarHistorico(); carregarHistorico();
  }
};

// combobox dinâmica
function atualizarNomeCombo(){
  const tipo = tipoSelect.value;
  nomeSelect.innerHTML = "";
  const usados = clientes.filter(c=>c.tipo===tipo).map(c=>c.nome);
  let i=1;
  while(usados.includes(`${tipo} ${i}`)) i++;
  nomeSelect.add(new Option(`${tipo} ${i}`, `${tipo} ${i}`));
}
window.onload = ()=>{
  ["PS5","PC"].forEach(t=> tipoSelect.add(new Option(t,t)));
  atualizarNomeCombo();
  renderClientes();
  carregarHistorico();
  // notifications
  if ("Notification" in window) Notification.requestPermission();
};

// seleção de tempo rápido
document.querySelectorAll("#temposRapidos button").forEach(btn=>{
  btn.onclick = ()=>{
    tempoSelecionado = parseFloat(btn.dataset.min);
    document.querySelectorAll("#temposRapidos button")
      .forEach(b=>b.classList.remove("selecionado"));
    btn.classList.add("selecionado");
  };
});

// adicionar cliente
form.onsubmit = e=>{
  e.preventDefault();
  if(tempoSelecionado===null) return alert("Selecione um tempo!");
  const tipo = tipoSelect.value, nome = nomeSelect.value;
  const tMin = tempoSelecionado, now = Date.now();
  const preco = parseFloat(precoHoraInput.value)||0;
  const valorFixo = tMin>0 ? (tMin/60)*preco : 0;
  clientes.push({
    tipo, nome,
    tMin, valor: valorFixo,
    inicio: now, alertado: false,
    aberto: tMin===0
  });
  salvarClientes(); renderClientes(); atualizarNomeCombo();
  tempoSelecionado = null;
  form.querySelectorAll("#temposRapidos button")
    .forEach(b=>b.classList.remove("selecionado"));
};

// atualiza cards em tempo real
setInterval(()=>{
  document.querySelectorAll(".cliente").forEach((card, idx)=>{
    const c = clientes[idx];
    const p = card.querySelector("p");
    if(c.aberto){
      p.textContent = formatDuration(Date.now()-c.inicio);
    } else {
      const rem = c.inicio + c.tMin*60000 - Date.now();
      p.textContent = rem>0
        ? `Restante ${formatDuration(rem)}`
        : "Esgotado";
      if(rem<=0 && !c.alertado){
        alarme.play();
        if(Notification.permission==="granted"){
          new Notification("Tempo esgotado", { body: `${c.nome} acabou!` });
        }
        c.alertado = true;
        salvarClientes();
      }
    }
  });
},1000);

// renderiza clientes
function renderClientes(){
  clientesDiv.innerHTML = "";
  clientes.forEach((c,idx)=>{
    const card = document.createElement("div");
    card.className = "cliente";
    card.onclick = ()=> abrirModal(idx);
    const img = document.createElement("img");
    img.src = c.tipo==="PS5"?"ps5.jpg":"PC.png";
    const p = document.createElement("p");
    card.append(img,p);
    clientesDiv.append(card);
  });
}

// utilitário tempo
function formatDuration(ms){
  const m = Math.floor(ms/60000), s = Math.floor((ms%60000)/1000);
  return `${m}m ${s}s`;
}

// modal
function abrirModal(idx){
  ativoIndex = idx;
  const c = clientes[idx];
  mNomeText.textContent = c.nome;
  mInicio.textContent = new Date(c.inicio)
    .toLocaleString('pt-BR',{ hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit', year:'numeric' });
  mValor.textContent = c.aberto
    ? ((Date.now()-c.inicio)/3600000*parseFloat(precoHoraInput.value)).toFixed(2)
    : c.valor.toFixed(2);
  atualizarModalTempo();
  mParar.classList.remove("escondido");
  mAddTempo.classList.toggle("escondido", !( !c.aberto && Date.now() >= c.inicio + c.tMin*60000 ));
  mLista.classList.toggle("escondido", mAddTempo.classList.contains("escondido"));
  modal.classList.remove("escondido");
}

// tempo no modal
function atualizarModalTempo(){
  const c = clientes[ativoIndex];
  mTempo.textContent = c.aberto
    ? formatDuration(Date.now()-c.inicio)
    : (Date.now() < c.inicio + c.tMin*60000
       ? formatDuration(c.inicio + c.tMin*60000 - Date.now())
       : "Esgotado");
}

// ações modal
mParar.onclick = ()=>{
  const c = clientes[ativoIndex];
  historico.push({
    tipo: c.tipo,
    nome: c.nome,
    tempo: c.aberto
      ? Math.floor((Date.now()-c.inicio)/60000)
      : c.tMin,
    valor: c.valor
  });
  clientes.splice(ativoIndex,1);
  salvarClientes(); salvarHistorico();
  renderClientes(); carregarHistorico();
  modal.classList.add("escondido");
  atualizarNomeCombo();
};

mAddTempo.onclick = ()=>{
  const extra = parseFloat(mLista.value);
  const c = clientes[ativoIndex];
  if(!c.aberto){
    c.tMin += extra>0? extra: 0;
    c.inicio = Date.now();
    c.valor += (extra/60)*parseFloat(precoHoraInput.value);
    c.alertado = false;
    salvarClientes(); renderClientes(); abrirModal(ativoIndex);
  }
};

mFechar.onclick = ()=> modal.classList.add("escondido");

// editar nome
mEdit.onclick = ()=>{
  const novo = prompt("Novo nome:", clientes[ativoIndex].nome);
  if(novo){
    clientes[ativoIndex].nome = novo;
    salvarClientes();
    renderClientes();
    abrirModal(ativoIndex);
  }
};
