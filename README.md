# Nutry+ 🥗✨

**Nutry+** é um sistema completo e moderno de gestão clínica para nutricionistas, projetado para simplificar o acompanhamento de pacientes, o registro de consultas, a análise de evolução física e a prescrição de planos alimentares com alta performance e segurança.

---

## 🚀 Funcionalidades

### 🔐 1. Autenticação e Segurança
- **Cadastro e Login de Nutricionistas**: Autenticação integrada com **Neon Auth** (`better-auth`).
- **Sessão Persistente**: Acesso contínuo sem necessidade de reconexão a cada abertura.
- **Segurança de Dados (RLS)**: Row Level Security ativado no banco para garantir que cada profissional acesse estritamente os seus próprios pacientes e registros.

### 📊 2. Dashboard Inteligente em Tempo Real
- **Total de Pacientes Ativos**: Contagem consolidada de pacientes sob acompanhamento.
- **Consultas da Semana**: Métricas de consultas agendadas e realizadas na semana corrente (segunda a domingo).
- **Alerta de Pacientes Sem Retorno**: Listagem de pacientes cuja última consulta ocorreu há mais de 30 dias e que não possuem retorno agendado, com link direto para o prontuário.
- **Estado Dinâmico**: Notificação amigável quando todos os pacientes estiverem em dia.

### 👥 3. Gestão e Cadastro de Pacientes (3 Abas)
- **Aba Pessoal**: Nome, idade calculada automaticamente, sexo, telefone/WhatsApp formatados e email.
- **Aba Clínico**: Peso, altura, cálculo automático de **IMC** com classificação clínica, objetivos em tags, nível de atividade física, patologias, restrições e alergias (com suporte a "Nenhum" e tags personalizadas), medicamentos e suplementos.
- **Aba Hábitos**: Refeições ao dia, quantidade de água em litros, horários de acordar e dormir com conversão inteligente de horas (`6` → `06:00`), prática de atividade física e observações.
- **Edição Completa de Paciente**: Pré-carregamento dos dados para atualização rápida no banco.

### 📈 4. Prontuário & Painel Visual de Evolução
- **Gráfico SVG Interativo de Evolução**: Curva temporal de peso e percentual de gordura.
- **Cards de Comparação**: Peso Inicial vs. Peso Atual, Variação Total em kg e percentual, IMC Atual.
- **Registro Rápido de Consultas**: Modal para adicionar novas consultas com data, medidas e próximo retorno diretamente pelo prontuário.

---

## 🛠️ Stack Tecnológica

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vite.dev/), [React Router DOM v7](https://reactrouter.com/)
- **Estilização**: CSS3 Moderno (Vanilla CSS com Design System baseado em variáveis, paleta ciano `#00b4d8` e branco)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Banco de Dados**: [Neon Serverless PostgreSQL](https://neon.tech/) via `@neondatabase/serverless`
- **Autenticação**: Neon Auth / Better Auth
- **Linter & Performance**: Oxlint

---

## 📂 Estrutura de Pastas

```bash
Nutry+/
├── _prompt/                # Especificações e prompts das fases do sistema
├── public/                 # Assets estáticos
├── src/
│   ├── assets/             # Imagens e recursos visuais
│   ├── components/         # Componentes reutilizáveis (Sidebar, Layout, etc.)
│   ├── lib/                # Configurações de clientes (db.js, auth.js)
│   ├── pages/              # Telas da aplicação
│   │   ├── Login.jsx           # Tela de autenticação
│   │   ├── Signup.jsx          # Tela de cadastro de nutricionistas
│   │   ├── Dashboard.jsx       # Painel principal de controle
│   │   ├── Pacientes.jsx       # Listagem e busca de pacientes
│   │   ├── NovoPaciente.jsx    # Cadastro e edição de paciente (3 abas)
│   │   └── PacientePerfil.jsx  # Prontuário, evolução visual e consultas
│   ├── App.jsx             # Roteamento e proteção de rotas
│   ├── index.css           # Design System global e temas
│   └── main.jsx            # Ponto de entrada React
├── .env.example            # Modelo de variáveis de ambiente
├── package.json            # Dependências e scripts
└── vite.config.js          # Configuração do Vite
```

---

## ⚙️ Como Executar o Projeto Localmente

### 1. Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- Gerenciador de pacotes `npm`

### 2. Clonar o repositório
```bash
git clone https://github.com/felliperrocha/nutryrocha.git
cd nutryrocha
```

### 3. Instalar as dependências
```bash
npm install
```

### 4. Configurar as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto com base no `.env.example`:
```env
VITE_NEON_AUTH_URL="https://seu-endpoint.neonauth.sa-east-1.aws.neon.tech/neondb/auth"
VITE_NEON_DB_URL="postgresql://usuario:senha@seu-host.sa-east-1.aws.neon.tech/neondb?sslmode=require"
```

### 5. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
Acesse a aplicação no navegador em: `http://localhost:5173`

---

## 📜 Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor local de desenvolvimento com HMR |
| `npm run build` | Gera o bundle otimizado para produção na pasta `/dist` |
| `npm run preview` | Pré-visualiza o build de produção localmente |
| `npm run lint` | Executa a verificação estática de código com Oxlint |

---

## 🔒 Segurança e Boas Práticas

- O arquivo `.env` com credenciais confidenciais nunca deve ser versionado no Git (já incluído no `.gitignore`).
- As políticas de segurança no banco (RLS) garantem o isolamento total dos dados de cada nutricionista.

---

Desenvolvido com carinho para simplificar e elevar a rotina dos nutricionistas! 🥑🌿
