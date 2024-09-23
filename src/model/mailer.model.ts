import { Address } from "nodemailer/lib/mailer";

export interface SendEmail {
    from?: Address;
    receptients: Address[];
    subject: string;
    html: string;
    text?: string;
    placeholderReplacements?: Record<string, string>;
}