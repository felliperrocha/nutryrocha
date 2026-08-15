# Nutry+ 🥗✨

**Nutry+** é um sistema completo e moderno de gestão clínica para nutricionistas, projetado para simplificar o acompanhamento de pacientes, o registro de consultas e a prescrição de planos alimentares com alta performance e segurança.

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

### 👥 3. Gestão de Pacientes & Prontuário
- **Listagem e Busca Rápida**: Filtragem por nome, email ou WhatsApp.
- **Perfil Completo do Paciente**: Dados antropométricos (peso inicial, altura), objetivos, nível de atividade física, restrições e patologias.
- **Histórico de Consultas**: Acompanhamento de evolução física (peso, % gordura, circunferências) e agendamento de retornos.

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
│   │   └── PacientePerfil.jsx  # Prontuário e histórico clínico
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
