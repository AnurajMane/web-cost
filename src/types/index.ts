export interface AuthUser {
  id: string;
  email: string;
  username: string;
  avatar?: string;
}

export interface AWSAccount {
  id: string;
  user_id: string;
  aws_email: string;
  account_name: string;
  account_id?: string;
  connection_type: 'iam_role' | 'access_key';
  iam_role_arn?: string;
  region: string;
  is_active: boolean;
  last_sync_at?: string;
  created_at: string;
}

export interface CostData {
  id: string;
  aws_account_id: string;
  service_name: string;
  region?: string;
  cost_amount: number;
  usage_quantity?: number;
  usage_unit?: string;
  record_date: string;
  created_at: string;
}

export interface AIRecommendation {
  id: string;
  aws_account_id: string;
  recommendation_type: string;
  title: string;
  description: string;
  potential_savings?: number;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'dismissed' | 'implemented';
  created_at: string;
}

export interface BudgetAlert {
  id: string;
  aws_account_id: string;
  budget_name: string;
  budget_amount: number;
  current_spend: number;
  alert_threshold: number;
  alert_triggered: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  aws_account_id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}