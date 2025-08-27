// kanban.js

// --- CONFIGURAÇÃO ---
const SUPABASE_URL = '%SUPABASE_URL%';
const SUPABASE_ANON_KEY = '%SUPABASE_ANON_KEY%';

const finalSupabaseUrl = SUPABASE_URL.startsWith('%') ? 'https://jgnidubgrwghqsbmthvh.supabase.co' : SUPABASE_URL;
const finalSupabaseAnonKey = SUPABASE_ANON_KEY.startsWith('%' ) ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnbmlkdWJncndnaHFzYm10aHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMzQ0OTQsImV4cCI6MjA2ODgxMDQ5NH0.CYJjbhiPejjqjUZzOnG2H0x-MmFj8QhjR9SUyDYSvtw' : SUPABASE_ANON_KEY;

const { createClient } = window.supabase;
const supabase = createClient(finalSupabaseUrl, finalSupabaseAnonKey);

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

async function fetchOpportunities() {
    const { data, error } = await supabase
        .from('opportunities')
        .select(`
            public_id,
            opportunity_title,
            stage,
            estimated_value,
            contacts:contacts!opportunities_contact_id_fkey ( full_name ),
            users ( agent_name )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao buscar oportunidades:', error);
        alert(`Erro ao carregar dados: ${error.message}`);
        return [];
    }
    return data;
}

function renderKanban(opportunities) {
    const board = document.getElementById('kanban-board');
    if (!board) {
        console.error('Elemento #kanban-board não encontrado.');
        return;
    }
    board.innerHTML = '';

    const opportunitiesByStage = STAGES_ORDER.reduce((acc, stage) => {
        acc[stage] = opportunities.filter(opp => opp.stage === stage);
        return acc;
    }, {});

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
            <div class="kanban-cards-container space-y-3" data-stage-container="${stage}">
                ${cardsHtml}
            </div>
        `;
        
        board.appendChild(columnEl);
    }
}

/**
 * Atualiza o estágio de uma oportunidade no banco de dados.
 * @param {string} opportunityId - O ID da oportunidade a ser atualizada.
 * @param {string} newStage - O novo estágio para a oportunidade.
 */
async function updateOpportunityStage(opportunityId, newStage) {
    const { error } = await supabase
        .from('opportunities')
        .update({ stage: newStage })
        .eq('public_id', opportunityId);

    if (error) {
        console.error(`Erro ao atualizar o estágio para ${newStage}:`, error);
        alert(`Falha ao mover o card: ${error.message}`);
        // Futuramente, podemos adicionar uma lógica para reverter a mudança visual se a atualização falhar.
    } else {
        console.log(`Oportunidade ${opportunityId} movida para ${newStage} com sucesso!`);
    }
}

/**
 * Inicializa a funcionalidade de arrastar e soltar em todas as colunas.
 */
function initializeDragAndDrop() {
    const columns = document.querySelectorAll('.kanban-cards-container');
    
    columns.forEach(column => {
        new Sortable(column, {
            group: 'kanban', // Permite mover cards entre colunas com o mesmo grupo
            animation: 150,
            ghostClass: 'ghost-card', // Classe CSS para o "fantasma" do card enquanto arrasta
            onEnd: (evt) => {
                // Evento disparado quando o card é solto
                const card = evt.item;
                const opportunityId = card.dataset.id;
                const newColumn = evt.to;
                const newStage = newColumn.closest('.kanban-column').dataset.stage;

                console.log(`Card ${opportunityId} movido para a coluna ${newStage}`);
                
                // Chama a função para atualizar o banco de dados
                updateOpportunityStage(opportunityId, newStage);
            }
        });
    });
}

/**
 * Função principal que inicializa a página.
 */
async function initializeApp() {
    const opportunities = await fetchOpportunities();
    renderKanban(opportunities);
    initializeDragAndDrop(); // Ativa o Drag and Drop após renderizar
}

// Inicia a aplicação quando a página carrega
document.addEventListener('DOMContentLoaded', initializeApp);
