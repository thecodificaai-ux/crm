// kanban.js

// --- CONFIGURAÇÃO ---
const SUPABASE_URL = '%SUPABASE_URL%';
const SUPABASE_ANON_KEY = '%SUPABASE_ANON_KEY%';

const finalSupabaseUrl = SUPABASE_URL.startsWith('%') ? 'https://jgnidubgrwghqsbmthvh.supabase.co' : SUPABASE_URL;
const finalSupabaseAnonKey = SUPABASE_ANON_KEY.startsWith('%' ) ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnbmlkdWJncndnaHFzYm10aHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMzQ0OTQsImV4cCI6MjA2ODgxMDQ5NH0.CYJjbhiPejjqjUZzOnG2H0x-MmFj8QhjR9SUyDYSvtw' : SUPABASE_ANON_KEY;

// =================================================================
// CORREÇÃO APLICADA AQUI
// Desestrutura o createClient do objeto global 'supabase' fornecido pelo CDN
// =================================================================
const { createClient } = window.supabase;
const supabase = createClient(finalSupabaseUrl, finalSupabaseAnonKey);


// Define a ordem exata das colunas do Kanban
const STAGES_ORDER = [
    'Nova',
    'Qualificada',
    'Proposta Enviada',
    'Negociação',
    'Analise Financeira',
    'Assinar Contrato',
    'Venda Concluida'
];

// --- FUNÇÕES ---

/**
 * Busca todas as oportunidades e os dados relacionados.
 */
async function fetchOpportunities() {
    const { data, error } = await supabase
        .from('opportunities')
        .select(`
            public_id,
            opportunity_title,
            stage,
            estimated_value,
            contacts ( full_name ),
            users ( agent_name )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao buscar oportunidades:', error);
        // Adiciona um alerta na tela para o usuário
        alert(`Erro ao carregar dados: ${error.message}`);
        return [];
    }
    return data;
}

/**
 * Renderiza o quadro Kanban completo na tela.
 * @param {Array} opportunities - A lista de oportunidades vinda do Supabase.
 */
function renderKanban(opportunities) {
    const board = document.getElementById('kanban-board');
    if (!board) {
        console.error('Elemento #kanban-board não encontrado.');
        return;
    }
    board.innerHTML = ''; // Limpa o quadro antes de renderizar

    // Agrupa as oportunidades por estágio
    const opportunitiesByStage = STAGES_ORDER.reduce((acc, stage) => {
        acc[stage] = opportunities.filter(opp => opp.stage === stage);
        return acc;
    }, {});

    // Cria cada coluna
    for (const stage of STAGES_ORDER) {
        const opportunitiesInStage = opportunitiesByStage[stage];

        const columnEl = document.createElement('div');
        columnEl.className = 'kanban-column bg-gray-100 rounded-lg p-3';
        columnEl.dataset.stage = stage;

        const cardsHtml = opportunitiesInStage.map(opp => `
            <div class="kanban-card bg-white p-4 rounded-md shadow" data-id="${opp.public_id}">
                <h3 class="font-semibold text-gray-800">${opp.opportunity_title}</h3>
                <p class="text-sm text-gray-600 mt-1">${opp.contacts?.full_name || 'Contato não definido'}</p>
                <div class="flex justify-between items-center mt-3">
                    <span class="text-sm font-bold text-blue-600">
                        ${opp.estimated_value ? `R$ ${opp.estimated_value.toLocaleString('pt-BR')}` : 'Sem valor'}
                    </span>
                    <span class="text-xs text-gray-400">
                        ${opp.users?.agent_name || 'Sem vendedor'}
                    </span>
                </div>
            </div>
        `).join('');

        columnEl.innerHTML = `
            <h2 class="font-bold text-lg mb-4 text-gray-700 flex justify-between items-center">
                <span>${stage}</span>
                <span class="text-sm bg-gray-300 text-gray-600 rounded-full px-2 py-1">${opportunitiesInStage.length}</span>
            </h2>
            <div class="kanban-cards-container space-y-3" id="column-${stage.replace(/\s+/g, '-')}">
                ${cardsHtml}
            </div>
        `;
        
        board.appendChild(columnEl);
    }
}

/**
 * Função principal que inicializa a página.
 */
async function initializeApp() {
    const opportunities = await fetchOpportunities();
    renderKanban(opportunities);
}

// Inicia a aplicação quando a página carrega
document.addEventListener('DOMContentLoaded', initializeApp);
