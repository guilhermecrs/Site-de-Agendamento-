document.addEventListener("DOMContentLoaded", () => {

  const inputData = document.getElementById("data");
  const selectHorario = document.getElementById("horario");

  // Altere aqui para os horários reais que você atende
  const TODOS_OS_HORARIOS = [
    "08:00", "09:00", "10:00", "11:00", 
    "13:00", "14:00", "15:00", "16:00", "17:00"
  ];

  if (inputData && selectHorario) {
    inputData.addEventListener("change", async (event) => {
      const dataSelecionada = event.target.value;
      if (!dataSelecionada) return;

      selectHorario.disabled = true;
      selectHorario.innerHTML = '<option value="">Buscando horários...</option>';

      try {
        const response = await fetch(`http://localhost:3000/api/horarios-ocupados?data=${dataSelecionada}`);
        const resultado = await response.json();

        if (resultado.sucesso) {
          const horasOcupadas = resultado.ocupados.map(item => {
            const dataHoraInicio = new Date(item.start);
            return dataHoraInicio.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
          });

          selectHorario.innerHTML = '<option value="">Selecione um horário</option>';

          TODOS_OS_HORARIOS.forEach(hora => {
            if (!horasOcupadas.includes(hora)) {
              const option = document.createElement("option");
              option.value = hora;
              option.textContent = hora;
              selectHorario.appendChild(option);
            }
          });

          selectHorario.disabled = false;
        } else {
          alert("Erro ao buscar a agenda: " + resultado.mensagem);
          selectHorario.innerHTML = '<option value="">Erro ao carregar</option>';
        }
      } catch (erro) {
        console.error("Erro na requisição:", erro);
        alert("Não foi possível conectar com o servidor.");
        selectHorario.innerHTML = '<option value="">Erro de conexão</option>';
      }
    });
  }

  const formAgendamento = document.getElementById("formAgendamento");
  
  if (formAgendamento) {
    formAgendamento.addEventListener("submit", async function (event) {
      event.preventDefault();

      const btnSubmit = document.getElementById("btnSubmit");
      // Se não existir o ID btnSubmit no seu HTML, evitamos erro aqui:
      if (btnSubmit) {
        btnSubmit.innerText = "Processando...";
        btnSubmit.disabled = true;
      }

      const dadosAgendamento = {
        nomeCliente: document.getElementById("nome").value,
        /*emailCliente: document.getElementById('email').value,*/
        telefoneCliente: document.getElementById("telefone") ? document.getElementById("telefone").value : document.getElementById("whatsapp").value, // Adicionei fallback para whatsapp
        data: document.getElementById("data").value,
        horario: document.getElementById("horario").value,
        duracaoMinutos: 90,
      };

      try {
        // Altere para a URL oficial quando subir o backend
        const resposta = await fetch("http://localhost:3000/api/agendamentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dadosAgendamento),
        });

        const resultado = await resposta.json();

        if (resultado.sucesso) {
          alert("Horário agendado com sucesso!");

          // Limpa o formulário
          formAgendamento.reset();

          // Fecha o Modal do Bootstrap programaticamente
          const modalElement = document.getElementById("modalAgendamento");
          if (modalElement && typeof bootstrap !== 'undefined') {
            const modalInstance =
              bootstrap.Modal.getInstance(modalElement) ||
              new bootstrap.Modal(modalElement);
            modalInstance.hide();
          }
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

/*const realizarAgendamento = async () => {
  const resposta = await fetch('http://seu-servidor.com/api/agendamentos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      nomeCliente: 'Maria Silva',
      emailCliente: 'maria@email.com',
      telefoneCliente: '(16) 99999-9999',
      data: '2026-10-15',     // YYYY-MM-DD
      horario: '14:30',        // HH:mm
      duracaoMinutos: 60,
    }),
  });

  const resultado = await resposta.json();
  if (resultado.sucesso) {
    alert('Agendamento confirmado!');
  } else {
    alert('Erro ao agendar horário.');
  }
};*/
