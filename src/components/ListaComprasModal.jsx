import { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  ShoppingCart, 
  Copy, 
  FileDown, 
  MessageCircle, 
  Plus, 
  Trash2, 
  CheckSquare, 
  Square,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ListChecks,
  Check
} from 'lucide-react';
import { 
  CATEGORIAS_COMPRAS, 
  extrairListaDeCompras, 
  formatarListaComprasWhatsApp, 
  baixarPDFListaCompras 
} from '../lib/groceryListGenerator';

export default function ListaComprasModal({ 
  plano, 
  paciente, 
  nutricionista, 
  isOpen, 
  onClose 
}) {
  // Etapa atual: 'selecao' (marcar alimentos do cardápio) ou 'gerada' (lista consolidada por setor)
  const [etapa, setEtapa] = useState('selecao');

  const [listaCategorizada, setListaCategorizada] = useState([]);
  const [novoItemTexto, setNovoItemTexto] = useState('');
  const [novaCategoriaId, setNovaCategoriaId] = useState('hortifruti');
  const [copiado, setCopiado] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState('todas');

  // Inicializa a lista a partir do plano alimentar sempre que o modal for aberto ou o plano mudar
  useEffect(() => {
    if (isOpen && plano) {
      const extraida = extrairListaDeCompras(plano);
      setListaCategorizada(extraida);
      setFiltroCategoria('todas');
      setEtapa('selecao');
    }
  }, [plano, isOpen]);

  // Contadores gerais
  const totalItens = useMemo(() => {
    return listaCategorizada.reduce((acc, cat) => acc + (cat.itens?.length || 0), 0);
  }, [listaCategorizada]);

  const totalSelecionados = useMemo(() => {
    return listaCategorizada.reduce((acc, cat) => {
      const selecionados = (cat.itens || []).filter(i => i.selected !== false).length;
      return acc + selecionados;
    }, 0);
  }, [listaCategorizada]);

  // Alternar seleção de inclusão de um item na lista
  const toggleItemSelection = (catId, itemId) => {
    setListaCategorizada(prev => prev.map(cat => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        itens: cat.itens.map(item => {
          if (item.id !== itemId) return item;
          return { ...item, selected: !item.selected };
        })
      };
    }));
  };

  // Selecionar todos os itens
  const handleSelecionarTodos = () => {
    setListaCategorizada(prev => prev.map(cat => ({
      ...cat,
      itens: cat.itens.map(item => ({ ...item, selected: true }))
    })));
  };

  // Desmarcar todos os itens
  const handleDesmarcarTodos = () => {
    setListaCategorizada(prev => prev.map(cat => ({
      ...cat,
      itens: cat.itens.map(item => ({ ...item, selected: false }))
    })));
  };

  // Remover item
  const handleRemoverItem = (catId, itemId) => {
    setListaCategorizada(prev => prev.map(cat => {
      if (cat.id !== catId) return cat;
      return {
        ...cat,
        itens: cat.itens.filter(item => item.id !== itemId)
      };
    }).filter(cat => cat.itens.length > 0));
  };

  // Adicionar novo item manual
  const handleAdicionarItem = (e) => {
    e.preventDefault();
    if (!novoItemTexto.trim()) return;

    const novoItem = {
      id: `manual-${Math.random().toString(36).substr(2, 9)}`,
      nome: novoItemTexto.trim(),
      selected: true,
      categoria: novaCategoriaId
    };

    setListaCategorizada(prev => {
      const index = prev.findIndex(c => c.id === novaCategoriaId);
      if (index >= 0) {
        const nova = [...prev];
        nova[index] = {
          ...nova[index],
          itens: [...nova[index].itens, novoItem].sort((a, b) => a.nome.localeCompare(b.nome))
        };
        return nova;
      } else {
        const catObj = CATEGORIAS_COMPRAS.find(c => c.id === novaCategoriaId) || CATEGORIAS_COMPRAS[0];
        return [...prev, { ...catObj, itens: [novoItem] }];
      }
    });

    setNovoItemTexto('');
  };

  // Gerar e salvar lista por setor
  const handleGerarListaPorSetor = () => {
    if (totalSelecionados === 0) return;
    setEtapa('gerada');
  };

  // Copiar lista formatada
  const handleCopiarTexto = () => {
    const texto = formatarListaComprasWhatsApp(listaCategorizada, paciente?.nome);
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  // Enviar direto no WhatsApp
  const handleEnviarWhatsApp = () => {
    const texto = formatarListaComprasWhatsApp(listaCategorizada, paciente?.nome);
    let tel = paciente?.whatsapp ? String(paciente.whatsapp).replace(/\D/g, '') : '';
    if (tel.length === 10 || tel.length === 11) {
      tel = `55${tel}`;
    }
    const url = tel
      ? `https://api.whatsapp.com/send?phone=${tel}&text=${encodeURIComponent(texto)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  // Baixar PDF
  const handleBaixarPDF = async () => {
    await baixarPDFListaCompras({
      listaCategorizada,
      paciente,
      nutricionista,
      onProgress: (status) => setGerandoPdf(status)
    });
  };

  // Categorias filtradas para a etapa 1
  const categoriasFiltradas = useMemo(() => {
    if (filtroCategoria === 'todas') return listaCategorizada;
    return listaCategorizada.filter(c => c.id === filtroCategoria);
  }, [listaCategorizada, filtroCategoria]);

  // Categorias finais que contêm apenas itens selecionados (para etapa 2)
  const categoriasFinais = useMemo(() => {
    return listaCategorizada
      .map(cat => ({
        ...cat,
        itens: (cat.itens || []).filter(i => i.selected !== false)
      }))
      .filter(cat => cat.itens.length > 0);
  }, [listaCategorizada]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content lista-compras-modal">
        
        {/* CABEÇALHO COM STEPPER DE ETAPAS */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="calc-modal-icon-badge" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.25) 100%)' }}>
              <ShoppingCart size={22} color="#10b981" />
            </div>
            <div>
              <h3 className="modal-title">Lista de Compras da Semana</h3>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Paciente: <strong>{paciente?.nome || 'Paciente'}</strong>
              </span>
            </div>
          </div>

          {/* Abas do Stepper */}
          <div className="lista-stepper-tabs">
            <button
              type="button"
              className={`stepper-tab-btn ${etapa === 'selecao' ? 'active' : ''}`}
              onClick={() => setEtapa('selecao')}
            >
              <ListChecks size={15} />
              <span>1. Selecionar Alimentos</span>
            </button>

            <button
              type="button"
              className={`stepper-tab-btn ${etapa === 'gerada' ? 'active' : ''}`}
              onClick={() => {
                if (totalSelecionados > 0) setEtapa('gerada');
              }}
              disabled={totalSelecionados === 0}
            >
              <ShoppingCart size={15} />
              <span>2. Lista por Setor ({totalSelecionados})</span>
            </button>
          </div>

          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* CORPO DO MODAL */}
        <div className="modal-body lista-compras-body">
          
          {/* =================================================================
              ETAPA 1: SELEÇÃO E CURADORIA DOS ALIMENTOS DO CARDÁPIO
              ================================================================= */}
          {etapa === 'selecao' && (
            <>
              {/* Barra de Ações de Seleção Rápida */}
              <div className="lista-selection-control-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span className="selection-count-badge">
                    <strong>{totalSelecionados}</strong> de {totalItens} alimentos selecionados
                  </span>
                  
                  <button 
                    type="button" 
                    className="btn-mini-control"
                    onClick={handleSelecionarTodos}
                  >
                    Selecionar Todos
                  </button>

                  <button 
                    type="button" 
                    className="btn-mini-control"
                    onClick={handleDesmarcarTodos}
                  >
                    Desmarcar Todos
                  </button>
                </div>

                {/* Botão de Avanço Rápido */}
                <button
                  type="button"
                  className="btn-generate-sector-list"
                  onClick={handleGerarListaPorSetor}
                  disabled={totalSelecionados === 0}
                >
                  <span>Gerar Lista por Setor ({totalSelecionados})</span>
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* Formulário de Adicionar Alimento Extra */}
              <div className="lista-quick-add-box">
                <form onSubmit={handleAdicionarItem} className="lista-quick-add-form">
                  <input
                    type="text"
                    className="form-input quick-add-input"
                    placeholder="Adicionar outro alimento à lista (ex: Adoçante Stevia, Chá de Camomila)..."
                    value={novoItemTexto}
                    onChange={(e) => setNovoItemTexto(e.target.value)}
                  />
                  
                  <div className="quick-add-select-wrapper">
                    <label className="quick-add-label" htmlFor="quick_add_cat">Corredor:</label>
                    <select
                      id="quick_add_cat"
                      value={novaCategoriaId}
                      onChange={(e) => setNovaCategoriaId(e.target.value)}
                      className="form-select quick-add-select"
                    >
                      {CATEGORIAS_COMPRAS.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button type="submit" className="btn-add-quick-item" disabled={!novoItemTexto.trim()}>
                    <Plus size={16} />
                    <span>Adicionar</span>
                  </button>
                </form>
              </div>

              {/* Barra de Filtros de Categoria em Pílulas */}
              <div className="lista-filter-pills-bar">
                <button
                  type="button"
                  className={`filter-pill-btn ${filtroCategoria === 'todas' ? 'active' : ''}`}
                  onClick={() => setFiltroCategoria('todas')}
                >
                  <span>Todas as categorias</span>
                  <span className="pill-badge">{totalItens}</span>
                </button>
                {CATEGORIAS_COMPRAS.map(cat => {
                  const count = (listaCategorizada.find(c => c.id === cat.id)?.itens || []).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`filter-pill-btn ${filtroCategoria === cat.id ? 'active' : ''}`}
                      onClick={() => setFiltroCategoria(cat.id)}
                      style={filtroCategoria === cat.id ? { borderColor: cat.color, color: cat.color, backgroundColor: cat.bg } : {}}
                    >
                      <span>{cat.icon} {cat.title}</span>
                      <span className="pill-badge">{count}</span>
                    </button>
                  );
                })}
              </div>

              {/* Grid de Itens para Seleção */}
              {categoriasFiltradas.length === 0 ? (
                <div className="lista-empty-state">
                  <ShoppingCart size={40} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                  <h4>Nenhum alimento encontrado</h4>
                  <p>Adicione um alimento no formulário acima ou selecione "Todas as categorias".</p>
                </div>
              ) : (
                <div className="lista-categories-grid">
                  {categoriasFiltradas.map(cat => (
                    <div key={cat.id} className="lista-cat-card" style={{ borderTop: `3px solid ${cat.color}` }}>
                      <div className="lista-cat-header" style={{ color: cat.color }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span style={{ fontSize: '1.15rem' }}>{cat.icon}</span>
                          <strong>{cat.title}</strong>
                        </div>
                        <span className="lista-cat-count" style={{ backgroundColor: cat.bg, color: cat.color }}>
                          {cat.itens.filter(i => i.selected !== false).length}/{cat.itens.length} selecionados
                        </span>
                      </div>

                      <div className="lista-cat-items">
                        {cat.itens.map(item => (
                          <div 
                            key={item.id} 
                            className={`lista-item-row selectable ${item.selected ? 'selected' : 'unselected'}`}
                            onClick={() => toggleItemSelection(cat.id, item.id)}
                          >
                            <button type="button" className="item-checkbox-btn">
                              {item.selected ? (
                                <CheckSquare size={18} color="#00b4d8" />
                              ) : (
                                <Square size={18} color="var(--text-muted)" />
                              )}
                            </button>
                            
                            <span className="item-name" style={{ fontWeight: item.selected ? 600 : 400 }}>
                              {item.nome}
                            </span>

                            <button 
                              type="button" 
                              className="item-btn-remove"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoverItem(cat.id, item.id);
                              }}
                              title="Remover este alimento da lista"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* =================================================================
              ETAPA 2: LISTA DE COMPRAS FINAL ORGANIZADA POR SETOR
              ================================================================= */}
          {etapa === 'gerada' && (
            <>
              {/* Banner de Sucesso da Geração */}
              <div className="lista-generated-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <CheckCircle2 size={20} color="#10b981" />
                  <div>
                    <strong>Lista de Compras Pronta & Organizada por Setor!</strong>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                      Foram consolidados {totalSelecionados} alimentos em {categoriasFinais.length} setores de supermercado.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-back-selection"
                  onClick={() => setEtapa('selecao')}
                >
                  <ArrowLeft size={15} />
                  <span>Ajustar Seleção</span>
                </button>
              </div>

              {/* Grid dos Setores com Apenas os Alimentos Selecionados */}
              <div className="lista-categories-grid">
                {categoriasFinais.map(cat => (
                  <div key={cat.id} className="lista-cat-card" style={{ borderTop: `3px solid ${cat.color}` }}>
                    <div className="lista-cat-header" style={{ color: cat.color }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span style={{ fontSize: '1.15rem' }}>{cat.icon}</span>
                        <strong>{cat.title}</strong>
                      </div>
                      <span className="lista-cat-count" style={{ backgroundColor: cat.bg, color: cat.color }}>
                        {cat.itens.length} {cat.itens.length === 1 ? 'item' : 'itens'}
                      </span>
                    </div>

                    <div className="lista-cat-items">
                      {cat.itens.map(item => (
                        <div key={item.id} className="lista-item-row final-row">
                          <div className="item-bullet-point" style={{ backgroundColor: cat.color }}></div>
                          <span className="item-name" style={{ fontWeight: 600 }}>{item.nome}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>

        {/* RODAPÉ DE AÇÕES */}
        <div className="modal-footer calc-modal-footer">
          {etapa === 'selecao' ? (
            <>
              <button 
                type="button" 
                className="btn-calc-cancel" 
                onClick={onClose}
              >
                Cancelar
              </button>

              <button 
                type="button" 
                className="btn-calc-confirm"
                onClick={handleGerarListaPorSetor}
                disabled={totalSelecionados === 0}
              >
                <Check size={18} strokeWidth={2.5} />
                <span>Gerar & Salvar Lista por Setor ({totalSelecionados})</span>
              </button>
            </>
          ) : (
            <>
              <button 
                type="button" 
                className="btn-calc-cancel" 
                onClick={() => setEtapa('selecao')}
              >
                <ArrowLeft size={16} />
                <span>Voltar e Ajustar</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <button 
                  type="button" 
                  className="btn-calc-cancel" 
                  onClick={handleCopiarTexto}
                  title="Copiar lista de compras para a área de transferência"
                >
                  {copiado ? <CheckCircle2 size={17} color="#10b981" /> : <Copy size={17} />}
                  <span>{copiado ? 'Copiado!' : 'Copiar Texto'}</span>
                </button>

                <button 
                  type="button" 
                  className="btn-calc-cancel"
                  onClick={handleBaixarPDF}
                  disabled={gerandoPdf}
                  title="Baixar lista de compras formatada em PDF A4"
                >
                  <FileDown size={17} color="#0077b6" />
                  <span>{gerandoPdf ? 'Gerando PDF...' : 'Baixar PDF'}</span>
                </button>

                <button 
                  type="button" 
                  className="btn-whatsapp-share"
                  onClick={handleEnviarWhatsApp}
                  title="Enviar lista de compras formatada no WhatsApp do paciente"
                >
                  <MessageCircle size={18} />
                  <span>Enviar no WhatsApp</span>
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
