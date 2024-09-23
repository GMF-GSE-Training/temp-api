import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from 'nodemailer';
import Mail from "nodemailer/lib/mailer";
import { SendEmail } from "src/model/mailer.model";

@Injectable()
export class MailerService {
    constructor(private readonly configService: ConfigService) { }

    mailTransport() {
        const transporter = nodemailer.createTransport({
            host: this.configService.get<string>('MAIL_HOST'), // smtp.gmail.com
            port: this.configService.get<number>('MAIL_PORT'), // 587
            secure: false, // false untuk port 587
            auth: {
                user: this.configService.get<string>('MAIL_USER'), // your Gmail address
                pass: this.configService.get<string>('MAIL_PASS'), // App Password atau Gmail password
            },
        });

        console.log('Transporter mailTranport : ', transporter);

        return transporter;
    }

    async sendEmail(email: SendEmail) {
        const {from, receptients, subject, html, placeholderReplacements} = email;

        const transport = this.mailTransport();

        const options: Mail.Options = {
            from: from ?? {
                name: this.configService.get<string>('APP_NAME'),
                address: this.configService.get<string>('DEFAULT_EMAIL_FROM'),
            },
            to: receptients,
            subject,
            html,
        }
        
        console.log('OPTIONS : ', options);

        try {
            const result = await transport.sendMail(options);
            console.log('RESULT: ', result)
            return result
        } catch (e) {
            console.log(e);
        }
    }
}