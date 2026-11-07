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
4. Abra **http://127.0.0.1:8000** no navegador.
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
- Na página inicial, pesquise palavras e escolha uma categoria.
- Clique em **Ver informações** para abrir os detalhes do passeio.
- No formulário **Faça parte**, informe nome, e-mail, perfil e mensagem; aceite a autorização para armazenamento local.
- No painel, entre com a senha, preencha os dados e clique em **Salvar passeio**.
- Para editar ou excluir, use os botões ao lado dos passeios existentes.
- O painel mostra os interesses recebidos, permite exportar um backup JSON e apagar as mensagens.
- Ao atualizar a página, os registros continuam salvos em `maceio_nautica.sqlite3`.

## 4. Banco de dados
O arquivo `maceio_nautica.sqlite3` é criado automaticamente na primeira execução. O banco tem duas tabelas:

**tours**: id, title, category, location, description, image_url, image_credit, provider, contact, verified.

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
- `index.html`: página pública.
- `style.css`: identidade visual responsiva.
- `script.js`: busca, filtros, modal e formulário.
- `admin.html` e `admin.js`: painel CRUD e exportação.
- `server.py`: servidor HTTP local, API JSON e SQLite.
- `assets/placeholder.svg`: ilustração de fallback.
- `figma-layout.svg`: arte vetorial de referência importável no Figma.

## 8. Roteiro de demonstração para o professor
1. Abra o site e mostre as categorias com fotos relacionadas ao turismo náutico.
2. Busque por “jangada” e selecione o filtro “Jangada”.
3. Abra os detalhes de um passeio.
4. Abra o painel, cadastre um passeio de teste com dados fictícios.
5. Volte ao site, atualize e veja o novo passeio.
6. Envie um interesse fictício pelo formulário e mostre o registro no painel.
7. Encerre e reinicie o servidor: o passeio e a mensagem permanecem no banco SQLite.
