// Troque 'http://localhost:3000' pela URL do servidor onde seu Server.js for hospedado
const API_BASE_URL = "https://api-estudio-cilios.onrender.com"; 

document.addEventListener("DOMContentLoaded", () => {

  const inputData = document.getElementById("data");
  const inputHorario = document.getElementById("horario");
  const gradeHorarios = document.getElementById("gradeHorarios");

  const TODOS_OS_HORARIOS = [
    "08:00", "09:00", "10:00", "11:00", 
    "13:00", "14:00", "15:00", "16:00", "17:00"
  ];

  // Função que consulta o backend e desenha os botões de horário (Livres vs Ocupados)
  async function carregarHorariosDoDia(dataSelecionada) {
    inputData.value = dataSelecionada;
    inputHorario.value = ""; // Reseta o horário selecionado ao trocar de dia

    gradeHorarios.innerHTML = `
      <div class="col-12 text-center py-3 text-muted small">
        <div class="spinner-border spinner-border-sm text-danger me-2" role="status"></div>
        Consultando agenda...
      </div>
    `;

    try {
      const response = await fetch(`${API_BASE_URL}/api/horarios-ocupados?data=${dataSelecionada}`);
      const resultado = await response.json();

      if (resultado.sucesso) {
        // Extrai os horários ocupados no formato "HH:MM"
        const horasOcupadas = resultado.ocupados.map(item => {
          const dataHoraInicio = new Date(item.start);
          return dataHoraInicio.toLocaleTimeString("pt-BR", { 
            hour: "2-digit", 
            minute: "2-digit",
            timeZone: "America/Sao_Paulo" 
          });
        });

        gradeHorarios.innerHTML = "";

        TODOS_OS_HORARIOS.forEach(hora => {
          const estaOcupado = horasOcupadas.includes(hora);
          
          const col = document.createElement("div");
          col.className = "col-4";

          const btn = document.createElement("button");
          btn.type = "button";
          btn.textContent = hora;

          if (estaOcupado) {
            btn.className = "slot-btn ocupado";
            btn.disabled = true;
            btn.title = "Horário já reservado";
          } else {
            btn.className = "slot-btn";
            btn.addEventListener("click", () => {
              // Remove seleção anterior
              document.querySelectorAll(".slot-btn").forEach(b => b.classList.remove("active"));
              // Marca o botão atual como selecionado
              btn.classList.add("active");
              inputHorario.value = hora;
            });
          }

          col.appendChild(btn);
          gradeHorarios.appendChild(col);
        });

      } else {
        gradeHorarios.innerHTML = `<div class="col-12 text-danger small text-center">Erro ao buscar agenda: ${resultado.mensagem}</div>`;
      }
    } catch (erro) {
      console.error("Erro na requisição:", erro);
      gradeHorarios.innerHTML = `<div class="col-12 text-danger small text-center">Não foi possível conectar com o servidor.</div>`;
    }
  }

  // Inicializa o Calendário Visual (Flatpickr)
  if (typeof flatpickr !== "undefined") {
    const hoje = new Date().toISOString().split("T")[0];

    flatpickr("#calendarioInline", {
      inline: true,
      locale: "pt",
      minDate: "today",
      dateFormat: "Y-m-d",
      defaultDate: hoje,
      onChange: function(selectedDates, dateStr) {
        if (dateStr) {
          carregarHorariosDoDia(dateStr);
        }
      }
    });

    // Já carrega os horários do dia de hoje ao abrir o site
    carregarHorariosDoDia(hoje);
  }

  // Envio do Formulário
  const formAgendamento = document.getElementById("formAgendamento");
  
  if (formAgendamento) {
    formAgendamento.addEventListener("submit", async function (event) {
      event.preventDefault();

      if (!inputData.value) {
        alert("Por favor, selecione uma data no calendário.");
        return;
      }

      if (!inputHorario.value) {
        alert("Por favor, clique em um dos horários livres.");
        return;
      }

      const btnSubmit = document.getElementById("btnSubmit");
      if (btnSubmit) {
        btnSubmit.innerText = "Processando...";
        btnSubmit.disabled = true;
      }

      const dadosAgendamento = {
        nomeCliente: document.getElementById("nome").value,
        telefoneCliente: document.getElementById("telefone").value,
        data: inputData.value,
        horario: inputHorario.value,
        duracaoMinutos: 90,
      };

      try {
        const resposta = await fetch(`${API_BASE_URL}/api/agendamentos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dadosAgendamento),
        });

        const resultado = await resposta.json();

        if (resultado.sucesso) {
          alert("Horário agendado com sucesso!");
          const dataAgendada = inputData.value;
          formAgendamento.reset();
          // Recarrega os horários daquele dia para mostrar o novo horário já como ocupado
          carregarHorariosDoDia(dataAgendada);
        } else {
          alert("Erro: " + resultado.mensagem);
        }
      } catch (erro) {
        console.error("Erro:", erro);
        alert("Falha na comunicação com o servidor.");
      } finally {
        if (btnSubmit) {
          btnSubmit.innerText = "Confirmar Agendamento";
          btnSubmit.disabled = false;
        }
      }
    });
  }
});