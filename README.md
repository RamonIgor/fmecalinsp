# F.Mecal Insp. - Plataforma de Inspeção Técnica

**F.Mecal Insp.** é uma aplicação web full-stack, moderna e robusta, projetada para digitalizar e otimizar o processo de inspeção técnica de pontes rolantes e equipamentos industriais similares. A plataforma oferece duas experiências distintas, personalizadas para os perfis de **Administrador** e **Inspetor**.

- **Painel do Administrador (Web):** Uma interface de gerenciamento centralizada para cadastrar clientes, equipamentos, usuários e, crucialmente, agendar e monitorar ordens de serviço.
- **Aplicativo do Inspetor (PWA Offline-First):** Um Progressive Web App (PWA) otimizado para dispositivos móveis que permite aos inspetores realizar inspeções em campo, mesmo sem conexão com a internet.

A aplicação foi construída com foco em usabilidade, resiliência e eficiência, garantindo que os dados sejam capturados de forma estruturada e segura.

---

## 🚀 Funcionalidades Principais

### Painel do Administrador (`/dashboard`)

O cérebro da operação. Acessível via navegador web, oferece controle total sobre o ecossistema de inspeções.

- **📊 Dashboard Central:** Visualização rápida de métricas essenciais, como status da frota de equipamentos, inspeções concluídas no mês e um gráfico sobre o status geral das inspeções.
- **👤 Gerenciamento de Usuários:** Adicione, edite, visualize e remova usuários, atribuindo os perfis de `Administrador` ou `Inspetor`.
- **🏢 Gerenciamento de Clientes:** Cadastre as usinas, fábricas ou locais onde os equipamentos a serem inspecionados estão localizados.
- **🏗️ Gerenciamento de Equipamentos:**
    - Cadastre cada ponte rolante com informações vitais (TAG, Nome, Setor, Status).
    - Para cada equipamento, defina a lista de **componentes** que servirão como um checklist dinâmico durante a inspeção.
- **📋 Gerenciamento de Ordens de Serviço (OS):**
    - Agende novas inspeções, associando um cliente e um equipamento.
    - Atribua a OS a um inspetor específico.
    - Defina a data agendada e adicione notas ou instruções especiais.
    - Monitore o status de cada OS: `Pendente`, `Em Andamento`, `Concluída` ou `Cancelada`.
- **📄 Relatórios de Inspeção:**
    - Visualize os resultados detalhados de inspeções concluídas, incluindo as respostas de cada item, observações, fotos anexadas e a assinatura do inspetor.
- **🤖 Geração de Relatórios em PDF (com IA):** Utilize o poder da IA Generativa (Google Gemini) para criar um relatório técnico profissional em formato PDF a partir dos dados de uma inspeção finalizada.

### Aplicativo do Inspetor (`/app`)

Otimizado para uso em campo, com capacidade total de funcionamento offline.

- **📱 Progressive Web App (PWA):** Pode ser "instalado" na tela inicial de dispositivos móveis, oferecendo uma experiência de aplicativo nativo e acesso offline.
- **🏠 Tela Inicial:** Apresenta um resumo das tarefas do inspetor, com um atalho rápido para as ordens de serviço pendentes.
- **🔍 Detalhes da Inspeção:**
    - Ao iniciar uma OS, o inspetor segue um checklist baseado nos componentes do equipamento.
    - Para cada item, ele pode marcar como `Conforme`, `Não Conforme` ou `NA`.
    - Um campo de `Observações` permite detalhar qualquer anomalia.
- **📸 Anexo de Fotos:** É possível anexar fotografias diretamente da câmera do dispositivo para cada item inspecionado, fornecendo evidência visual.
- **✍️ Assinatura Digital:** Ao final da inspeção, o inspetor pode assinar digitalmente na tela do dispositivo.
- **🔄 Sincronização Automática:** Todas as informações coletadas offline são salvas localmente no dispositivo. Assim que a conexão com a internet é restabelecida, os dados são sincronizados automaticamente com o servidor.

### ✨ Em Breve: Portal do Cliente (Acesso de Leitura)

Transforme a relação com seus clientes, oferecendo transparência e valor agregado.

- **📈 Acesso em Tempo Real:** Seus clientes poderão fazer login em um portal seguro para visualizar o status de saúde de todos os seus equipamentos em tempo real.
- **📂 Repositório Central de Relatórios:** Acesso instantâneo a todos os relatórios de inspeção, históricos e documentação, a qualquer hora e em qualquer lugar.
- **🤝 Parceria Estratégica:** A F.Mecal deixará de ser apenas uma prestadora de serviços para se tornar uma parceira na gestão de ativos e riscos, justificando o valor e fidelizando o cliente a longo prazo.

---

## 🛠️ Pilha de Tecnologia

- **Frontend:**
  - **Framework:** [Next.js 14+](https://nextjs.org/) (com App Router)
  - **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
  - **UI:** [React](https://react.dev/), [ShadCN UI](https://ui.shadcn.com/)
  - **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Backend & Banco de Dados:**
  - **Plataforma:** [Firebase](https://firebase.google.com/)
  - **Autenticação:** Firebase Authentication (Email/Senha)
  - **Banco de Dados:** Cloud Firestore (Banco de dados NoSQL em tempo real)
- **PWA (Progressive Web App):**
  - Funcionalidades offline, cache de recursos e instalação em dispositivos móveis.
- **IA Generativa:**
  - **Motor:** [Google Gemini](https://deepmind.google.com/technologies/gemini/)
  - **Orquestração:** [Genkit (Firebase)](https://firebase.google.com/docs/genkit) para a geração de relatórios em PDF.

---

## 📖 Como Usar

### Perfil de Administrador

1.  **Login:** Acesse a aplicação e faça login com suas credenciais de administrador.
2.  **Configuração Inicial:**
    - Vá para **Clientes** e adicione as empresas/plantas.
    - Em **Equipamentos**, cadastre as pontes rolantes, associando-as a um cliente e definindo seus componentes.
    - Em **Usuários**, crie as contas para os inspetores.
3.  **Operação:**
    - Acesse **Ordens de Serviço** para agendar novas inspeções.
    - Acompanhe o status das inspeções no **Painel** ou na lista de Ordens de Serviço.
    - Após uma inspeção ser concluída, vá para **Relatórios** para visualizar os detalhes e gerar o PDF.

### Perfil de Inspetor

1.  **Login:** Acesse a aplicação a partir de um dispositivo móvel (smartphone ou tablet).
2.  **Instalação do PWA:** Seu navegador oferecerá a opção de "Adicionar à tela inicial". Faça isso para ter a melhor experiência offline.
3.  **Inspeção:**
    - Na tela inicial, você verá suas Ordens de Serviço pendentes.
    - Toque em uma OS para iniciar a inspeção.
    - Siga o checklist, preenchendo o status, observações e tirando fotos conforme necessário.
    - Ao final, preencha a assinatura.
4.  **Finalização:**
    - Clique em "Finalizar e Salvar Inspeção". Se estiver offline, os dados serão salvos localmente. Ao se reconectar, eles serão enviados automaticamente.
