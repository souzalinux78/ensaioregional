# Análise de Segurança: Super Admin vs Admin Regional

Este documento descreve como o sistema trata **Super Admin** (acesso total) e **Admin regional** (visibilidade e ações restritas à sua regional), onde estão as regras, como a regional é determinada, onde há proteção e onde existem riscos ou bugs.

---

## 1. Onde estão as regras de permissão/roles

### Backend

| Local | Arquivo | Linhas | O que está sendo feito |
|-------|---------|--------|------------------------|
| **Definição canônica de roles** | `backend/prisma/schema.prisma` | 55-60 | Enum `Role`: `SUPERADMIN`, `ADMIN_REGIONAL`, `ADMIN`, `USER`. |
| **Middleware de role** | `backend/src/interfaces/http/middlewares/role.guard.ts` | 4-22 | `roleGuard(...allowedRoles)`: verifica se `user.role` está em `allowedRoles`. **SUPERADMIN e ADMIN fazem bypass** (sempre passam). Não trata regional. |
| **JWT e claims** | `backend/src/interfaces/http/middlewares/verify-jwt.ts` | 17-22 | Preenche `request.user` com `userId`, `tenantId`, `role`, `regionalId` a partir do token. |
| **Emissão do token** | `backend/src/application/services/auth.service.ts` | 50-59, 124-134 | JWT inclui `userId`, `tenantId`, `role`, `regionalId`, `ensaioRegionalId`, etc. |

### Frontend

| Local | Arquivo | Linhas | O que está sendo feito |
|-------|---------|--------|------------------------|
| **Estado do usuário** | `frontend/src/context/AuthContext.tsx` | 40-50 | Decodifica JWT e guarda `role`, `regionalId` no estado. Não usa para bloquear chamadas à API. |
| **Menu por role** | `frontend/src/components/MainLayout.tsx` | 33-46 | `isSuperAdmin = SUPERADMIN \|\| ADMIN`: esconde "Executivo", "BI Geral" e "Regionais" para ADMIN_REGIONAL. "Usuários" é exibido para todos os admins (backend retorna 403 para ADMIN_REGIONAL). |

### Rotas protegidas por role

- **admin.routes.ts** (admin geral): `preHandler` com `roleGuard('SUPERADMIN', 'ADMIN_REGIONAL', 'ADMIN')`. Rotas extras:
  - Relatório executivo/BI e criar/editar/deletar regionais: `roleGuard('SUPERADMIN', 'ADMIN')` (ADMIN_REGIONAL recebe 403).
- **admin-users.routes.ts**: `roleGuard('ADMIN')` — apenas ADMIN (e bypass SUPERADMIN) acessa CRUD de usuários; **ADMIN_REGIONAL recebe 403**.

---

## 2. Como o sistema sabe a qual regional um Admin pertence

- **Banco de dados**: modelo `User` em `backend/prisma/schema.prisma` (36-37): campo `regionalId` (FK para `regionais.id`), opcional.
- **Login**: `auth.service.ts` carrega o usuário do DB (incluindo `regionalId`) e coloca no JWT (54-55).
- **Backend**: em toda requisição autenticada, `verify-jwt.ts` coloca `request.user.regionalId` a partir do token (não reconsulta o DB).
- **Frontend**: `AuthContext` decodifica o token e expõe `user.regionalId` para a UI.

Ou seja: a regional do admin vem do **token JWT** (originado do `User.regionalId` no login). O backend não revalida a regional contra o DB em cada request; confia no token.

---

## 3. Proteção para impedir Admin regional de ver/editar/criar fora da sua regional

### Onde há proteção correta

| Área | Arquivo(s) | Comportamento |
|------|------------|---------------|
| **Listar/obter/atualizar/deletar eventos** | `ensaio.controller.ts`, `ensaio-regional.service.ts`, `ensaio-regional.repository.ts` | Controller passa `req.user.role` e `req.user.regionalId`; serviço usa `userRegionalId` em list, findById, update, delete; repositório aplica `regionalId` no `where`. |
| **Criar evento** | `ensaio-regional.service.ts` (13-14) | Para `ADMIN_REGIONAL`, `effectiveRegionalId = userRegionalId` (ignora body). |
| **Relatórios (stats, export CSV, PDF por ensaio)** | `relatorio.controller.ts`, `relatorio.service.ts` | Usam `request.user.role` e `request.user.regionalId`; para ADMIN_REGIONAL aplicam filtro `regionalId` / `ensaioRegional.regionalId`. |
| **CRUD de usuários** | `admin-users.routes.ts` | `roleGuard('ADMIN')` — ADMIN_REGIONAL nem acessa a rota. |
| **Criar/editar/deletar regionais** | `admin.routes.ts` | `roleGuard('SUPERADMIN', 'ADMIN')` — ADMIN_REGIONAL não pode alterar regionais. |

### Onde NÃO há proteção (riscos)

- **Summon (convocar usuários ao evento)** e **linkUser**: não aplicam filtro por regional (detalhes na seção 4).
- **Listagem de regionais**: GET `/admin/regionais` retorna todas as regionais do tenant para qualquer role do guard (incluindo ADMIN_REGIONAL). Não permite alterar, mas expõe IDs/nomes de outras regionais.

---

## 4. Pontos de risco: Admin regional acessando outra regional

### 4.1 ALTO – Summon (convocar usuários)

- **Arquivos**:  
  - `backend/src/interfaces/http/controllers/admin/ensaio.controller.ts` (117-132)  
  - `backend/src/application/services/ensaio-regional.service.ts` (180-182)  
  - `backend/src/infra/repositories/ensaio-regional.repository.ts` (31-44)
- **Comportamento atual**:  
  - Controller chama `service.summonUsers(id, userIds, req.user.tenantId, req.user.userId)` **sem** `req.user.role` nem `req.user.regionalId`.  
  - Serviço chama `this.repository.findById(ensaioId, tenantId)` **sem** terceiro argumento `regionalId`.  
  - No repositório, `findById(id, tenantId, regionalId?)` com `regionalId` undefined faz o Prisma omitir o filtro por regional; assim o ensaio é encontrado apenas por `id` e `tenantId`.
- **Risco**: Um ADMIN_REGIONAL que conheça o ID de um ensaio de **outra** regional pode enviar `POST /admin/ensaios/:id/summon` e convocar usuários para esse ensaio.
- **Correção sugerida** (sem remover funcionalidades, sem quebrar o sistema):
  1. No **controller** (`ensaio.controller.ts`), passar `req.user.role` e `req.user.regionalId` para o serviço, por exemplo:  
     `service.summonUsers(id, userIds, req.user.tenantId, req.user.userId, req.user.role, req.user.regionalId)`.
  2. No **serviço** (`ensaio-regional.service.ts`), alterar a assinatura de `summonUsers` para aceitar `userRole?: string, userRegionalId?: string`. Antes de buscar o ensaio, para ADMIN_REGIONAL chamar `findById(ensaioId, tenantId, userRegionalId)`; se o ensaio não existir (ou não pertencer à regional), lançar erro "Evento não encontrado" e não executar a convocação.

### 4.2 MÉDIO – linkUser (se a rota for exposta)

- **Arquivos**:  
  - `ensaio.controller.ts` (99-115), `ensaio-regional.service.ts` (176-179), `ensaio-regional.repository.ts` (153-168).
- **Comportamento atual**: `linkUser` no controller chama o serviço apenas com `tenantId`; o repositório usa `findById(ensaioId, tenantId)` sem `regionalId`.
- **Risco**: Se a rota de linkUser for registrada em `admin.routes.ts` no futuro, um ADMIN_REGIONAL poderia vincular usuário a ensaio de outra regional.
- **Correção sugerida**: Ao implementar ou expor a rota, passar `req.user.role` e `req.user.regionalId` ao serviço e, no serviço, para ADMIN_REGIONAL usar `findById(ensaioId, tenantId, userRegionalId)` antes de qualquer alteração. Se o ensaio não for da regional do admin, retornar 404.

### 4.3 BAIXO – Listagem de regionais

- **Arquivo**: `backend/src/interfaces/http/controllers/admin/regional.controller.ts` e serviço de regionais.
- **Comportamento**: GET `/admin/regionais` retorna todas as regionais do tenant.
- **Risco**: ADMIN_REGIONAL vê lista de todas as regionais (nomes/IDs). Não pode criar/editar/deletar (protegido por roleGuard). Risco é apenas de informação.
- **Sugestão**: Opcionalmente, para ADMIN_REGIONAL retornar apenas a regional do usuário (filtrar por `request.user.regionalId`). Não obrigatório para segurança crítica, mas melhora consistência.

### 4.4 Bug – user.controller delete (requesterId)

- **Arquivo**: `backend/src/interfaces/http/controllers/admin/user.controller.ts` (81).
- **Código atual**: `const requesterId = (request as any).user.sub`
- **Problema**: O middleware `verify-jwt` define `userId`, não `sub`. Então `requesterId` fica `undefined` e a regra "não excluir a si mesmo" no `admin-user.service.ts` (delete) não funciona como esperado (comparação `id === requesterId` nunca é verdadeira para o próprio usuário).
- **Correção**: Usar `(request as any).user.userId` em vez de `user.sub`.

---

## 5. Análise de impacto

### Autorização apenas no frontend?

- **Não.** A autorização efetiva é no backend: `roleGuard` e checagens de `role`/`regionalId` nos controllers e serviços. O frontend apenas esconde itens de menu (Executivo, BI, Regionais) para ADMIN_REGIONAL; a aba "Usuários" continua visível, mas a API retorna 403 para ADMIN_REGIONAL.

### Backend aplica filtros por regional em todas as queries?

- **Quase.** List/get/update/delete de eventos e todos os relatórios (stats, export, PDF) aplicam filtro por regional para ADMIN_REGIONAL. **Exceções**: `summon` e `linkUser` não aplicam filtro por regional (ver seção 4).

### Eventos/usuários associados à regional?

- **Eventos**: sim. `EnsaioRegional.regionalId` (schema.prisma) e a lógica de list/findById/update/delete usam esse campo para filtrar por regional.
- **Usuários**: usuários têm `User.regionalId`; o CRUD de usuários é restrito a ADMIN (e SUPERADMIN), então ADMIN_REGIONAL não cria/edita usuários. Não há listagem “por regional” no backend para usuários (admin vê todos do tenant).

### Verificação de token/role robusta?

- Token JWT é validado em `verify-jwt.ts`; role e regionalId vêm do token. Não há revalidação contra o DB por request. Para aumentar robustez, seria possível revalidar role/regionalId contra o User no DB em rotas sensíveis (opcional).

---

## 6. Implementação por módulo

### Backend – Controllers

- **ensaio.controller.ts**: create, list, get, update, delete passam `req.user.role` e `req.user.regionalId`. **summon** e **linkUser** não passam role/regionalId → risco já descrito.
- **relatorio.controller.ts**: getStats, exportCsv, gerarPdf, gerarAnaliticoPdf usam `(request as any).user.role` e `regionalId`; getExecutiveStats/getBIStats/gerarBIPdf checam role no controller (SUPERADMIN/ADMIN).
- **user.controller.ts**: usa apenas `tenantId`; delete usa `user.sub` (incorreto) → trocar para `user.userId`.
- **regional.controller.ts**: list retorna todas as regionais do tenant (ADMIN_REGIONAL vê todas).

### Backend – Services

- **ensaio-regional.service.ts**: list, findById, update, delete, create usam `userRole` e `userRegionalId`. **summonUsers** e **linkUser** não recebem nem usam regional.
- **relatorio.service.ts**: getStats e exportCsv aplicam `userRegionalId` quando `userRole === 'ADMIN_REGIONAL'`.
- **admin-user.service.ts**: list/get/create/update/delete usam apenas `tenantId`; não há filtro por regional (aceitável porque a rota é só ADMIN).

### Backend – Middlewares

- **verify-jwt.ts**: preenche `request.user` com `userId`, `tenantId`, `role`, `regionalId`.
- **role.guard.ts**: verifica role; SUPERADMIN e ADMIN fazem bypass; não considera regional.

### Backend – Queries (Prisma)

- **ensaio-regional.repository.ts**: `findById(id, tenantId, regionalId?)` — quando `regionalId` é undefined, o `where` não inclui regional (comportamento do Prisma). Por isso summon/linkUser que chamam findById sem regionalId ignoram regional.
- **list**, **update**, **softDelete** no mesmo repositório recebem `regionalId` quando chamados pelo serviço para ADMIN_REGIONAL e aplicam corretamente.

### Frontend

- **Listagem de eventos**: `EnsaiosTab.tsx` chama `AdminService.getEventos()`; backend já retorna só eventos da regional do ADMIN_REGIONAL.
- **Listagem de usuários**: `UsersTab.tsx` chama `AdminService.getUsers()`; ADMIN_REGIONAL recebe 403 (rota só ADMIN).
- **Dashboard e relatórios**: `getStats` pode enviar `regionalId` na query; o backend **ignora** esse parâmetro e usa apenas `request.user.regionalId` para ADMIN_REGIONAL — comportamento correto.
- **Regional no formulário**: Em eventos e usuários, o frontend envia `regionalId` no body; para eventos o backend força o regional do token para ADMIN_REGIONAL; para usuários a rota é só ADMIN.

---

## 7. Segurança – Resumo

- **Backend** deve (e na maior parte já) validar role + regional no servidor. Exceção: summon (e linkUser se exposto).
- **Não confiar só no frontend**: correto; as restrições efetivas estão no backend.
- **JWT e claims**: token contém `userId`, `tenantId`, `role`, `regionalId`; middleware coloca em `request.user`. Uso de `regionalId` do token está correto nos fluxos que já filtram por regional.
- **Onde a regional do Admin é consumida**: do token (`request.user.regionalId`), preenchido no login a partir de `User.regionalId`.

---

## 8. Dados / DB

- **Relacionamentos**: `User.regionalId` → `Regional`; `EnsaioRegional.regionalId` → `Regional`; `EventoUsuario` liga usuário a ensaio; `RegistroPresenca` liga usuário a ensaio.
- **Constraints**: FKs no schema Prisma garantem integridade referencial (User → Regional, EnsaioRegional → Regional, etc.).
- **Schema**: Atende às regras de acesso desde que a camada de aplicação use `regionalId` em todas as operações sensíveis para ADMIN_REGIONAL (atualmente falha em summon/linkUser).

---

## 9. Testes sugeridos (casos que comprovem o esperado)

- **Admin regional não vê eventos de outras regionais**:  
  Login como ADMIN_REGIONAL; GET `/admin/ensaios` deve retornar apenas eventos com `regionalId` igual ao do usuário.
- **Admin regional não vê usuários de outras regionais (ou não acessa lista)**:  
  GET `/admin/users` como ADMIN_REGIONAL deve retornar 403.
- **Admin regional não cria evento em outra regional**:  
  POST `/admin/ensaios` com body contendo `regionalId` de outra regional; backend deve ignorar e usar `regionalId` do token; evento criado deve ter a regional do admin.
- **Admin regional não edita/deleta evento de outra regional**:  
  PATCH/DELETE `/admin/ensaios/:id` com ID de evento de outra regional deve retornar 404.
- **Admin regional não convoca para evento de outra regional (após correção)**:  
  POST `/admin/ensaios/:id/summon` com `id` de ensaio de outra regional deve retornar 404 (ou "Evento não encontrado").
- **Admin regional não cria usuário em outra regional**:  
  Rota POST `/admin/users` deve retornar 403 para ADMIN_REGIONAL (não chega a criar).
- **Relatórios e PDFs**:  
  getStats, exportCsv, gerarPdf, gerarAnaliticoPdf com ADMIN_REGIONAL devem retornar apenas dados da regional do token; acesso a ensaio de outra regional deve retornar 404.

Sugestão: implementar esses casos como testes automatizados (ex.: Jest/Vitest no backend, chamando os controllers ou serviços com `request.user` simulado).

---

## 10. Onde as regras não estão corretamente aplicadas – Resumo e correções

| Item | Arquivo(s) | Risco | Correção objetiva |
|------|------------|--------|--------------------|
| **Summon sem filtro regional** | `ensaio.controller.ts`, `ensaio-regional.service.ts` | ADMIN_REGIONAL pode convocar em ensaio de outra regional | Passar `role` e `regionalId` do request ao serviço; no serviço, para ADMIN_REGIONAL usar `findById(ensaioId, tenantId, userRegionalId)` antes de convocar; se não encontrar, lançar erro. |
| **linkUser sem filtro regional** | Idem | Se rota for exposta, mesmo risco | Idem: passar role/regionalId e validar ensaio na regional do admin. |
| **Delete user – requesterId** | `user.controller.ts` (linha 81) | Verificação "não excluir a si mesmo" ineficaz | Trocar `(request as any).user.sub` por `(request as any).user.userId`. |

Nenhuma dessas correções remove funcionalidades, quebra o sistema nem propõe deleção de dados; apenas fecham brechas de autorização e um bug de propriedade no delete.

---

## Referência rápida de arquivos

| Arquivo | Uso |
|--------|-----|
| `backend/prisma/schema.prisma` | Enum Role; User.regionalId; EnsaioRegional.regionalId |
| `backend/src/interfaces/http/middlewares/verify-jwt.ts` | Coloca userId, tenantId, role, regionalId em request.user |
| `backend/src/interfaces/http/middlewares/role.guard.ts` | Bypass SUPERADMIN/ADMIN; checa allowedRoles |
| `backend/src/application/services/auth.service.ts` | Gera JWT com role e regionalId |
| `backend/src/application/services/ensaio-regional.service.ts` | Filtro por regional em list/findById/update/delete/create; summonUsers/linkUser sem filtro |
| `backend/src/infra/repositories/ensaio-regional.repository.ts` | findById(id, tenantId, regionalId?) — sem regionalId não filtra |
| `backend/src/interfaces/http/controllers/admin/ensaio.controller.ts` | summon (e linkUser) não passam role/regionalId |
| `backend/src/interfaces/http/controllers/admin/user.controller.ts` | delete usa user.sub → trocar para user.userId |
| `backend/src/interfaces/http/routes/admin.routes.ts` | Rotas admin; summon registrado; linkUser não registrado |
| `backend/src/interfaces/http/routes/admin-users.routes.ts` | roleGuard('ADMIN') — bloqueia ADMIN_REGIONAL |
| `frontend/src/context/AuthContext.tsx` | Decodifica JWT; guarda role e regionalId |
| `frontend/src/components/MainLayout.tsx` | Menu: esconde Executivo/BI/Regionais para não-SuperAdmin |
