
const API_BASE_URL = 'http://localhost:8081/produtos';

// Elementos DOM
const produtoForm = document.getElementById('produtoForm');
const produtosList = document.getElementById('produtosList');
const loading = document.getElementById('loading');
const searchInput = document.getElementById('searchInput');
const btnCancelar = document.getElementById('btnCancelar');
const formTitle = document.getElementById('form-title');
const confirmModal = document.getElementById('confirmModal');
const confirmMessage = document.getElementById('confirmMessage');
const confirmYes = document.getElementById('confirmYes');
const confirmNo = document.getElementById('confirmNo');

let produtoParaExcluir = null;
let editando = false;
let timeoutBusca = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();

    produtoForm.addEventListener('submit', salvarProduto);
    btnCancelar.addEventListener('click', cancelarEdicao);
    confirmYes.addEventListener('click', confirmarExclusao);
    confirmNo.addEventListener('click', fecharModal);

    confirmModal.addEventListener('click', (event) => {
        if (event.target === confirmModal) {
            fecharModal();
        }
    });

    searchInput.addEventListener('input', () => {
        clearTimeout(timeoutBusca);
        timeoutBusca = setTimeout(buscarProdutos, 500);
    });
});

// Comunicação com a API
async function carregarProdutos() {
    try {
        mostrarLoading(true);

        const response = await fetch(API_BASE_URL);

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const produtos = await response.json();
        exibirProdutos(produtos);

    } catch (error) {
        console.error('Erro ao carregar produtos:', error);

        produtosList.innerHTML = `
            <div class="empty-state">
                <h3>❌ Erro ao carregar produtos</h3>
                <p>Verifique se a API está rodando na porta 8081.</p>
            </div>
        `;
    } finally {
        mostrarLoading(false);
    }
}

async function salvarProduto(event) {
    event.preventDefault();

    const produtoId = document.getElementById('produtoId').value;
    const nome = document.getElementById('nome').value.trim();
    const preco = parseFloat(
        document.getElementById('preco').value
    );

    if (!nome || !Number.isFinite(preco) || preco <= 0) {
        alert('Informe um nome e um preço válido.');
        return;
    }

    const produto = {
        nome: nome,
        preco: preco
    };

    try {
        const url = editando
            ? `${API_BASE_URL}/${produtoId}`
            : API_BASE_URL;

        const response = await fetch(url, {
            method: editando ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(produto)
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const mensagem = editando
            ? 'Produto atualizado com sucesso!'
            : 'Produto cadastrado com sucesso!';

        limparFormulario();
        searchInput.value = '';
        await carregarProdutos();

        alert(mensagem);

    } catch (error) {
        console.error('Erro ao salvar produto:', error);
        alert('Erro ao salvar produto. Verifique se a API está funcionando.');
    }
}

async function excluirProduto(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        await carregarProdutos();
        alert('Produto excluído com sucesso!');

    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        alert('Erro ao excluir produto.');
    }
}

async function buscarProdutos() {
    const termo = searchInput.value.trim().toLowerCase();

    try {
        mostrarLoading(true);

        const response = await fetch(API_BASE_URL);

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const produtos = await response.json();

        const produtosFiltrados = produtos.filter(produto =>
            produto.nome.toLowerCase().includes(termo)
        );

        exibirProdutos(produtosFiltrados);

    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
    } finally {
        mostrarLoading(false);
    }
}

// Exibição dos produtos
function exibirProdutos(produtos) {
    if (!produtos || produtos.length === 0) {
        produtosList.innerHTML = `
            <div class="empty-state">
                <h3>📭 Nenhum produto encontrado</h3>
                <p>
                    ${searchInput.value
                        ? 'Tente buscar com outros termos.'
                        : 'Cadastre o primeiro produto usando o formulário acima.'}
                </p>
            </div>
        `;
        return;
    }

    produtosList.innerHTML = produtos.map(produto => `
        <div class="produto-card" data-id="${produto.id}">
            <div class="produto-info">
                <h3>${produto.nome}</h3>
                <p class="preco">
                    R$ ${Number(produto.preco).toFixed(2).replace('.', ',')}
                </p>
                <small>ID: ${produto.id}</small>
            </div>

            <div class="produto-actions">
                <button
                    class="btn-edit"
                    onclick="editarProduto(${produto.id})">
                    ✏️ Editar
                </button>

                <button
                    class="btn-delete"
                    onclick="solicitarExclusao(${produto.id})">
                    🗑️ Excluir
                </button>
            </div>
        </div>
    `).join('');
}

// Edição de produtos
async function editarProduto(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`);

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const produto = await response.json();

        document.getElementById('produtoId').value = produto.id;
        document.getElementById('nome').value = produto.nome;
        document.getElementById('preco').value = produto.preco;

        formTitle.textContent = 'Editar Produto';
        document.getElementById('btnSalvar').textContent = 'Atualizar Produto';

        btnCancelar.style.display = 'inline-block';
        editando = true;

        document.querySelector('.form-section').scrollIntoView({
            behavior: 'smooth'
        });

    } catch (error) {
        console.error('Erro ao carregar produto:', error);
        alert('Erro ao carregar produto para edição.');
    }
}

// Limpeza do formulário
function cancelarEdicao() {
    limparFormulario();
}

function limparFormulario() {
    produtoForm.reset();

    document.getElementById('produtoId').value = '';

    formTitle.textContent = 'Cadastrar Novo Produto';
    document.getElementById('btnSalvar').textContent = 'Cadastrar Produto';

    btnCancelar.style.display = 'none';
    editando = false;
}

// Exclusão com confirmação
function solicitarExclusao(id) {
    produtoParaExcluir = id;

    confirmMessage.textContent =
        `Tem certeza que deseja excluir o produto de ID ${id}?`;

    confirmModal.style.display = 'block';
}

async function confirmarExclusao() {
    if (produtoParaExcluir !== null) {
        const id = produtoParaExcluir;
        fecharModal();
        await excluirProduto(id);
    }
}

function fecharModal() {
    confirmModal.style.display = 'none';
    produtoParaExcluir = null;
}

// Indicador de carregamento
function mostrarLoading(mostrar) {
    loading.style.display = mostrar ? 'block' : 'none';
}
