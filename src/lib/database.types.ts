export type UserRole = "admin" | "secretary";

export type ExamStatus = "pending" | "draft" | "signed";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: UserRole;
          crm: string | null;
          rqe: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role: UserRole;
          crm?: string | null;
          rqe?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      patients: {
        Row: {
          id: string;
          full_name: string;
          cpf: string;
          birth_date: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          cpf: string;
          birth_date: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["patients"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "patients_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      institutions: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          logo_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["institutions"]["Insert"]>;
        Relationships: [];
      };
      report_templates: {
        Row: {
          id: string;
          name: string;
          content_html: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          content_html: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["report_templates"]["Insert"]
        >;
        Relationships: [];
      };
      exams: {
        Row: {
          id: string;
          patient_id: string;
          exam_date: string;
          requesting_doctor: string;
          comorbidities: string | null;
          medications: string | null;
          template_id: string | null;
          institution_id: string | null;
          content_html: string | null;
          status: ExamStatus;
          signed_at: string | null;
          signed_by: string | null;
          signature_payload: Record<string, unknown> | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          exam_date: string;
          requesting_doctor: string;
          comorbidities?: string | null;
          medications?: string | null;
          template_id?: string | null;
          institution_id?: string | null;
          content_html?: string | null;
          status?: ExamStatus;
          signed_at?: string | null;
          signed_by?: string | null;
          signature_payload?: Record<string, unknown> | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["exams"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "exams_patient_id_fkey";
            columns: ["patient_id"];
            isOneToOne: false;
            referencedRelation: "patients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exams_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "report_templates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exams_institution_id_fkey";
            columns: ["institution_id"];
            isOneToOne: false;
            referencedRelation: "institutions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exams_signed_by_fkey";
            columns: ["signed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exams_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Patient = Database["public"]["Tables"]["patients"]["Row"];
export type ReportTemplate =
  Database["public"]["Tables"]["report_templates"]["Row"];
export type Institution = Database["public"]["Tables"]["institutions"]["Row"];
export type Exam = Database["public"]["Tables"]["exams"]["Row"];

export type ExamWithPatient = Exam & {
  patient: Patient;
  institution: Institution | null;
};
