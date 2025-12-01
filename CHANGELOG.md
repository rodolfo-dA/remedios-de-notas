# 📝 Histórico de Alterações (Changelog)

Este arquivo documenta as mudanças mais importantes em cada versão do projeto **Remédios de Notas**.

## [V01.06.00] - 2025-12-01

Esta versão foca na melhoria da adesão do usuário ao tratamento e na correção de bugs críticos de interface e agendamento.

### ✨ Novas Funcionalidades

* **Registro de Doses:** Adicionado um botão "Registrar Dose Tomada" no item da medicação, visível apenas em uma janela de 10 minutos (5 min antes a 5 min depois da hora programada).
* **Histórico e Adesão:** Implementado um Modal de Histórico (MedicationHistoryModal) acessível via um ícone de gráfico/timeline, que exibe um histórico detalhado das doses registradas.
* **Timer de Urgência:** Adicionado um contador de tempo restante (em horas e minutos) ao banner de alerta da medicação, substituindo o texto genérico "CHEGANDO".

### 🐛 Correções de Bugs e Melhorias de UX

* **Sincronização de Notificações:** Corrigida a lógica de agendamento de notificações (`scheduleNotificationsForMedication` no `HomeScreen.js`) para evitar o disparo imediato de lembretes passados no dia do agendamento inicial. O primeiro disparo de uma dose atrasada é agora agendado para o dia seguinte.
* **Alerta de Proximidade (Próximo):** A janela de alerta "PRÓXIMO" (cor amarela) foi reduzida de 4 horas para **3 horas** de antecedência para dar um senso de urgência mais preciso.
* **Flash de Tema (Modal):** Corrigido o "flash branco" que ocorria ao fechar o modal de histórico no tema escuro, garantindo que o fundo do modal seja transparente e o contêiner interno use a cor de fundo do tema.
* **Corte de Texto (UI):** Corrigido o corte de texto em botões importantes nas telas de Login e Criação de Perfil (ex: "ENTRAR", "CRIAR CONTA", "Apagar Tudo"), forçando o texto a ficar em uma única linha (`numberOfLines={1}`) e ajustando o tamanho da fonte.
* **Corte de Título (UI):** Ajustado o `paddingTop` no `globalStyles.js` para garantir que o título principal do aplicativo ("Remédios de Notas") não seja cortado por entalhes ou pela barra de status do dispositivo.

---