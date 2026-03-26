import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, Users, Settings, FileText, Activity, Plus, Edit, Trash2, 
  MessageSquare, LogOut, Menu, X, Filter, BarChart2, CheckSquare, 
  AlertCircle, Paperclip, ChevronDown, Eye, FileImage
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// --- CONFIGURAÇÃO FIREBASE (A SUA BASE DE DADOS REAL) ---
const firebaseConfig = {
  apiKey: "AIzaSyAEntZ_U6fcZSggVvBT3WpZn6WccVNL8Mw",
  authDomain: "gestao-adm-3cbcb.firebaseapp.com",
  projectId: "gestao-adm-3cbcb",
  storageBucket: "gestao-adm-3cbcb.firebasestorage.app",
  messagingSenderId: "81588169589",
  appId: "1:81588169589:web:a7501ffa1907ebaa72c13c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const appId = 'gestao-operacional-app';

// --- DADOS INICIAIS ---
const INITIAL_SITES = [
  { nome: 'Unilever - Aguaí (SP)', responsavel: 'ERICK FERNANDO NASCIMENTO SOUZA' },
  { nome: 'Nestlé - Caçapava (SP)', responsavel: 'ERICK FERNANDO NASCIMENTO SOUZA' },
  { nome: 'Lessafre - Narandiba (SP)', responsavel: 'ERICK FERNANDO NASCIMENTO SOUZA' },
  { nome: 'Nestlé - Ribeirão Preto (SP)', responsavel: 'ERICK FERNANDO NASCIMENTO SOUZA' },
  { nome: 'Cargill - Uberlândia (MG)', responsavel: 'ERICK FERNANDO NASCIMENTO SOUZA' },
  { nome: 'Heineken - Passos (MG)', responsavel: 'ERICK FERNANDO NASCIMENTO SOUZA' },
  { nome: 'Nestlé - Montes Claros (MG)', responsavel: 'ERICK FERNANDO NASCIMENTO SOUZA' },
  { nome: 'Cargill - Goiânia (GO)', responsavel: 'GUSTAVO DE OLIVEIRA SOUSA' },
  { nome: 'Cargill - Goianira (GO)', responsavel: 'GUSTAVO DE OLIVEIRA SOUSA' },
  { nome: 'Cargill - Anápolis (GO)', responsavel: 'GUSTAVO DE OLIVEIRA SOUSA' },
  { nome: 'Nestlé - Vila Velha (ES)', responsavel: 'GUSTAVO DE OLIVEIRA SOUSA' },
  { nome: 'Cargill - Barreiras (BA)', responsavel: 'GUSTAVO DE OLIVEIRA SOUSA' },
  { nome: 'Cargill - Porto Nacional (TO)', responsavel: 'GUSTAVO DE OLIVEIRA SOUSA' },
];

const MOTIVOS_CLT = [
  'Art 482 a - Ato de improbidade',
  'Art 482 b - Incontinência de conduta / Mau procedimento',
  'Art 482 c - Negociação habitual sem permissão',
  'Art 482 d - Condenação criminal do empregado',
  'Art 482 e - Desídia',
  'Art 482 f - Embriaguez habitual ou em serviço',
  'Art 482 g - Violação de segredo da empresa',
  'Art 482 h - Ato de indisciplina ou insubordinação',
  'Art 482 i - Abandono de emprego',
  'Art 482 j - Ato lesivo da honra ou boa fama no serviço',
  'Art 482 k - Ato lesivo contra o empregador e superiores',
  'Art 482 l - Prática constante de jogos de azar',
  'Art 482 m - Perda da habilitação profissional',
  'Outros'
];

// Gerador automático de Competências de 2026 a 2030 (Ex: 01/26)
const COMPETENCIAS = [];
for (let y = 26; y <= 30; y++) {
  for (let m = 1; m <= 12; m++) {
    COMPETENCIAS.push(`${m.toString().padStart(2, '0')}/${y}`);
  }
}

const DEFAULT_MODULES = [
  {
    id: 'controle_ponto', title: 'Controle de Ponto',
    columns: [
      { key: 'criador', label: 'Usuário', type: 'text' },
      { key: 'competencia', label: 'Competência', type: 'select', options: COMPETENCIAS },
      { key: 'data', label: 'Data', type: 'date' },
      { key: 'administrativo', label: 'Administrativo', type: 'text' },
      { key: 'faltas', label: 'Faltas (Qtd)', type: 'number' },
      { key: 'situacao', label: 'Situação', type: 'select', options: ['Pendente', 'Concluído', 'Cancelado'] }
    ]
  },
  {
    id: 'medida_disciplinar', title: 'Medida Disciplinar',
    columns: [
      { key: 'criador', label: 'Usuário', type: 'text' },
      { key: 'competencia', label: 'Competência', type: 'select', options: COMPETENCIAS },
      { key: 'data', label: 'Data', type: 'date' },
      { key: 'nome', label: 'Nome do Colaborador', type: 'text' },
      { key: 'tipo', label: 'Tipo', type: 'select', options: ['Advertência', 'Suspensão'] },
      { key: 'motivo_clt', label: 'Motivo CLT', type: 'select', options: MOTIVOS_CLT },
      { key: 'status', label: 'Status', type: 'select', options: ['Pendente', 'Aplicada', 'Cancelada', 'Concluído'] }
    ]
  },
  {
    id: 'transferencia_mob', title: 'Transferência MOB',
    columns: [
      { key: 'criador', label: 'Usuário', type: 'text' },
      { key: 'competencia', label: 'Competência', type: 'select', options: COMPETENCIAS },
      { key: 'data_saida', label: 'Data Saída', type: 'date' },
      { key: 'data_chegada', label: 'Data Chegada', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['Aguardando', 'Em Trânsito', 'Concluído', 'Cancelado'] }
    ]
  },
  {
    id: 'veiculos', title: 'Veículos',
    columns: [
      { key: 'criador', label: 'Usuário', type: 'text' },
      { key: 'competencia', label: 'Competência', type: 'select', options: COMPETENCIAS },
      { key: 'placa', label: 'Placa', type: 'text' },
      { key: 'condutor', label: 'Condutor', type: 'text' },
      { key: 'motivo', label: 'Motivo/Trajeto', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Em uso', 'Aguardando', 'Devolvido', 'Concluído', 'Cancelado'] }
    ]
  },
  {
    id: 'fechamento_ponto', title: 'Fechamento de Ponto',
    columns: [
      { key: 'criador', label: 'Usuário', type: 'text' },
      { key: 'competencia', label: 'Competência', type: 'select', options: COMPETENCIAS },
      { key: 'data', label: 'Data', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['Pendente', 'Em Análise', 'Concluído', 'Cancelado'] }
    ]
  },
  {
    id: 'solicitacao_integracao', title: 'Solicitação de Integração',
    columns: [
      { key: 'criador', label: 'Usuário', type: 'text' },
      { key: 'competencia', label: 'Competência', type: 'select', options: COMPETENCIAS },
      { key: 'data', label: 'Data', type: 'date' },
      { key: 'colaborador', label: 'Colaborador', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Pendente', 'Agendado', 'Concluído', 'Cancelado'] }
    ]
  },
  {
    id: 'solicitacao_sr', title: 'Solicitação de SR',
    columns: [
      { key: 'criador', label: 'Usuário', type: 'text' },
      { key: 'competencia', label: 'Competência', type: 'select', options: COMPETENCIAS },
      { key: 'status', label: 'Status', type: 'select', options: ['Pendente', 'Aprovado', 'Rejeitado', 'Concluído', 'Cancelado'] }
    ]
  }
];

// Helper para cores dinâmicas de Status/Situação
const getStatusBadge = (statusValue) => {
  const val = (statusValue || '').toLowerCase().trim();
  let colorClass = 'bg-slate-700 text-slate-300 border-slate-600'; // Padrão: Cinza

  // Verde (Positivos / Concluídos)
  if (['concluído', 'concluída', 'aprovado', 'aplicada', 'devolvido'].includes(val)) {
    colorClass = 'bg-emerald-900/50 text-emerald-400 border-emerald-800/50';
  } 
  // Amarelo/Laranja (Pendências / Espera)
  else if (['pendente', 'aguardando', 'agendado'].includes(val)) {
    colorClass = 'bg-amber-900/50 text-amber-400 border-amber-800/50';
  } 
  // Azul (Em andamento / Ação)
  else if (['em análise', 'em trânsito', 'em uso', 'em andamento'].includes(val)) {
    colorClass = 'bg-blue-900/50 text-blue-400 border-blue-800/50';
  } 
  // Vermelho (Problemas / Cancelamentos)
  else if (['cancelado', 'cancelada', 'rejeitado', 'atraso'].includes(val)) {
    colorClass = 'bg-red-900/50 text-red-400 border-red-800/50';
  }

  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${colorClass} whitespace-nowrap`}>
      {statusValue || '-'}
    </span>
  );
};

// --- COMPONENTES AUXILIARES ---
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-900">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1 text-slate-200">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---
export default function App() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [appUser, setAppUser] = useState(null);
  
  // Dados do Firestore
  const [appUsers, setAppUsers] = useState([]);
  const [sites, setSites] = useState([]);
  const [activities, setActivities] = useState([]);
  const [customModules, setCustomModules] = useState([]);
  const [chartMetrics, setChartMetrics] = useState([]);

  // UI State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);

  // Define o título do separador do navegador
  useEffect(() => {
    document.title = "Gestão ADM - Estratégico";
  }, []);

  // Inicialização do Firebase Auth
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Erro ao autenticar no Firebase:", err);
      }
    };
    initAuth();
    const unsub = onAuthStateChanged(auth, (u) => setFirebaseUser(u));
    return () => unsub();
  }, []);

  // Busca de Dados
  useEffect(() => {
    if (!firebaseUser || !db) return;

    const basePath = `artifacts/${appId}/public/data`;
    
    const unsubUsers = onSnapshot(collection(db, basePath, 'appUsers'), (snap) => {
      setAppUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, console.error);

    const unsubSites = onSnapshot(collection(db, basePath, 'sites'), (snap) => {
      const fetchedSites = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSites(fetchedSites);
      setDataLoaded(true);
    }, console.error);

    const unsubActs = onSnapshot(collection(db, basePath, 'activities'), (snap) => {
      setActivities(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, console.error);

    const unsubMods = onSnapshot(collection(db, basePath, 'customModules'), (snap) => {
      setCustomModules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, console.error);

    const unsubMetrics = onSnapshot(collection(db, basePath, 'chartMetrics'), (snap) => {
      setChartMetrics(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, console.error);

    return () => { unsubUsers(); unsubSites(); unsubActs(); unsubMods(); unsubMetrics(); };
  }, [firebaseUser]);

  // Inicializa Sites padrão se o banco estiver vazio
  useEffect(() => {
    if (dataLoaded && sites.length === 0 && firebaseUser && db) {
      const seedSites = async () => {
        const basePath = `artifacts/${appId}/public/data/sites`;
        for (const site of INITIAL_SITES) {
          await addDoc(collection(db, basePath), site);
        }
      };
      seedSites();
    }
  }, [dataLoaded, sites, firebaseUser]);

  // Regra de Negócio: Auto-criação Fechamento de Ponto
  useEffect(() => {
    if (!dataLoaded || sites.length === 0 || !db) return;
    const today = new Date();
    const day = today.getDate();
    const allowedDays = [10, 15, 25, 30];
    
    if (allowedDays.includes(day)) {
      const dateStr = today.toISOString().split('T')[0];
      const basePath = `artifacts/${appId}/public/data/activities`;
      
      sites.forEach(site => {
        const exists = activities.some(a => 
          a.type === 'fechamento_ponto' && 
          a.siteId === site.id && 
          a.data === dateStr
        );
        
        if (!exists) {
          const compMes = String(today.getMonth() + 1).padStart(2, '0');
          const compAno = String(today.getFullYear()).slice(-2);
          
          addDoc(collection(db, basePath), {
            type: 'fechamento_ponto',
            siteId: site.id,
            data: dateStr,
            competencia: `${compMes}/${compAno}`,
            criador: 'Sistema Automático',
            status: 'Pendente',
            history: [{ user: 'Sistema', text: 'Criado automaticamente', timestamp: new Date().toISOString() }],
            anexos: []
          }).catch(console.error);
        }
      });
    }
  }, [dataLoaded, sites.length, activities.length]);

  // --- FILTROS DE DADOS BASEADOS NO USUÁRIO ---
  const isMaster = appUser?.role === 'master';
  
  const visibleSites = useMemo(() => {
    if (!appUser) return [];
    const filtered = isMaster 
      ? sites 
      : sites.filter(s => s.responsavel?.toLowerCase() === appUser.responsavelName?.toLowerCase());
    
    return [...filtered].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [sites, isMaster, appUser]);
  
  const visibleActivities = activities.filter(a => visibleSites.some(s => s.id === a.siteId));
  const allModules = [...DEFAULT_MODULES, ...customModules];

  const handleLogin = (e) => {
    e.preventDefault();
    const user = appUsers.find(u => u.email === loginEmail && u.password === loginPassword);
    
    // Fallback/Master backdoor para primeiro acesso se banco estiver vazio
    const isMasterEmail = loginEmail.toLowerCase().includes('yago');
    
    if (user) {
      setAppUser({ ...user, role: isMasterEmail ? 'master' : 'admin' });
    } else if (isMasterEmail && appUsers.length === 0) {
      // Cria o primeiro master dinamicamente se a base estiver zerada
      const newMaster = { 
        email: loginEmail, 
        password: loginPassword, 
        name: 'Master Yago',
        responsavelName: 'MASTER'
      };
      setAppUser({ ...newMaster, role: 'master' });
      if(db) addDoc(collection(db, `artifacts/${appId}/public/data/appUsers`), newMaster);
    } else {
      setLoginError('Credenciais inválidas ou usuário não cadastrado.');
    }
  };

  const logout = () => {
    setAppUser(null);
    setLoginEmail('');
    setLoginPassword('');
  };

  if (!firebaseUser) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Conectando ao sistema...</div>;
  }

  if (!appUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
        <div className="bg-slate-800 p-8 rounded-lg shadow-2xl w-full max-w-md border border-slate-700">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-3 rounded-full shadow-lg">
              <Activity size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-white mb-2">Portal ADM Estratégico</h1>
          <p className="text-slate-400 text-center mb-6 text-sm">Faça login para acessar o painel</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">E-mail</label>
              <input 
                type="email" required
                className="w-full bg-slate-700 border border-slate-600 rounded-md p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Senha</label>
              <input 
                type="password" required
                className="w-full bg-slate-700 border border-slate-600 rounded-md p-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>
            {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md py-2.5 transition-colors mt-2">
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col md:flex-row text-slate-200 font-sans">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} flex-shrink-0 bg-slate-800 border-r border-slate-700 transition-all duration-300 flex flex-col sticky top-0 h-screen overflow-y-auto hidden md:flex`}>
        <div className="p-4 flex items-center justify-between border-b border-slate-700">
          {sidebarOpen && <span className="font-bold text-white tracking-wide truncate">GEOT Painel</span>}
          <button type="button" onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-slate-700 rounded text-slate-400">
            <Menu size={20} />
          </button>
        </div>
        
        <div className="p-4 flex flex-col items-center border-b border-slate-700">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-md mb-2">
            {appUser.name?.charAt(0) || 'U'}
          </div>
          {sidebarOpen && (
            <div className="text-center">
              <p className="text-sm font-medium text-white truncate w-48">{appUser.name}</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-blue-400 border border-blue-900/30">
                {appUser.role.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          <NavItem icon={<Home size={18}/>} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} open={sidebarOpen} />
          <div className="pt-4 pb-2">
            {sidebarOpen && <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Módulos</p>}
            {allModules.map(mod => (
              <NavItem 
                key={mod.id} 
                icon={<FileText size={18}/>} 
                label={mod.title} 
                active={activeTab === mod.id} 
                onClick={() => setActiveTab(mod.id)} 
                open={sidebarOpen} 
              />
            ))}
          </div>
          
          {isMaster && (
            <div className="pt-2 border-t border-slate-700">
              <NavItem icon={<Settings size={18}/>} label="Configurações (Master)" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} open={sidebarOpen} />
            </div>
          )}
        </nav>
        
        <div className="p-4 border-t border-slate-700">
          <button type="button" onClick={logout} className="flex items-center w-full p-2 rounded-md hover:bg-red-900/30 text-red-400 transition-colors">
            <LogOut size={18} />
            {sidebarOpen && <span className="ml-3 text-sm font-medium">Sair</span>}
          </button>
        </div>
      </aside>

      <div className="md:hidden bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center sticky top-0 z-20">
        <span className="font-bold text-white tracking-wide">GEOT Painel</span>
        <button type="button" onClick={() => setSidebarOpen(true)} className="p-1 text-slate-400">
          <Menu size={24} />
        </button>
      </div>
      
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black opacity-50" onClick={() => setSidebarOpen(false)}></div>
          <aside className="w-64 bg-slate-800 h-full relative flex flex-col z-50 overflow-y-auto shadow-2xl">
            <div className="p-4 flex items-center justify-between border-b border-slate-700">
              <span className="font-bold text-white tracking-wide truncate">GEOT Painel</span>
              <button type="button" onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-slate-700 rounded text-slate-400">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 p-2 space-y-1">
              <NavItem icon={<Home size={18}/>} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => {setActiveTab('dashboard'); setSidebarOpen(false);}} open={true} />
              <div className="pt-4 pb-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Módulos</p>
                {allModules.map(mod => (
                  <NavItem key={mod.id} icon={<FileText size={18}/>} label={mod.title} active={activeTab === mod.id} onClick={() => {setActiveTab(mod.id); setSidebarOpen(false);}} open={true} />
                ))}
              </div>
              {isMaster && (
                <div className="pt-2 border-t border-slate-700">
                  <NavItem icon={<Settings size={18}/>} label="Configurações (Master)" active={activeTab === 'settings'} onClick={() => {setActiveTab('settings'); setSidebarOpen(false);}} open={true} />
                </div>
              )}
            </nav>
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-900 p-4 lg:p-8">
        {activeTab === 'dashboard' && (
          <Dashboard 
            sites={visibleSites} 
            activities={visibleActivities} 
            chartMetrics={chartMetrics} 
            customModules={customModules}
            isMaster={isMaster}
            appId={appId}
          />
        )}
        
        {activeTab === 'settings' && isMaster && (
          <SettingsPanel appUsers={appUsers} customModules={customModules} db={db} appId={appId} sites={sites} />
        )}
        
        {allModules.some(m => m.id === activeTab) && (
          <ModuleTable 
            moduleDef={allModules.find(m => m.id === activeTab)} 
            sites={visibleSites}
            activities={visibleActivities.filter(a => a.type === activeTab)}
            db={db}
            appId={appId}
            appUser={appUser}
          />
        )}
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, open }) {
  return (
    <button 
      type="button"
      onClick={onClick}
      className={`flex items-center w-full p-2.5 rounded-lg transition-colors ${
        active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700 hover:text-white'
      }`}
      title={label}
    >
      <span className={`${active ? 'text-white' : 'text-slate-400'}`}>{icon}</span>
      {open && <span className="ml-3 text-sm font-medium truncate">{label}</span>}
    </button>
  );
}

function Dashboard({ sites, activities, chartMetrics, customModules, isMaster, appId }) {
  const [metricModalOpen, setMetricModalOpen] = useState(false);
  
  const totalSites = sites.length;
  const pendingDemands = activities.filter(a => !['Concluído', 'Devolvido', 'Cancelada'].includes(a.status || a.situacao)).length;
  const completedDemands = activities.filter(a => ['Concluído', 'Devolvido', 'Cancelada'].includes(a.status || a.situacao)).length;

  const performanceByResponsavel = useMemo(() => {
    const stats = {};
    
    sites.forEach(s => {
      const resp = s.responsavel || 'Sem Responsável';
      if (!stats[resp]) {
        stats[resp] = { nome: resp, total: 0, concluidas: 0, pendentes: 0 };
      }
    });

    activities.forEach(a => {
      const site = sites.find(s => s.id === a.siteId);
      if (site) {
        const resp = site.responsavel || 'Sem Responsável';
        if (stats[resp]) {
          const isCompleted = ['Concluído', 'Devolvido', 'Cancelada'].includes(a.status || a.situacao);
          stats[resp].total += 1;
          if (isCompleted) {
            stats[resp].concluidas += 1;
          } else {
            stats[resp].pendentes += 1;
          }
        }
      }
    });

    return Object.values(stats).sort((a, b) => b.total - a.total);
  }, [sites, activities]);

  const chartData = useMemo(() => {
    return sites.map(site => {
      const siteActs = activities.filter(a => a.siteId === site.id);
      
      const faltas = siteActs.filter(a => a.type === 'controle_ponto').reduce((acc, curr) => acc + (Number(curr.faltas) || 0), 0);
      const advertencias = siteActs.filter(a => a.type === 'medida_disciplinar' && a.tipo === 'Advertência').length;
      const suspensoes = siteActs.filter(a => a.type === 'medida_disciplinar' && a.tipo === 'Suspensão').length;
      const veiculos = siteActs.filter(a => a.type === 'veiculos').length;
      
      let dataRow = { site: site.nome, faltas, advertencias, suspensoes, veiculos };

      chartMetrics.forEach(metric => {
        const count = siteActs.filter(a => {
          if (a.type !== metric.moduleId) return false;
          if (metric.matchValue) {
            return String(a[metric.column]) === String(metric.matchValue);
          }
          return a[metric.column] !== undefined && a[metric.column] !== '';
        }).length;
        dataRow[metric.name] = count;
      });

      return dataRow;
    });
  }, [sites, activities, chartMetrics]);

  const allValues = chartData.flatMap(d => Object.values(d).filter(v => typeof v === 'number'));
  const maxValue = allValues.length > 0 ? Math.max(...allValues, 10) : 10;

  const barColors = ['bg-red-500', 'bg-orange-500', 'bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-cyan-500', 'bg-pink-500', 'bg-yellow-500'];
  const metricsKeys = chartData.length > 0 ? Object.keys(chartData[0]).filter(k => k !== 'site') : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b border-slate-700 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard Estratégico</h2>
          <p className="text-slate-400 text-sm mt-1">Visão geral das obras {isMaster ? '(Todas)' : '(Minhas Obras)'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-lg p-5 border border-slate-700 shadow-md flex items-center">
          <div className="p-3 rounded-full bg-blue-900/50 text-blue-400 mr-4">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Obras Ativas</p>
            <p className="text-2xl font-bold text-white">{totalSites}</p>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-5 border border-slate-700 shadow-md flex items-center">
          <div className="p-3 rounded-full bg-orange-900/50 text-orange-400 mr-4">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Demandas Pendentes</p>
            <p className="text-2xl font-bold text-white">{pendingDemands}</p>
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-5 border border-slate-700 shadow-md flex items-center">
          <div className="p-3 rounded-full bg-emerald-900/50 text-emerald-400 mr-4">
            <CheckSquare size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">Concluídas</p>
            <p className="text-2xl font-bold text-white">{completedDemands}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-md overflow-hidden">
        <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex items-center">
          <Users size={20} className="mr-2 text-blue-400" />
          <h3 className="text-white font-semibold">{isMaster ? 'Desempenho da Equipe' : 'Meu Desempenho'}</h3>
        </div>
        <div className="p-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
          {performanceByResponsavel.map(resp => {
            const percent = resp.total === 0 ? 0 : Math.round((resp.concluidas / resp.total) * 100);
            return (
              <div key={resp.nome} className="bg-slate-900 rounded-lg p-4 border border-slate-700 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-slate-200">{resp.nome}</span>
                  <span className="text-xs px-2.5 py-1 bg-blue-900/40 border border-blue-800/50 text-blue-400 rounded-full font-medium">
                    {percent}% Concluído
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 mb-4 overflow-hidden">
                  <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                </div>
                <div className="flex justify-between text-sm bg-slate-800/50 p-2.5 rounded border border-slate-700/50">
                  <div className="flex flex-col items-center">
                    <span className="text-orange-400 font-bold text-lg">{resp.pendentes}</span> 
                    <span className="text-slate-400 text-xs">Pendentes</span>
                  </div>
                  <div className="flex flex-col items-center border-l border-r border-slate-700 px-6">
                    <span className="text-emerald-400 font-bold text-lg">{resp.concluidas}</span> 
                    <span className="text-slate-400 text-xs">Concluídas</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-blue-400 font-bold text-lg">{resp.total}</span> 
                    <span className="text-slate-400 text-xs">Total</span>
                  </div>
                </div>
              </div>
            );
          })}
          {performanceByResponsavel.length === 0 && (
            <p className="text-slate-500 text-sm col-span-full text-center py-6">Nenhum dado de desempenho encontrado.</p>
          )}
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-md overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <div className="flex items-center text-white font-semibold">
            <BarChart2 size={20} className="mr-2 text-blue-400" />
            Comparativo por Obra
          </div>
          {isMaster && (
            <button type="button" onClick={() => setMetricModalOpen(true)} className="flex items-center text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded transition-colors">
              <Plus size={14} className="mr-1" /> Nova Métrica
            </button>
          )}
        </div>
        
        <div className="p-4 flex-1 overflow-x-auto">
          {chartData.length === 0 ? (
            <p className="text-slate-500 text-center py-10">Nenhum dado para exibir.</p>
          ) : (
            <div className="min-w-[800px] h-[400px] flex flex-col pt-8 pb-2">
              <div className="flex-1 flex items-end space-x-2 border-b border-slate-700 relative">
                <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-slate-500 opacity-50 border-r border-slate-700 border-dashed pr-1 items-end pointer-events-none">
                  <span>{maxValue}</span>
                  <span>{Math.round(maxValue * 0.75)}</span>
                  <span>{Math.round(maxValue * 0.5)}</span>
                  <span>{Math.round(maxValue * 0.25)}</span>
                  <span>0</span>
                </div>
                
                <div className="w-8 flex-shrink-0"></div>

                {chartData.map((dataRow, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center group">
                    <div className="flex items-end space-x-1 w-full h-full pb-1 px-1 relative">
                      {metricsKeys.map((mKey, mIdx) => {
                        const val = dataRow[mKey];
                        const heightPct = Math.max((val / maxValue) * 100, val > 0 ? 2 : 0);
                        const colorClass = barColors[mIdx % barColors.length];
                        
                        return (
                          <div 
                            key={mKey} 
                            style={{ height: `${heightPct}%` }} 
                            className={`flex-1 ${colorClass} rounded-t-sm opacity-80 hover:opacity-100 transition-all relative cursor-pointer`}
                            title={`${mKey}: ${val}`}
                          >
                            {val > 0 && heightPct > 10 && (
                              <span className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-[10px] text-slate-300 hidden group-hover:block bg-slate-900 px-1 rounded z-10">
                                {val}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-2 truncate w-full text-center px-1" title={dataRow.site}>
                      {dataRow.site.split('-')[0].trim()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap justify-center mt-6 gap-4">
                {metricsKeys.map((mKey, mIdx) => (
                  <div key={mKey} className="flex items-center text-xs text-slate-300">
                    <span className={`w-3 h-3 rounded-sm ${barColors[mIdx % barColors.length]} mr-1.5`}></span>
                    <span className="capitalize">{mKey.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ChartMetricModal 
        isOpen={metricModalOpen} 
        onClose={() => setMetricModalOpen(false)} 
        customModules={customModules} 
        appId={appId}
      />
    </div>
  );
}

function ChartMetricModal({ isOpen, onClose, customModules, appId }) {
  const [name, setName] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [column, setColumn] = useState('');
  const [matchValue, setMatchValue] = useState('');

  const allModules = [...DEFAULT_MODULES, ...customModules];
  const selectedModule = allModules.find(m => m.id === moduleId);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !moduleId || !column) return;
    
    try {
      const db = getFirestore();
      await addDoc(collection(db, `artifacts/${appId}/public/data/chartMetrics`), {
        name, moduleId, column, matchValue
      });
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Métrica para o Gráfico">
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm mb-1 text-slate-300">Nome da Métrica (Legenda)</label>
          <input required type="text" className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Faltas Injustificadas" />
        </div>
        <div>
          <label className="block text-sm mb-1 text-slate-300">Módulo Fonte</label>
          <select required className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white" value={moduleId} onChange={e => setModuleId(e.target.value)}>
            <option value="">Selecione...</option>
            {allModules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
          </select>
        </div>
        {selectedModule && (
          <div>
            <label className="block text-sm mb-1 text-slate-300">Coluna Alvo</label>
            <select required className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white" value={column} onChange={e => setColumn(e.target.value)}>
              <option value="">Selecione...</option>
              {selectedModule.columns.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
        )}
        {column && (
          <div>
            <label className="block text-sm mb-1 text-slate-300">Valor Específico (Opcional - Conta apenas se igual)</label>
            <input type="text" className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white" value={matchValue} onChange={e => setMatchValue(e.target.value)} placeholder="Deixe em branco para contar apenas se preenchido" />
          </div>
        )}
        <div className="flex justify-end mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 text-slate-300 hover:text-white mr-2">Cancelar</button>
          <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">Salvar Métrica</button>
        </div>
      </form>
    </Modal>
  );
}

function SearchableSiteSelect({ sites, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const selectedSite = sites.find(s => s.id === value);
  const filteredSites = sites.filter(s => 
    s.nome.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <div 
        className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white flex justify-between items-center cursor-pointer hover:bg-slate-600 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedSite ? "text-white truncate pr-2" : "text-slate-400 truncate pr-2"}>
          {selectedSite ? selectedSite.nome : "Escreva ou selecione a obra..."}
        </span>
        <ChevronDown size={16} className="flex-shrink-0 text-slate-400" />
      </div>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-md shadow-xl max-h-60 flex flex-col">
            <div className="p-2 border-b border-slate-600 bg-slate-800 rounded-t-md">
              <input 
                type="text" 
                className="w-full bg-slate-900 border border-slate-500 rounded p-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Pesquisar obra..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
            </div>
            <div className="overflow-y-auto flex-1 p-1">
              {filteredSites.length === 0 ? (
                <div className="p-3 text-sm text-slate-400 text-center">Nenhuma obra encontrada.</div>
              ) : (
                filteredSites.map(site => (
                  <div 
                    key={site.id}
                    className="p-2.5 text-sm text-slate-200 hover:bg-blue-600 hover:text-white rounded cursor-pointer transition-colors truncate"
                    onClick={() => {
                      onChange(site.id);
                      setIsOpen(false);
                      setSearch('');
                    }}
                  >
                    {site.nome}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ModuleTable({ moduleDef, sites, activities, db, appId, appUser }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [viewAttachmentsItem, setViewAttachmentsItem] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState('');
  const [itemToDelete, setItemToDelete] = useState(null);
  
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [selectedSites, setSelectedSites] = useState([]);

  useEffect(() => {
    setSelectedSites([]);
  }, [moduleDef.id]);

  const filteredActivities = activities.filter(a => 
    selectedSites.length === 0 ? true : selectedSites.includes(a.siteId)
  ).sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));

  const handleOpenForm = (item = null) => {
    setFormError('');
    setEditingItem(item);
    if (item) {
      setFormData(item);
    } else {
      const initialData = { siteId: sites[0]?.id || '', type: moduleDef.id, anexos: [], history: [] };

      moduleDef.columns.forEach(col => {
        if (['criador', 'solicitante'].includes(col.key)) {
          initialData[col.key] = appUser.name;
        }
        else if (['status', 'situacao'].includes(col.key) && col.type === 'select' && col.options?.length > 0) {
          initialData[col.key] = col.options[0];
        }
        else if (col.type === 'date') {
          initialData[col.key] = new Date().toISOString().split('T')[0];
        }
      });

      setFormData(initialData);
    }
    setIsFormOpen(true);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setFormError('');
    const newAnexos = [...(formData.anexos || [])];

    for (const file of files) {
      try {
        let fileUrl = null;
        
        if (storage) {
          try {
            const fileRef = ref(storage, `artifacts/${appId}/public/data/attachments/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`);
            await uploadBytes(fileRef, file);
            fileUrl = await getDownloadURL(fileRef);
          } catch (storageErr) {
            console.warn("Storage não configurado corretamente, a usar método alternativo.", storageErr);
          }
        }
        
        if (!fileUrl) {
          if (file.size > 2 * 1024 * 1024) { 
            setFormError(`O ficheiro ${file.name} é muito grande para guardar sem o Firebase Storage nativo (Limite: 2MB).`);
            continue;
          }
          const reader = new FileReader();
          reader.readAsDataURL(file);
          await new Promise(resolve => {
            reader.onload = () => { fileUrl = reader.result; resolve(); }
          });
        }

        newAnexos.push({ name: file.name, url: fileUrl, type: file.type });
      } catch (err) {
        console.error("Erro no upload", err);
        setFormError(`Ocorreu um erro ao processar o ficheiro: ${file.name}`);
      }
    }
    
    setFormData({ ...formData, anexos: newAnexos });
    setUploading(false);
    e.target.value = null;
  };

  const normalizeAnexo = (anx) => {
    if (typeof anx === 'string') return { name: 'Ficheiro Antigo (Link)', url: anx, type: 'link' };
    return anx;
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    setFormError('');
    
    if (!formData.siteId) {
      setFormError("Por favor, selecione a Obra Responsável para continuar.");
      return;
    }

    const basePath = `artifacts/${appId}/public/data/activities`;
    
    const finalData = { ...formData };
    if (!editingItem) {
      if (moduleDef.columns.some(c => c.key === 'criador') && !finalData.criador) finalData.criador = appUser.name;
      if (moduleDef.columns.some(c => c.key === 'solicitante') && !finalData.solicitante) finalData.solicitante = appUser.name;
    }

    try {
      if (editingItem) {
        await updateDoc(doc(db, basePath, editingItem.id), finalData);
      } else {
        await addDoc(collection(db, basePath), finalData);
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
      setFormError("Erro ao guardar o registo.");
    }
  };

  const confirmDelete = async (id) => {
    try {
      await deleteDoc(doc(db, `artifacts/${appId}/public/data/activities`, id));
      setItemToDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSiteFilter = (siteId) => {
    setSelectedSites(prev => 
      prev.includes(siteId) ? prev.filter(id => id !== siteId) : [...prev, siteId]
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-700 pb-4 mb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <FileText className="mr-2 text-blue-500" />
            {moduleDef.title}
          </h2>
        </div>
        
        <div className="flex space-x-2 relative w-full md:w-auto">
          <div className="relative">
            <button 
              type="button"
              onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
              className="flex items-center px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <Filter size={16} className="mr-2" />
              Filtrar Obras {selectedSites.length > 0 && `(${selectedSites.length})`}
              <ChevronDown size={14} className="ml-2" />
            </button>
            
            {filterDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-30 p-2 max-h-64 overflow-y-auto">
                <div className="mb-2 pb-2 border-b border-slate-700">
                  <button type="button" onClick={() => setSelectedSites([])} className="text-xs text-blue-400 hover:text-blue-300 w-full text-left px-2 py-1">
                    Limpar Filtros
                  </button>
                </div>
                {sites.map(site => (
                  <label key={site.id} className="flex items-center space-x-2 p-2 hover:bg-slate-700 rounded cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-500 text-blue-500 focus:ring-blue-500 bg-slate-900"
                      checked={selectedSites.includes(site.id)}
                      onChange={() => toggleSiteFilter(site.id)}
                    />
                    <span className="text-sm text-slate-300 truncate">{site.nome}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          
          <button 
            type="button"
            onClick={() => handleOpenForm()}
            className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white transition-colors"
          >
            <Plus size={16} className="mr-1" /> Novo
          </button>
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-md flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700 text-sm">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-300 uppercase tracking-wider">Obra</th>
                {moduleDef.columns.map(col => (
                  <th key={col.key} className="px-4 py-3 text-left font-semibold text-slate-300 uppercase tracking-wider">{col.label}</th>
                ))}
                <th className="px-4 py-3 text-right font-semibold text-slate-300 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 bg-slate-800">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={moduleDef.columns.length + 2} className="px-4 py-8 text-center text-slate-500">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                filteredActivities.map(act => (
                  <tr key={act.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 py-3 text-slate-200 truncate max-w-[150px]" title={sites.find(s => s.id === act.siteId)?.nome}>
                      {sites.find(s => s.id === act.siteId)?.nome || 'Obra Desconhecida'}
                    </td>
                    {moduleDef.columns.map(col => {
                      let val = act[col.key];
                      if (col.type === 'date' && val) {
                        const [y, m, d] = val.split('-');
                        val = `${d}/${m}/${y}`;
                      }
                      
                      const isStatusCol = col.key === 'status' || col.key === 'situacao';

                      return (
                        <td key={col.key} className="px-4 py-3 text-slate-300 truncate max-w-[150px]" title={!isStatusCol ? val : ''}>
                          {isStatusCol && val ? (
                            getStatusBadge(val)
                          ) : (
                            val || '-'
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      {act.anexos && act.anexos.length > 0 && (
                        <button type="button" onClick={() => setViewAttachmentsItem(act)} className="text-slate-400 hover:text-blue-400 relative" title="Ver Anexos">
                          <Paperclip size={16} />
                          <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                            {act.anexos.length}
                          </span>
                        </button>
                      )}
                      <button type="button" onClick={() => { setEditingItem(act); setIsHistoryOpen(true); }} className="text-slate-400 hover:text-blue-400" title="Histórico / Chat">
                        <MessageSquare size={16} />
                      </button>
                      <button type="button" onClick={() => handleOpenForm(act)} className="text-slate-400 hover:text-emerald-400" title="Editar">
                        <Edit size={16} />
                      </button>
                      <button type="button" onClick={() => setItemToDelete(act.id)} className="text-slate-400 hover:text-red-400" title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingItem ? `Editar - ${moduleDef.title}` : `Novo - ${moduleDef.title}`}>
        <form onSubmit={handleSaveForm} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-900/50 border border-red-500 text-red-200 rounded text-sm">
              {formError}
            </div>
          )}
          
          <div>
            <label className="block text-sm mb-1 text-slate-300">Obra Responsável</label>
            <SearchableSiteSelect 
              sites={sites}
              value={formData.siteId}
              onChange={(val) => setFormData({...formData, siteId: val})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {moduleDef.columns.map(col => (
              <div key={col.key}>
                <label className="block text-sm mb-1 text-slate-300">{col.label}</label>
                {col.type === 'select' ? (
                  <select 
                    className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white"
                    value={formData[col.key] || ''}
                    onChange={e => setFormData({...formData, [col.key]: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    {col.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input 
                    type={col.type} 
                    className={`w-full bg-slate-700 border border-slate-600 rounded p-2 text-white ${['criador', 'solicitante'].includes(col.key) ? 'opacity-60 cursor-not-allowed bg-slate-800' : ''}`}
                    value={formData[col.key] || ''}
                    onChange={e => setFormData({...formData, [col.key]: e.target.value})}
                    disabled={['criador', 'solicitante'].includes(col.key)}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-700">
            <label className="block text-sm mb-2 text-slate-300 flex items-center">
              <Paperclip size={16} className="mr-1" /> Ficheiros Anexados
            </label>
            <div className="flex items-center space-x-4 mb-3">
              <label className="cursor-pointer bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded text-sm transition-colors flex items-center border border-slate-600">
                <Plus size={16} className="mr-2" /> Adicionar Documentos
                <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
              {uploading && <span className="text-sm text-blue-400 animate-pulse font-medium">A enviar ficheiros...</span>}
            </div>
            
            <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {(formData.anexos || []).map((anx, i) => {
                const anexo = normalizeAnexo(anx);
                return (
                  <li key={i} className="bg-slate-900 p-2.5 rounded flex justify-between items-center border border-slate-700">
                    <div className="flex items-center overflow-hidden flex-1 mr-4">
                      {anexo.type?.includes('image') ? <FileImage size={18} className="text-blue-400 mr-2 flex-shrink-0" /> : <FileText size={18} className="text-emerald-400 mr-2 flex-shrink-0" />}
                      <span className="text-sm text-slate-300 truncate" title={anexo.name}>{anexo.name}</span>
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <button type="button" onClick={() => setPreviewFile(anexo)} className="text-slate-400 hover:text-blue-400" title="Visualizar Ficheiro">
                        <Eye size={18} />
                      </button>
                      <button type="button" onClick={() => setFormData({...formData, anexos: formData.anexos.filter((_, idx) => idx !== i)})} className="text-slate-400 hover:text-red-400" title="Remover Ficheiro">
                        <X size={18} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex justify-end pt-4">
            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-slate-300 hover:text-white mr-2">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow">Salvar Registro</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!itemToDelete} onClose={() => setItemToDelete(null)} title="Confirmar Exclusão">
        <p className="text-slate-300 mb-6">Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.</p>
        <div className="flex justify-end space-x-3">
          <button type="button" onClick={() => setItemToDelete(null)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors">Cancelar</button>
          <button type="button" onClick={() => confirmDelete(itemToDelete)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors">Excluir</button>
        </div>
      </Modal>

      {isHistoryOpen && editingItem && (
        <HistoryModal 
          isOpen={isHistoryOpen} 
          onClose={() => setIsHistoryOpen(false)} 
          activity={editingItem} 
          db={db} 
          appId={appId} 
          appUser={appUser} 
        />
      )}

      {viewAttachmentsItem && (
        <Modal isOpen={!!viewAttachmentsItem} onClose={() => setViewAttachmentsItem(null)} title={`Anexos Disponíveis`}>
          <div className="space-y-3">
            {(viewAttachmentsItem.anexos || []).length === 0 ? (
              <p className="text-slate-500 text-center py-6">Nenhum anexo encontrado para este registo.</p>
            ) : (
              (viewAttachmentsItem.anexos || []).map((anx, i) => {
                const anexo = normalizeAnexo(anx);
                return (
                  <div key={i} className="bg-slate-900 p-3 rounded-lg flex justify-between items-center border border-slate-700 shadow-sm">
                    <div className="flex items-center overflow-hidden mr-4">
                      {anexo.type?.includes('image') ? <FileImage size={24} className="text-blue-400 mr-3 flex-shrink-0" /> : <FileText size={24} className="text-emerald-400 mr-3 flex-shrink-0" />}
                      <span className="text-sm text-slate-200 font-medium truncate" title={anexo.name}>{anexo.name}</span>
                    </div>
                    <button type="button" onClick={() => setPreviewFile(anexo)} className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded flex items-center text-sm transition-colors flex-shrink-0">
                      <Eye size={16} className="mr-2"/> Visualizar
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </Modal>
      )}

      {previewFile && (
        <Modal isOpen={!!previewFile} onClose={() => setPreviewFile(null)} title={`A visualizar: ${previewFile.name}`}>
          <div className="w-full flex flex-col items-center justify-center bg-slate-900 rounded-lg overflow-hidden min-h-[50vh] border border-slate-700 p-4">
            {previewFile.type?.startsWith('image/') ? (
              <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-[65vh] object-contain p-2 rounded" />
            ) : (
              <div className="text-center p-8 bg-slate-800 rounded-xl border border-slate-700 shadow-inner max-w-md w-full my-8">
                <FileText size={72} className="mx-auto text-blue-500 mb-4" />
                <h4 className="text-xl font-bold text-white mb-2 truncate" title={previewFile.name}>{previewFile.name}</h4>
                <p className="text-slate-400 mb-8 text-sm leading-relaxed">
                  Por questões de segurança, o navegador pode bloquear a pré-visualização direta de documentos neste painel. <br/><br/>
                  Clique no botão abaixo para abrir o documento num separador seguro ou transferir para o seu dispositivo.
                </p>
                <a href={previewFile.url} download={previewFile.name} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg w-full">
                  <Eye className="mr-2" size={20} /> Abrir Documento
                </a>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function HistoryModal({ isOpen, onClose, activity, db, appId, appUser }) {
  const [msg, setMsg] = useState('');
  
  const handleSend = async (e) => {
    e.preventDefault();
    if(!msg.trim()) return;
    
    const newHistory = [...(activity.history || []), {
      user: appUser.name,
      text: msg,
      timestamp: new Date().toISOString()
    }];
    
    try {
      await updateDoc(doc(db, `artifacts/${appId}/public/data/activities`, activity.id), { history: newHistory });
      activity.history = newHistory;
      setMsg('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Histórico da Atividade">
      <div className="flex flex-col h-[50vh]">
        <div className="flex-1 overflow-y-auto space-y-4 p-2 mb-4 bg-slate-900/50 rounded border border-slate-700">
          {(!activity.history || activity.history.length === 0) ? (
            <p className="text-center text-slate-500 mt-10">Nenhum histórico registrado.</p>
          ) : (
            activity.history.map((h, i) => (
              <div key={i} className={`flex flex-col ${h.user === appUser.name ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${h.user === appUser.name ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                  <p className="text-xs opacity-70 mb-1 flex justify-between gap-4">
                    <span className="font-bold">{h.user}</span>
                    <span>{new Date(h.timestamp).toLocaleString('pt-BR')}</span>
                  </p>
                  <p className="text-sm break-words">{h.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <form onSubmit={handleSend} className="flex gap-2">
          <input 
            type="text" 
            className="flex-1 bg-slate-700 border border-slate-600 rounded p-2.5 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Digite uma observação ou atualização..." 
            value={msg} 
            onChange={e => setMsg(e.target.value)} 
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-4 rounded text-white font-medium transition-colors">
            Enviar
          </button>
        </form>
      </div>
    </Modal>
  );
}

function SettingsPanel({ appUsers, customModules, db, appId, sites }) {
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserResp, setNewUserResp] = useState('');
  
  const [modTitle, setModTitle] = useState('');
  const [modCols, setModCols] = useState([{ key: 'col1', label: '', type: 'text', optionsStr: '' }]);

  const [feedbackMsg, setFeedbackMsg] = useState({ text: '', type: '' });

  const showFeedback = (text, type = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg({ text: '', type: '' }), 4000);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const finalResp = newUserResp === 'SELF' ? newUserName : newUserResp;
      await addDoc(collection(db, `artifacts/${appId}/public/data/appUsers`), {
        email: newUserEmail,
        name: newUserName,
        password: newUserPass,
        responsavelName: finalResp,
        role: newUserEmail.toLowerCase().includes('yago') ? 'master' : 'admin'
      });
      setNewUserEmail(''); setNewUserName(''); setNewUserPass(''); setNewUserResp('');
      showFeedback('Usuário criado com sucesso!');
    } catch(err) { 
      console.error(err);
      showFeedback('Erro ao criar usuário.', 'error');
    }
  };

  const handleCreateModule = async (e) => {
    e.preventDefault();
    if(!modTitle) return;

    const formattedCols = modCols.map(c => {
      const isSelect = c.type === 'select';
      return {
        key: c.key,
        label: c.label,
        type: c.type,
        options: isSelect ? c.optionsStr.split(',').map(s => s.trim()).filter(Boolean) : []
      }
    });

    const baseCols = [
      { key: 'criador', label: 'Usuário', type: 'text' },
      { key: 'competencia', label: 'Competência', type: 'select', options: COMPETENCIAS }
    ];

    const newModule = {
      id: `custom_${Date.now()}`,
      title: modTitle,
      columns: [...baseCols, ...formattedCols]
    };

    try {
      await addDoc(collection(db, `artifacts/${appId}/public/data/customModules`), newModule);
      setModTitle('');
      setModCols([{ key: 'col1', label: '', type: 'text', optionsStr: '' }]);
      showFeedback('Módulo criado com sucesso! Ele já aparecerá na barra lateral.');
    } catch(err) { 
      console.error(err); 
      showFeedback('Erro ao criar módulo.', 'error');
    }
  };

  const uniqueResponsaveis = [...new Set(sites.map(s => s.responsavel))].filter(Boolean);

  return (
    <div className="space-y-8 max-w-5xl mx-auto relative">
      <div>
        <h2 className="text-2xl font-bold text-white border-b border-slate-700 pb-2 flex items-center">
          <Settings className="mr-2 text-blue-500" />
          Configurações do Sistema (Master)
        </h2>
      </div>

      {feedbackMsg.text && (
        <div className={`p-4 rounded-md mb-4 flex items-center shadow-lg border ${
          feedbackMsg.type === 'error' ? 'bg-red-900/80 border-red-700 text-red-200' : 'bg-emerald-900/80 border-emerald-700 text-emerald-200'
        }`}>
          {feedbackMsg.type === 'error' ? <AlertCircle className="mr-2" size={20} /> : <CheckSquare className="mr-2" size={20} />}
          {feedbackMsg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-md">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Users className="mr-2 text-slate-400" size={20} /> Conceder Acesso
          </h3>
          <form onSubmit={handleCreateUser} className="space-y-3">
            <input required type="text" placeholder="Nome Completo" className="w-full bg-slate-700 border border-slate-600 p-2 rounded text-white" value={newUserName} onChange={e => setNewUserName(e.target.value)} />
            <input required type="email" placeholder="E-mail" className="w-full bg-slate-700 border border-slate-600 p-2 rounded text-white" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
            <input required type="text" placeholder="Senha" className="w-full bg-slate-700 border border-slate-600 p-2 rounded text-white" value={newUserPass} onChange={e => setNewUserPass(e.target.value)} />
            
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Vincular a Responsável (Filtro de Obras)</label>
              <select className="w-full bg-slate-700 border border-slate-600 p-2 rounded text-white" value={newUserResp} onChange={e => setNewUserResp(e.target.value)}>
                <option value="">Acesso Total (Deixar vazio para Master)</option>
                <option value="SELF" className="font-semibold text-emerald-400">
                  Vincular ao próprio nome ({newUserName || 'Novo Usuário'})
                </option>
                {uniqueResponsaveis.length > 0 && (
                  <optgroup label="Responsáveis Atuais das Obras">
                    {uniqueResponsaveis.map(r => <option key={r} value={r} className="text-white">{r}</option>)}
                  </optgroup>
                )}
              </select>
            </div>
            
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded font-medium transition">Adicionar Usuário</button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <h4 className="text-sm font-semibold text-slate-300 mb-2">Usuários Cadastrados ({appUsers.length})</h4>
            <ul className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {appUsers.map(u => (
                <li key={u.id} className="text-xs bg-slate-900 p-2 rounded flex justify-between border border-slate-700/50">
                  <div>
                    <span className="font-bold text-white block">{u.name}</span>
                    <span className="text-slate-400">{u.email}</span>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${u.role==='master'?'bg-purple-900/50 text-purple-400':'bg-blue-900/50 text-blue-400'}`}>{u.role}</span>
                    <p className="text-slate-500 mt-1" title="Vínculo de Obras">{u.responsavelName || 'Todas'}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-md">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <FileText className="mr-2 text-slate-400" size={20} /> Nova Atividade Customizada
          </h3>
          <form onSubmit={handleCreateModule} className="space-y-4">
            <input required type="text" placeholder="Nome da Atividade/Painel" className="w-full bg-slate-700 border border-slate-600 p-2 rounded text-white font-semibold text-lg" value={modTitle} onChange={e => setModTitle(e.target.value)} />
            
            <div className="space-y-3 bg-slate-900 p-4 rounded border border-slate-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-300">Colunas da Tabela</span>
                <button type="button" onClick={() => setModCols([...modCols, { key: `col${modCols.length+1}`, label: '', type: 'text', optionsStr: '' }])} className="text-xs text-blue-400 hover:text-white flex items-center">
                  <Plus size={14} className="mr-1"/> Adicionar Coluna
                </button>
              </div>
              
              {modCols.map((c, idx) => (
                <div key={idx} className="flex flex-col space-y-2 p-2 bg-slate-800 border border-slate-700 rounded relative">
                  {modCols.length > 1 && (
                    <button type="button" onClick={() => setModCols(modCols.filter((_, i) => i !== idx))} className="absolute top-2 right-2 text-red-400 hover:text-white"><X size={14}/></button>
                  )}
                  <div className="flex space-x-2">
                    <input required type="text" placeholder="Nome da Coluna" className="flex-1 bg-slate-700 border border-slate-600 p-1.5 rounded text-white text-sm" value={c.label} onChange={e => { const nc = [...modCols]; nc[idx].label = e.target.value; setModCols(nc); }} />
                    <select className="w-28 bg-slate-700 border border-slate-600 p-1.5 rounded text-white text-sm" value={c.type} onChange={e => { const nc = [...modCols]; nc[idx].type = e.target.value; setModCols(nc); }}>
                      <option value="text">Texto</option>
                      <option value="number">Número</option>
                      <option value="date">Data</option>
                      <option value="select">Lista</option>
                    </select>
                  </div>
                  {c.type === 'select' && (
                    <input type="text" placeholder="Opções separadas por vírgula (Ex: Sim, Não)" className="w-full bg-slate-700 border border-slate-600 p-1.5 rounded text-white text-sm" value={c.optionsStr} onChange={e => { const nc = [...modCols]; nc[idx].optionsStr = e.target.value; setModCols(nc); }} required />
                  )}
                </div>
              ))}
            </div>
            
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded font-medium transition flex items-center justify-center">
              <Plus size={18} className="mr-2" /> Salvar Atividade Customizada
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <h4 className="text-sm font-semibold text-slate-300 mb-2">Módulos Customizados ({customModules.length})</h4>
            <div className="flex flex-wrap gap-2">
              {customModules.map(m => (
                <span key={m.id} className="px-2 py-1 bg-slate-700 text-xs text-white border border-slate-600 rounded">
                  {m.title}
                </span>
              ))}
              {customModules.length === 0 && <span className="text-xs text-slate-500">Nenhum módulo criado.</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}