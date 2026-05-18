export interface IUser {
  phone: string;
  otpChannelId: number;
  name?: string;
  role?: number;
  is_active?: boolean;
  status?: number;
}

export interface IStudent {
  phone: string;
  otpChannelId: number;
}

export interface IStudentResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: "student" | "admin";
  is_active: boolean;
  channel_type: number;
  otpChanelId: number;
  status: number;
  created_at?: Date;
  updated_at?: Date;
}
