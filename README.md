# COWABUNGA F1 TEAM | Race With The Shield

Bem-vindo ao repositório oficial do projeto **Cowabunga F1 Team**. Este projeto é uma plataforma completa inspirada no universo das Tartarugas Ninjas, trazendo a experiência de uma equipe de corrida (Grid, Tempos, Lojas, etc.) para os fãs, combinada com uma estética rica e na tematica dos tartarugas ninjas.

---

## Tecnologias Utilizadas

O projeto foi construído utilizando as seguintes tecnologias de ponta, divididas entre Frontend e Backend:

## Configuração e execução

1. Copie o arquivo `.env.example` para `.env`.
2. Preencha as variáveis de ambiente com os dados do seu banco MySQL e um `JWT_SECRET` seguro.
3. Crie o banco de dados e as tabelas executando `schema.sql` no MySQL:
   - `mysql -u <usuario> -p < schema.sql`
4. Instale as dependências:
   - `npm install`
5. Inicie o servidor:
   - `npm start`

Observação: a aplicação serve as páginas em `Front/` diretamente na raiz do servidor, e o backend expõe os endpoints sob o mesmo host.

### **Frontend**
- **HTML5 & CSS3 (Vanilla)**: Estrutura semântica e estilização profunda, utilizando variáveis CSS para temas e design avançado com forte foco em microinterações, glassmorphism e iluminação (glow effects).
- **JavaScript (ES6+)**: Lógica da aplicação, consumo de APIs e manipulação dinâmica do DOM (Single Page Application feel).
- **Tailwind CSS**: Utilizado via CDN em algumas seções para agilizar a prototipação e utilitários.
- **Three.js**: Biblioteca de renderização 3D utilizada para criar a experiência interativa do escudo giratório (`index.html`) e da shuriken mutante no e-commerce (`produto.html`).
- **Font Awesome**: Ícones da interface.

### **Backend & Segurança**
- **Node.js & Express**: Servidor HTTP e gerenciamento de rotas da API.
- **MySQL2**: Conexão otimizada via *Pool* com banco de dados relacional.
- **Helmet**: Camada de segurança para cabeçalhos HTTP.
- **Express Rate Limit**: Prevenção ativa contra ataques de força bruta e DDoS, limitando requisições repetitivas.
- **JSON Web Token (JWT)**: Implementado na arquitetura para autenticação segura baseada em tokens.
- **Dotenv**: Gerenciamento de variáveis de ambiente.

---

## Estrutura do Sistema

A arquitetura do projeto está organizada de forma modular:

```text
├── index.html           # Landing page com efeitos 3D interativos e apresentação da equipe.
├── login.html           # Portal de Autenticação (Login, Registro e Recuperação) altamente protegido.
├── produto.html         # Loja Virtual/E-commerce com carrinho, checkout multi-step (Cartão, PIX, Boleto) e animação 3D da shuriken.
├── dashboard.html       # Painel de controle completo (Dashboard Administrativo e Grid de Largada).
├── app.js               # Lógica do Express, middlewares de segurança (Helmet/Rate-limit) e montagem das rotas.
├── server.js            # Ponto de entrada do backend (Listener).
├── db.js                # Conexão do pool MySQL (credentials via .env).
└── routes/              # Módulos de rota da API REST (usuários, corredores, voltas).
```

---

## Funcionalidades Implementadas

O sistema integra as seguintes funcionalidades para entregar a experiência completa de uma equipe de corrida virtual:

- **E-Commerce Dinâmico (`produto.html`)**:
  - Modal dinâmico de produtos e seleção de tamanhos.
  - Carrinho de compras reativo.
  - Checkout completo com validação de dados, múltiplos meios de pagamento (simulados) e design temático.
  - Fundo dinâmico com **animação 3D usando Three.js** interativa (Shuriken Mutante).

- **Portal de Autenticação (`login.html`)**:
  - Telas de Login, Registro e "Esqueceu a Senha".
  - Validações de regex em tempo real, indicativo de força de senha e mensagens de erro visuais precisas.

- **Painel Administrativo & Corridas (`dashboard.html`)**:
  - **Página Inicial**: Resumo estatístico rápido (Corredores, Voltas e Equipes).
  - **Sistema de Competidores**: Listagem de corredores, cadastro e histórico.
  - **Sistema de Cronometragem**: Lançamento de voltas baseadas em tempo.
  - **Grid de Largada**: Uma view visual dedicada que mostra as posições (P1, P2, etc.) dos melhores colocados.
  - **Ranking e Resultados**: Tabela geral das melhores posições baseada no desempenho computado.

- **Segurança de API e Backend (`app.js`)**:
  - Middlewares de segurança (`Helmet` e limitador de requisições).
  - Configuração rigorosa de políticas de CORS.

---

## Participação de cada Integrante

*Abaixo, registre o nome de cada membro e suas responsabilidades ou módulos desenvolvidos durante o projeto.*

- **[Nome do Integrante 1]**: *[Ex: Desenvolveu o layout do Dashboard e o Grid de Largada]*
- **[Nome do Integrante 2]**: *[Ex: Implementou a segurança do backend, a API REST e integração do BD]*
- **[Nome do Integrante 3]**: *[Ex: Criação da UI/UX da landing page e integração do Three.js]*
- **[Nome do Integrante 4]**: *[Ex: Configuração do E-commerce, carrinho de compras e checkout em JS]*

*(Substitua os nomes e descrições conforme a realidade do seu time!)*

---
*Projeto desenvolvido para fins educacionais e portfólio. Cowabunga!*