export interface DashboardMetrics {
  compromissosMes: number; // Realizados + Projetados
  realizados: number;
  realizadosPorcentagem: number;
  projetados: number;
  projetadosPorcentagem: number;
  cancelamentos: number;
  cancelamentosPorcentagem: number;
  
  lucroLiquido: number;
  faturamento: number;
  despesas: number;
  lucroMedio: number; // Lucro / Realizados
  salarioHora: number; // Lucro / Horas Trabalhadas
  horasTrabalho: number; // Meta hours (default 150)
  horasTrabalhadas: number; // Sum of durations of completed appointments
  taxaUtilizacao: number; // Horas Trabalhadas / Horas Trabalho * 100
}

export interface ExpenseCategoryItem {
  name: string;
  value: number;
  color: string;
}

export interface ExpenseBreakdown {
  suprimentos: number;
  materiais: number;
  ferramentas: number;
  aluguel: number;
  marketing: number; // Anúncios e promoções
  outros: number;
  total: number;
  categories: ExpenseCategoryItem[];
}

export interface ClientClassification {
  novo: number;
  regular: number;
  inativo: number;
  listaNegra: number;
  retencaoRate: number;
  total: number;
}

export interface ChartDataPoint {
  dateLabel: string; // "dd/MM"
  receita: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  expenses: ExpenseBreakdown;
  clients: ClientClassification;
  revenueHistory: ChartDataPoint[];
}
