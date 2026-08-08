 # Prompt 2 — Autenticação

Agora vamos criar a autenticação do sistema. O sistema deve permitir que um nutricionista crie uma conta e faça login. Use o Neon Auth que já está configurado no projeto "Nutry +".

## Tela de Login
- Campo de email
- Campo de senha
- Botão "Entrar"
- Link "Não tem conta? Cadastre-se"

## Tela de Cadastro
- Campo de nome completo
- Campo de email
- Campo de senha
- Campo de confirmar senha
- Botão "Criar conta"
- Link "Já tem conta? Faça login"

## Regras importantes
- Após o cadastro, salvar o nome e email do nutricionista na tabela `nutricionistas` do Neon
- Após o login bem sucedido, redirecionar para o dashboard
- Se o login falhar, exibir mensagem de erro clara e amigável
- A senha deve ter no mínimo 6 caracteres
- Manter a sessão ativa para que ela não precise fazer login toda vez que abrir o sistema
- Se já estiver logada e tentar acessar a tela de login, redirecionar direto para o dashboard

## Stack
- React + Vite
- CSS Vanilla
- JS Vanilla

## Design
- Visual limpo, moderno e profissional
- Cores predominantes ciano e branco, remetendo à área da saúde e nutrição
- Logo com o texto "Nutry +" no topo de ambas as telas