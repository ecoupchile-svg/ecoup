export type UserRole = 'USER' | 'RECYCLER';

export type RequestStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'EVIDENCE_UPLOADED'
  | 'COMPLETED';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  avatar_url?: string;
  rating_avg?: number;
  rating_count?: number;
  created_at: string;
}

export interface RecycleRequest {
  id: string;
  user_id: string;
  recycler_id?: string;
  title: string;
  description: string;
  waste_type: string;
  estimated_weight?: number;
  address: string;
  latitude: number;
  longitude: number;
  status: RequestStatus;
  scheduled_at?: string;
  created_at: string;
  updated_at: string;
  user_profile?: Profile;
  recycler_profile?: Profile;
  evidence?: Evidence;
  rating?: Rating;
}

export interface Evidence {
  id: string;
  request_id: string;
  recycler_id: string;
  image_url: string;
  latitude: number;
  longitude: number;
  notes?: string;
  created_at: string;
}

export interface Rating {
  id: string;
  request_id: string;
  rater_id: string;
  rated_id: string;
  score: number;
  comment?: string;
  created_at: string;
}
