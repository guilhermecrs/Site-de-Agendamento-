const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY
      ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
      : undefined,
  },
  scopes: SCOPES,
});

const calendar = google.calendar({ version: "v3", auth });

app.post("/api/agendamentos", async (req, res) => {
  try {
    const {
      nomeCliente,
      emailCliente,
      telefoneCliente,
      data,
      horario,
      duracaoMinutos = 60,
    } = req.body;
    const startDateTime = new Date(`${data}T${horario}:00-03:00`);
    const endDateTime = new Date(
      startDateTime.getTime() + duracaoMinutos * 60000,
    );

    const event = {
      summary: `Atendimento: ${nomeCliente}`,
      description: `Agendamento realizado via App.\n\nCliente: ${nomeCliente}\nTelefone: ${telefoneCliente}`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: "America/Sao_Paulo",
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: "America/Sao_Paulo",
      },
    };

    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      resource: event,
    });

    return res.status(201).json({
      sucesso: true,
      mensagem: "Horário agendado com sucesso!",
      eventoId: response.data.id,
      linkEvento: response.data.htmlLink,
    });
  } catch (error) {
    console.error("Erro ao criar agendamento na agenda:", error);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Não foi possível concluir o agendamento.",
    });
  }
});

app.get("/api/horarios-ocupados", async (req, res) => {
  try {
    const { data } = req.query; // Espera a data no formato "YYYY-MM-DD"
    if (!data) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "A data é obrigatória. Exemplo: /api/horarios-ocupados?data=2027-02-01",
      });
    }

    // Define o início e o fim do dia no fuso horário de Brasília/São Paulo (-03:00)
    const timeMin = new Date(`${data}T00:00:00-03:00`).toISOString();
    const timeMax = new Date(`${data}T23:59:59-03:00`).toISOString();

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        timeZone: "America/Sao_Paulo",
        items: [{ id: process.env.GOOGLE_CALENDAR_ID }],
      },
    });

    const busySlots =
      response.data.calendars[process.env.GOOGLE_CALENDAR_ID]?.busy || [];

    return res.status(200).json({
      sucesso: true,
      ocupados: busySlots, // Retorna os horários em que você já tem compromisso
    });
  } catch (error) {
    console.error("Erro ao consultar horários ocupados:", error);
    return res.status(500).json({
      sucesso: false,
      mensagem: "Não foi possível consultar os horários ocupados.",
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
