export interface IUser {
  name: string;
  phone: string;
  role: number;
  otpChannelId?: number;
  is_active: boolean;
  status: number;
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
