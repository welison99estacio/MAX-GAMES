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

const modal = document.getElementById("modal");
const mNome = document.getElementById("modal-nome");
const mInicio = document.getElementById("modal-inicio");
const mTempo = document.getElementById("modal-tempo");
const mValor = document.getElementById("modal-valor");
const mParar = document.getElementById("modal-parar");
const mAddTempo = document.getElementById("modal-adicionar-tempo");
const mLista = document.getElementById("modal-tempos-lista");
const mSalvarNome = document.getElementById("modal-salvar-nome");
const mFechar = document.getElementById("modal-fechar");

let clientes = JSON.parse(localStorage.getItem("clientes")) || [];
let historico = JSON.parse(localStorage.getItem("historico")) || [];
let tempoSelecionado = null;
let ativoIndex = null;

// persistência
const salvarClientes = ()=> localStorage.setItem("clientes", JSON.stringify(clientes));
const salvarHistorico = ()=> localStorage.setItem("historico", JSON.stringify(historico));

// histórico
function carregarHistorico(){
  historicoUl.innerHTML = "";
  historico.forEach(i=>{
    const li=document.createElement("li");
    li.textContent=`${i.tipo} ${i.nome} — ${i.tempo} min — R$ ${i.valor.toFixed(2)}`;
    historicoUl.appendChild(li);
  });
}

// config
limparHistoricoBtn.onclick = ()=> {
  if(confirm("Limpar histórico?")){
    historico=[]; salvarHistorico(); carregarHistorico();
  }
};
abrirConfigBtn.onclick = ()=>{ configSection.classList.remove("escondido"); carregarHistorico(); };
fecharConfigBtn.onclick = ()=> configSection.classList.add("escondido");

// opções iniciais
window.onload = ()=>{
  ["PS5","PC"].forEach(t=> tipoSelect.add(new Option(t,t)));
  atualizarNomeCombo();
  renderClientes();
  carregarHistorico();
};

// combobox dinâmica
function atualizarNomeCombo(){
  const tipo=tipoSelect.value;
  nomeSelect.innerHTML="";
  const usados=clientes.filter(c=>c.tipo===tipo).map(c=>c.nome);
  let i=1;
  while(usados.includes(`${tipo} ${i}`)) i++;
  nomeSelect.add(new Option(`${tipo} ${i}`,`${tipo} ${i}`));
}
tipoSelect.onchange = atualizarNomeCombo;

// seleção de tempo
document.querySelectorAll("#temposRapidos button").forEach(btn=>{
  btn.onclick = ()=>{
    tempoSelecionado=parseFloat(btn.dataset.min);
    document.querySelectorAll("#temposRapidos button")
      .forEach(b=>b.classList.remove("selecionado"));
    btn.classList.add("selecionado");
  };
});

// adicionar cliente
form.onsubmit = e=>{
  e.preventDefault();
  if(tempoSelecionado===null) return alert("Selecione um tempo!");
  const tipo=tipoSelect.value, nome=nomeSelect.value;
  const tMin=tempoSelecionado, now=Date.now();
  const preco= parseFloat(precoHoraInput.value)||0;
  const valorFixo = tMin>0 ? (tMin/60)*preco : 0;
  clientes.push({ tipo,nome,tMin,valor:valorFixo,inicio:now,alertado:false,aberto:tMin===0 });
  salvarClientes(); renderClientes(); atualizarNomeCombo();
  tempoSelecionado=null;
  form.querySelectorAll("#temposRapidos button")
    .forEach(b=>b.classList.remove("selecionado"));
};

// renderiza clientes
function renderClientes(){
  clientesDiv.innerHTML="";
  clientes.forEach((c,idx)=>{
    const card=document.createElement("div");
    card.className="cliente";
    card.onclick = ()=> abrirModal(idx);
    const img=document.createElement("img");
    img.src = c.tipo==="PS5"?"ps5.jpg":"PC.png";
    const pTempo=document.createElement("p");
    pTempo.textContent = c.aberto
      ? formatDuration(Date.now()-c.inicio)
      : `Restante ${formatDuration(c.tMin*60000 - (Date.now()-c.inicio))}`;
    card.append(img,pTempo);
    clientesDiv.append(card);
  });
}

// utilitário tempo
function formatDuration(ms){
  const m=Math.floor(ms/60000), s=Math.floor((ms%60000)/1000);
  return `${m}m ${s}s`;
}

// modal
function abrirModal(idx){
  ativoIndex=idx;
  const c=clientes[idx];
  mNome.textContent = c.nome;
  const data=new Date(c.inicio);
  mInicio.textContent = `${String(data.getHours()).padStart(2,'0')}:${String(data.getMinutes()).padStart(2,'0')} - ${String(data.getDate()).padStart(2,'0')}/${String(data.getMonth()+1).padStart(2,'0')}/${data.getFullYear()}`;
  mValor.textContent = c.valor.toFixed(2);
  atualizarModalTempo();
  // botões
  mParar.classList.remove("escondido");
  mLista.classList.add("escondido");
  mAddTempo.classList.add("escondido");
  if(!c.aberto && Date.now() >= c.inicio + c.tMin*60000){
    mAddTempo.classList.remove("escondido");
    mLista.classList.remove("escondido");
  }
  modal.classList.remove("escondido");
}

// tempo no modal
function atualizarModalTempo(){
  const c=clientes[ativoIndex];
  if(c.aberto){
    mTempo.textContent = formatDuration(Date.now()-c.inicio);
  } else {
    const rem = c.inicio + c.tMin*60000 - Date.now();
    mTempo.textContent = rem>0 ? formatDuration(rem) : "Esgotado";
  }
}

// ações modal
mFechar.onclick = ()=> modal.classList.add("escondido");

mParar.onclick = ()=>{
  const c=clientes[ativoIndex];
  historico.push({
    tipo:c.tipo, nome:c.nome,
    tempo: c.aberto ? Math.floor((Date.now()-c.inicio)/60000) : c.tMin,
    valor: c.valor
  });
  clientes.splice(ativoIndex,1);
  salvarClientes(); salvarHistorico(); renderClientes(); modal.classList.add("escondido"); atualizarNomeCombo();
};

mAddTempo.onclick = ()=>{
  const extra = parseFloat(mLista.value);
  const c=clientes[ativoIndex];
  // só para expirados
  if(!c.aberto){
    c.tMin += extra>0? extra: 0;
    c.inicio = Date.now();
    c.valor += (extra/60)*parseFloat(precoHoraInput.value);
    c.alertado=false;
    salvarClientes(); renderClientes(); abrirModal(ativoIndex);
  }
};

mSalvarNome.onclick = ()=>{
  const novo = prompt("Novo nome:", clientes[ativoIndex].nome);
  if(novo){
    clientes[ativoIndex].nome = novo;
    salvarClientes(); renderClientes(); abrirModal(ativoIndex);
  }
};

// atualizar tempo do modal a cada segundo
setInterval(()=>{
  if(ativoIndex!==null && !modal.classList.contains("escondido")){
    atualizarModalTempo();
  }
},1000);
