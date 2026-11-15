# Maceió Náutica — MVP com banco de dados SQLite

Projeto acadêmico de Engenharia de Software (UMJ), desenvolvido por Sebastião Fernandes de Araújo Neto, Ariel Marques Duarte e Levi Cardoso Miranda da Silva.

## 1. Requisitos
- Python 3.9 ou mais recente, instalado no computador.
- Navegador (Chrome, Edge ou Firefox).
- Internet para carregar as fontes e as fotografias de referência externas.
- Não precisa instalar bibliotecas Python nem criar conta em serviços de nuvem.

## 2. Como executar (Windows, VS Code)
1. Extraia o ZIP e abra a pasta `maceio-nautica-mvp` no VS Code.
2. Abra **Terminal > Novo Terminal**.
3. No PowerShell, defina uma senha para o painel e execute:

```powershell
$env:ADMIN_PASSWORD="EscolhaUmaSenhaForte123!"
py server.py
```

Se o comando `py` não funcionar, tente `python server.py`.
4. Abra **http://127.0.0.1:8000** no navegador (landing page). A vitrine de passeios fica em **http://127.0.0.1:8000/passeios.html**.
5. Abra **http://127.0.0.1:8000/admin.html** para cadastrar e editar passeios. Use a senha definida no terminal.
6. Para parar, volte ao terminal e pressione **Ctrl+C**.

**macOS/Linux**:
```bash
ADMIN_PASSWORD='EscolhaUmaSenhaForte123!' python3 server.py
```

Se a porta 8000 estiver ocupada, configure outra antes de iniciar:
- Windows PowerShell: `$env:PORT="8080"`
- macOS/Linux: `PORT=8080 ADMIN_PASSWORD='...' python3 server.py`

**Live Server não é necessário e não ativa o banco.** Abrir `index.html` diretamente mostra um catálogo de demonstração, mas os cadastros e formulários exigem `python server.py`.

## 3. Como usar
- A página inicial é uma vitrine no estilo de classificados: busca no topo, categorias, filtros laterais (local, faixa de preço, somente confirmados, favoritos) e ordenação por data ou preço.
- Clique em um anúncio para abrir os detalhes. Use o coração para salvar favoritos (ficam no navegador).
- O botão **Anunciar passeio** abre um formulário; o pedido vai para a lista de interesses do painel, para a equipe confirmar com o prestador antes de publicar.
- No painel, entre com a senha, preencha os dados e clique em **Salvar passeio**.
- Para editar ou excluir, use os botões ao lado dos passeios existentes.
- O painel mostra os interesses recebidos, permite exportar um backup JSON e apagar as mensagens.
- Ao atualizar a página, os registros continuam salvos em `maceio_nautica.sqlite3`.

## 4. Banco de dados
O arquivo `maceio_nautica.sqlite3` é criado automaticamente na primeira execução. O banco tem duas tabelas:

**tours**: id, title, category, location, description, image_url, image_credit, provider, contact, verified, price (R$ por pessoa, opcional), created_at.

Se você já tinha um `maceio_nautica.sqlite3` da versão anterior, o servidor adiciona as colunas `price` e `created_at` automaticamente ao iniciar, sem apagar nada (os registros antigos aparecem como "Preço sob consulta"). Para ver os 8 anúncios novos de demonstração, apague o arquivo `.sqlite3` (faça backup antes).

**interests**: id, name, email, profile, message, created_at.

Para reiniciar os dados de demonstração: pare o servidor, faça backup e exclua o arquivo `maceio_nautica.sqlite3`, depois inicie novamente. **Isso apaga também cadastros e mensagens!**

Para verificar os dados usando Python:
```python
import sqlite3
con = sqlite3.connect('maceio_nautica.sqlite3')
print(con.execute('SELECT id,title,category FROM tours').fetchall())
con.close()
```

## 5. Fotografias
As fotos dos quatro cards apontam para imagens de referência sobre atividades náuticas em Maceió: Prefeitura de Maceió (passeio de barco), Amenit Hotel (catamarã e piscinas naturais), 7Segundos (jangada). Há créditos no site. **Estas imagens são links externos para demonstração acadêmica; não foram incorporadas ao ZIP e os direitos de uso/publicação devem ser verificados com os titulares antes de publicar o site.** Se uma foto externa não carregar, o site mostra a ilustração `assets/placeholder.svg`.

Para usar imagens próprias ou autorizadas, coloque os arquivos na pasta `assets/` e altere a URL do registro no painel para o caminho local (no protótipo atual, o campo exige URL HTTPS). Para imagens locais, altere a validação em `server.py` para permitir caminhos `assets/` e a função `safeImage` em `script.js` para aceitar caminhos relativos seguros; ou hospede as imagens em um endereço HTTPS autorizado.

## 6. Limites e cuidados
- MVP para demonstração **somente em localhost**. Não tem contas individuais, autenticação robusta, TLS, proteção contra força bruta ou política de retenção para publicação pública.
- A senha de administrador é definida por variável de ambiente e enviada somente ao servidor local. Não compartilhe a senha nem publique o servidor na internet.
- O formulário salva nome e e-mail no computador local. Use dados fictícios nos testes e solicite consentimento real antes de coletar informações de pessoas.
- Os passeios iniciais são **categorias ilustrativas**, não ofertas reais; o campo `verified` só deve ser marcado após conferência com o prestador.
- Não há reservas, pagamentos ou disponibilidade em tempo real.
- Para produção: migrar para um backend hospedado, autenticação com contas e permissões, HTTPS, política de privacidade e banco com backups e controles de acesso.

## 7. Estrutura
- `index.html`: landing page de apresentação (ideia, categorias, como funciona, prestadores, dúvidas), com botões para a vitrine.
- `passeios.html`: vitrine de passeios no estilo classificados (busca, filtros, favoritos, detalhes, anunciar). Aceita `?cat=barco` (ou catamara, mergulho, jangada), `?q=palavra` e `#anunciar`.
- `style.css`: identidade visual responsiva.
- `script.js`: busca, filtros, ordenação, favoritos, detalhes e formulário de anúncio.
- `admin.html` e `admin.js`: painel CRUD e exportação.
- `server.py`: servidor HTTP local, API JSON e SQLite.
- `assets/placeholder.svg`: ilustração de fallback.
- `figma-layout.svg`: arte vetorial de referência importável no Figma.

## 8. Roteiro de demonstração para o professor
1. Abra a landing page e mostre a proposta; clique em **Explore nossos passeios** para ir à vitrine com fotos, preços e categorias.
2. Busque por “jangada”, filtre por faixa de preço e ordene por menor preço.
3. Salve um favorito e abra os detalhes de um passeio.
4. Abra o painel, cadastre um passeio de teste com dados fictícios.
5. Volte ao site, atualize e veja o novo passeio.
6. Envie um interesse fictício pelo formulário e mostre o registro no painel.
7. Encerre e reinicie o servidor: o passeio e a mensagem permanecem no banco SQLite.

## Fotos enviadas
As fotos enviadas (formulário "Anunciar passeio" ou painel) ficam na pasta `uploads/`, criada pelo servidor. Aceita JPG, PNG e WebP até 4 MB e reduz a imagem no navegador antes de enviar. Ao salvar um passeio criado a partir de um pedido, o pedido sai da lista de interesses. O upload só funciona com `python server.py` (não no GitHub Pages).
As fotos que nenhum passeio nem pedido usa mais são apagadas automaticamente: ao iniciar o servidor e depois de qualquer alteração feita no painel (apagar pedido, apagar ou editar passeio). Fotos enviadas há menos de 10 minutos são preservadas, para não apagar uma foto cujo envio ainda está em andamento.


## Publicação no GitHub

GitHub Pages exibe a versão estática; cadastros, uploads e painel com banco exigem o servidor Python local. O banco SQLite e a pasta `uploads/` não são versionados. A configuração do Pages exclui arquivos internos, e o servidor preserva o bloqueio de acesso HTTP a bancos, código Python e arquivos ocultos.
