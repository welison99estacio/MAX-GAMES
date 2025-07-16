// script.js

// --- DOM ELEMENTS ---
const body            = document.body;

// Theme toggle
const toggleTheme     = document.getElementById("toggleTheme");
const themeLabel      = document.getElementById("themeLabel");

// Section buttons & containers
const btnValores      = document.getElementById("btnValores");
const btnConfig       = document.getElementById("btnConfig");
const btnMostrarForm  = document.getElementById("mostrarForm");
const valoresSection  = document.getElementById("valoresSection");
const configSection   = document.getElementById("configSection");
const formSection     = document.getElementById("formSection");

// Import/Export
const btnExport       = document.getElementById("exportClientes");
const btnImport       = document.getElementById("importClientes");
const importFile      = document.getElementById("importFile");

// Tariffs
const precoPS5Input   = document.getElementById("precoPS5");
const precoPCInput    = document.getElementById("precoPC");
const salvarPS5Btn    = document.getElementById("salvarPS5");
const salvarPCBtn     = document.getElementById("salvarPC");

// History
const historicoTable  = document.querySelector("#historicoTable tbody");
const limparHistBtn   = document.getElementById("limparHistoricoValores");

// Form
const tipoRadios      = document.getElementsByName("tipo");
const nomeSelect      = document.getElementById("nome");
const tempoSelect     = document.getElementById("tempo");
const adicionarBtn    = document.getElementById("adicionar");

// Clients list
const clientesDiv     = document.getElementById("clientes");

// Client modal
const modal           = document.getElementById("modal");
const mNomeText       = document.getElementById("modal-nome-text");
const mEdit           = document.getElementById("modal-edit");
const mInicio         = document.getElementById("modal-inicio");
const mTempo          = document.getElementById("modal-tempo");
const mValor          = document.getElementById("modal-valor");
const mConsumosList   = document.getElementById("modal-consumos");
const mTotalProdutos  = document.getElementById("modal-total-produtos");
const mTotalGeral     = document.getElementById("modal-total-geral");
const mParar          = document.getElementById("modal-parar");
const mAddTempo       = document.getElementById("modal-adicionar-tempo");
const mLista          = document.getElementById("modal-tempos-lista");
const mProdSelect     = document.getElementById("modal-produtos-lista");
const mAddProdutoBtn  = document.getElementById("modal-adicionar-produto");
const mFechar         = document.getElementById("modal-fechar");

// Alarm audio
const alarme          = document.getElementById("alarme");

// --- PERSISTENT STORAGE ---
let clientes  = JSON.parse(localStorage.getItem("clientes"))  || [];
let historico = JSON.parse(localStorage.getItem("historico")) || [];
let ativoIndex = null;

// --- THEME INIT ---
const savedTheme = localStorage.getItem("theme") || "light";
body.classList.add("theme-" + savedTheme);
toggleTheme.checked = (savedTheme === "dark");
themeLabel.textContent = savedTheme === "dark" ? "Escuro" : "Claro";

// Toggle theme
toggleTheme.onchange = () => {
  if (toggleTheme.checked) {
    body.classList.replace("theme-light","theme-dark");
    themeLabel.textContent = "Escuro";
    localStorage.setItem("theme","dark");
  } else {
    body.classList.replace("theme-dark","theme-light");
    themeLabel.textContent = "Claro";
    localStorage.setItem("theme","light");
  }
};

// --- SECTION SWITCHING ---
function showSection(sec) {
  [valoresSection, configSection, formSection].forEach(s=> s.classList.add("escondido"));
  sec.classList.remove("escondido");
}
btnValores.onclick     = () => showSection(valoresSection);
btnConfig.onclick      = () => showSection(configSection);
btnMostrarForm.onclick = () => showSection(formSection);

// --- IMPORT / EXPORT CLIENTES ---
btnExport.onclick = () => {
  const data = JSON.stringify(clientes, null, 2);
  const blob = new Blob([data], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "clientes-backup.json"; a.click();
  URL.revokeObjectURL(url);
};
btnImport.onclick = () => importFile.click();
importFile.onchange = e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = evt => {
    try {
      const arr = JSON.parse(evt.target.result);
      localStorage.setItem("clientes", JSON.stringify(arr));
      alert("Clientes importados. Recarregue a página.");
    } catch {
      alert("Arquivo inválido.");
    }
  };
  reader.readAsText(file);
};

// --- LOAD / SAVE TARIFFS ---
precoPS5Input.value = localStorage.getItem("precoPS5") || 6;
precoPCInput.value  = localStorage.getItem("precoPC")  || 6;
salvarPS5Btn.onclick = () => {
  localStorage.setItem("precoPS5", precoPS5Input.value);
  alert("Preço PS5 salvo!");
};
salvarPCBtn.onclick = () => {
  localStorage.setItem("precoPC", precoPCInput.value);
  alert("Preço PC salvo!");
};

// --- RENDER HISTÓRICO ---
function renderHistorico() {
  historicoTable.innerHTML = "";
  historico.forEach((h, i) => {
    const tr = document.createElement("tr");
    if (h.status === "paid")    tr.classList.add("paid");
    if (h.status === "pending") tr.classList.add("pending");
    tr.innerHTML = `
      <td>${h.nome}</td>
      <td>R$ ${h.totalGeral.toFixed(2)}</td>
      <td>${new Date(h.data).toLocaleDateString("pt-BR")}</td>
    `;
    tr.ondblclick = () => abrirDetalhes(h, i);
    historicoTable.appendChild(tr);
  });
}
limparHistBtn.onclick = () => {
  if (confirm("Limpar histórico?")) {
    historico = [];
    localStorage.setItem("historico", JSON.stringify(historico));
    renderHistorico();
  }
};

// --- PARAR CLIENTE & SALVAR DETALHES ---
function pararClienteDetalhado(idx) {
  const c = clientes[idx];
  const totalProdutos = (c.produtos||[])
    .reduce((sum,p)=> sum + (p.valor*p.qtd), 0);
  const valorTempo = c.valor;
  const entry = {
    nome:c.nome, tipo:c.tipo, valorTempo,
    produtos:c.produtos||[], totalProdutos,
    totalGeral: valorTempo + totalProdutos,
    data: new Date().toISOString(),
    status: null
  };
  historico.push(entry);
  localStorage.setItem("historico", JSON.stringify(historico));
  clientes.splice(idx,1);
  localStorage.setItem("clientes", JSON.stringify(clientes));
  renderClientes();
  renderHistorico();
}

// --- ABRIR DETALHES HISTÓRICO & STATUS BUTTONS ---
function abrirDetalhes(h, index) {
  const md = document.createElement("div");
  md.className = "modal";
  md.innerHTML = `
    <div class="modal-content">
      <h2>${h.nome} — ${h.tipo}</h2>
      <p><strong>Data:</strong> ${new Date(h.data)
        .toLocaleString("pt-BR",{hour:"2-digit",minute:"2-digit",day:"2-digit",month:"2-digit",year:"numeric"})}</p>
      <p><strong>Tempo:</strong> R$ ${h.valorTempo.toFixed(2)}</p>
      <h3>Produtos</h3>
      <ul>
        ${ h.produtos.length>0
           ? h.produtos.map((p,i)=>`<li>
               ${p.nome} (x${p.qtd}) – R$ ${(p.valor*p.qtd).toFixed(2)}
             </li>`).join("")
           : "<li>— nenhum —</li>"
        }
      </ul>
      <p><strong>Total produtos:</strong> R$ ${h.totalProdutos.toFixed(2)}</p>
      <p><strong>Total geral:</strong> R$ ${h.totalGeral.toFixed(2)}</p>
      <div class="modal-status">
        <button id="btnDevendo">Devendo</button>
        <button id="btnPago">Pago</button>
      </div>
      <div style="text-align:right; margin-top:10px;">
        <button id="fecharHistDetalhes">Fechar</button>
      </div>
    </div>
  `;
  document.body.appendChild(md);
  document.getElementById("fecharHistDetalhes").onclick = () => md.remove();
  document.getElementById("btnDevendo").onclick = () => {
    historico[index].status = "pending";
    localStorage.setItem("historico", JSON.stringify(historico));
    renderHistorico();
    md.remove();
  };
  document.getElementById("btnPago").onclick = () => {
    historico[index].status = "paid";
    localStorage.setItem("historico", JSON.stringify(historico));
    renderHistorico();
    md.remove();
  };
}

// --- DYNAMIC CLIENT FORM SELECTS ---
function atualizarNomeETempo() {
  const tipo = [...tipoRadios].find(r=>r.checked)?.value;
  nomeSelect.innerHTML = "";
  const usados = clientes.filter(c=>c.tipo===tipo).map(c=>c.nome);
  let i=1; while (usados.includes(`${tipo} ${i}`)) i++;
  nomeSelect.add(new Option(`${tipo} ${i}`, `${tipo} ${i}`));
  nomeSelect.classList.remove("escondido");
  tempoSelect.classList.remove("escondido");
}
[...tipoRadios].forEach(r=> r.onchange = atualizarNomeETempo);

// --- ADD NEW CLIENT ---
adicionarBtn.onclick = () => {
  const tipo = [...tipoRadios].find(r=>r.checked)?.value;
  const nome = nomeSelect.value;
  const tMin = parseFloat(tempoSelect.value);
  if(!tipo||!nome||isNaN(tMin)) return alert("Preencha todos os campos!");
  const now = Date.now();
  const key = tipo==="PS5" ? "precoPS5" : "precoPC";
  const preco = parseFloat(localStorage.getItem(key))||0;
  const valorFixo = tMin>0 ? (tMin/60)*preco : 0;
  clientes.push({ tipo,nome,tMin,valor:valorFixo,inicio:now,alertado:false,aberto:tMin===0,produtos:[] });
  localStorage.setItem("clientes", JSON.stringify(clientes));
  renderClientes();
  showSection(formSection);
};

// --- REAL-TIME CLIENT TIMER UPDATE ---
setInterval(()=> {
  document.querySelectorAll(".cliente").forEach((card, idx)=>{
    const c = clientes[idx];
    const p = card.querySelector("p");
    if(c.aberto) {
      p.textContent = formatDuration(Date.now()-c.inicio);
    } else {
      const rem = c.inicio + c.tMin*60000 - Date.now();
      p.textContent = rem>0 ? `Restante ${formatDuration(rem)}` : "Esgotado";
      if(rem<=0 && !c.alertado) {
        alarme.play();
        if(Notification.permission==="granted")
          new Notification("Tempo esgotado",{body:`${c.nome} acabou!`});
        c.alertado = true;
        localStorage.setItem("clientes", JSON.stringify(clientes));
      }
    }
  });
}, 1000);

// --- RENDER ACTIVE CLIENT CARDS ---
function renderClientes() {
  clientesDiv.innerHTML = "";
  clientes.forEach((c, idx)=>{
    const card = document.createElement("div");
    card.className = "cliente";
    card.onclick = () => abrirModal(idx);
    card.innerHTML = `
      <strong style="display:block; margin-bottom:4px;">${c.nome}</strong>
      <img src="${c.tipo==='PS5'?'ps5.jpg':'PC.png'}" alt="${c.tipo}">
      <p></p>
    `;
    clientesDiv.appendChild(card);
  });
}

// --- FORMAT DURATION ---
function formatDuration(ms) {
  const m = Math.floor(ms/60000), s = Math.floor((ms%60000)/1000);
  return `${m}m ${s}s`;
}

// --- OPEN CLIENT MODAL & REMOVE CONSUMPTION ---
function abrirModal(idx) {
  ativoIndex = idx;
  const c = clientes[idx];
  mNomeText.textContent = c.nome;
  mInicio.textContent = new Date(c.inicio)
    .toLocaleString("pt-BR",{hour:"2-digit",minute:"2-digit",day:"2-digit",month:"2-digit",year:"numeric"});
  mValor.textContent = c.valor.toFixed(2);

  // render consumos with remove buttons
  mConsumosList.innerHTML = "";
  (c.produtos||[]).forEach((p,i)=>{
    const li = document.createElement("li");
    li.innerHTML = `
      ${p.nome} (x${p.qtd}) – R$ ${(p.valor*p.qtd).toFixed(2)}
      <button class="cons-remove" data-i="${i}" title="Remover">🗑️</button>
    `;
    mConsumosList.appendChild(li);
  });
  if((c.produtos||[]).length===0) mConsumosList.innerHTML = "<li>— nenhum —</li>";

  // attach remove handlers
  mConsumosList.querySelectorAll(".cons-remove").forEach(btn=>{
    btn.onclick = () => {
      const i = parseInt(btn.dataset.i);
      c.produtos.splice(i,1);
      localStorage.setItem("clientes", JSON.stringify(clientes));
      abrirModal(idx);
    };
  });

  const totalProd = (c.produtos||[]).reduce((s,p)=> s+p.valor*p.qtd,0);
  mTotalProdutos.textContent = totalProd.toFixed(2);
  mTotalGeral.textContent    = (c.valor+totalProd).toFixed(2);

  // load products dropdown
  const prodList = JSON.parse(localStorage.getItem("produtos"))||[];
  mProdSelect.innerHTML = prodList.map((p,i)=>`
    <option value="${i}">${p.nome} — R$ ${p.valor.toFixed(2)}</option>
  `).join("");

  mParar.classList.remove("escondido");
  const expirou = (!c.aberto && Date.now()>=c.inicio+c.tMin*60000);
  mAddTempo.classList.toggle("escondido", !expirou);
  mLista.classList.toggle("escondido", !expirou);

  modal.classList.remove("escondido");
}

// --- CLIENT MODAL ACTIONS ---
mFechar.onclick     = () => modal.classList.add("escondido");
mParar.onclick      = () => pararClienteDetalhado(ativoIndex);
mAddTempo.onclick   = () => {
  const extra = parseFloat(mLista.value);
  const c = clientes[ativoIndex];
  if(!c.aberto) {
    c.tMin += extra>0? extra: 0;
    c.inicio = Date.now();
    const key = c.tipo==="PS5"?"precoPS5":"precoPC";
    c.valor += (extra/60)*(parseFloat(localStorage.getItem(key))||0);
    c.alertado = false;
    localStorage.setItem("clientes", JSON.stringify(clientes));
    renderClientes(); abrirModal(ativoIndex);
  }
};
mAddProdutoBtn.onclick = () => {
  const pi = parseInt(mProdSelect.value);
  const prodList = JSON.parse(localStorage.getItem("produtos"))||[];
  const p = prodList[pi]; if(!p) return;
  const c = clientes[ativoIndex];
  c.produtos = c.produtos||[];
  c.produtos.push({nome:p.nome, valor:p.valor, qtd:1});
  localStorage.setItem("clientes", JSON.stringify(clientes));
  abrirModal(ativoIndex);
};
mEdit.onclick = () => {
  const novo = prompt("Novo nome:", clientes[ativoIndex].nome);
  if(novo) {
    clientes[ativoIndex].nome = novo;
    localStorage.setItem("clientes", JSON.stringify(clientes));
    renderClientes(); abrirModal(ativoIndex);
  }
};

// --- INITIALIZATION ---
window.onload = () => {
  // ensure status field
  historico = historico.map(h => h.status===undefined? {...h, status:null}: h);
  showSection(formSection);
  renderClientes();
  renderHistorico();
  if ("Notification" in window) Notification.requestPermission();
};
