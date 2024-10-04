import { HttpException, Inject, Injectable } from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { PrismaService } from "../common/service/prisma.service";
import { ValidationService } from "../common/service/validation.service";
import { AuthResponse, CurrentUserRequest, RegisterUserRequest, ResetPassword } from "../model/auth.model";
import { LoginUserRequest } from "../model/auth.model";
import { Logger } from "winston";
import { AuthValidation } from "./auth.validation";
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { SendEmail } from "src/model/mailer.model";
import { MailerService } from "src/mailer/mailer.service";
import { ConfigService } from "@nestjs/config";
import { ParticipantService } from "src/participant/participant.service";

@Injectable()
export class AuthService {
    constructor(
        private readonly validationService: ValidationService,
        @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
        private readonly prismaService: PrismaService,
        private readonly jwtService: JwtService,
        private readonly mailerService: MailerService,
        private readonly configService: ConfigService,
        private participantService: ParticipantService,
    ) {}

    async register(req: RegisterUserRequest): Promise<AuthResponse> {
        if(req.roleId) {
            throw new HttpException('Anda tidak berhak menentukan role', 403);
        }

        const defaultRole = await this.prismaService.role.findFirst({
            where: { 
                role: {
                    equals: "user",
                    mode: "insensitive"
                }
            }
        });

        if (!defaultRole) {
            throw new HttpException("Role tidak ditemukan", 404);
        }

        req.roleId = defaultRole.id;

        const registerRequest: RegisterUserRequest = this.validationService.validate(AuthValidation.REGISTER, req);

        const participant = await this.prismaService.participant.findUnique({
            where: {
                nik: req.nik,
            }
        });

        if(participant) {
            if (registerRequest.email !== participant.email) {
                throw new HttpException('Email tidak sesuai dengan data peserta', 400);
            }
    
            if (participant.no_pegawai && registerRequest.no_pegawai !== participant.no_pegawai) {
                throw new HttpException('No Pegawai tidak sesuai dengan data peserta', 400);
            }
    
            if (participant.dinas && registerRequest.dinas !== participant.dinas) {
                throw new HttpException('Dinas tidak sesuai dengan data peserta', 400);
            }
        }

        await this.checkUserExists(registerRequest.no_pegawai, registerRequest.email);

        registerRequest.password = await bcrypt.hash(registerRequest.password, 10);

        const authSelectedFields = this.authSelectedFields();

        let user = await this.prismaService.user.create({
            data: registerRequest,
            select: authSelectedFields,
        });

        // Buat participant berdasarkan data user
        // await this.prismaService.participant.create({
        //     data: {
        //         no_pegawai: user.no_pegawai,
        //         nama: user.name,
        //         nik: user.nik,
        //         email: user.email,
        //         dinas: user.dinas,
        //     },
        // });

        const token = await this.jwtService.signAsync({ sub: user.id }, {
            expiresIn: '1d',
        });

        user = await this.prismaService.user.update({
            where: { 
                id: user.id 
            },
            data: { 
                token 
            },
            select: authSelectedFields,
        });

        const result = {
            ...user,
        }

        const createParticipant = {
            no_pegawai: user.no_pegawai,
            nama: user.name,
            nik: user.nik,
            email: user.email,
            dinas: user.dinas,
        };

        const userRegister: CurrentUserRequest = {
            user: {
                ...user,
            }
        };

        this.participantService.createParticipant(createParticipant, userRegister);

        const verificationLink = `http://localhost:3000/auth/verify-email?token=${token}`;

        const email: SendEmail = {
            from: {
                name: this.configService.get<string>('APP_NAME'),
                address: this.configService.get<string>('MAIL_USER'),
            },
            receptients: [{
                name: user.name,
                address: user.email,
            }],
            subject: 'Email Verifikasi',
            html: `<p>Klik <a href="${verificationLink}">link ini</a> untuk memverifikasi akun Anda.</p>`,
        };

        await this.mailerService.sendEmail(email);
        
        return this.toAuthResponse(result);
    }
    
    async login(req: LoginUserRequest): Promise<AuthResponse> {
        const loginRequest: LoginUserRequest = this.validationService.validate(AuthValidation.LOGIN, req);

        let user: any;
        if(loginRequest.identifier.includes('@')) {
            user = await this.prismaService.user.findFirst({
                where: {
                    email: loginRequest.identifier,
                },
            });
        } else {
            user = await this.prismaService.user.findFirst({
                where: {
                    no_pegawai: loginRequest.identifier
                }
            });
        }

        if(!user || !user.emailVerified) {
            throw new HttpException('Akun belum diverifikasi atau data login salah', 401);
        }

        const isPasswordValid = await bcrypt.compare(loginRequest.password, user.password);

        if(!isPasswordValid) {
            throw new HttpException('no_pegawai or email or password is invalid', 401);
        }

        const payload = { sub: user.id };
        const authSelectedFields = this.authSelectedFields();

        try {
            const token = await this.jwtService.signAsync(payload);
            user = await this.prismaService.user.update({
                where: { 
                    id: user.id 
                },
                data: { 
                    token 
                },
                select: authSelectedFields,
            });
        } catch (error) {
            throw new HttpException('Failed to generate token', 500);
        }

        return this.toAuthResponse(user);
    }

    async me(me: CurrentUserRequest): Promise<AuthResponse> {
        const user = await this.prismaService.user.findUnique({
            where: { 
                id: me.user.id
            },
            include: {
                role: true,
            }
        });

        if (!user) {
            throw new HttpException('User not found', 404);
        }

        return {
            id: user.id,
            name: user.name,
            role: {
                id: user.role.id,
                role: user.role.role,
            }
        }
    }

    async requestPasswordReset(email: string): Promise<string> {
        // Cek apakah email ada di database
        const user = await this.prismaService.user.findFirst({
            where: {
                email: email,
            }
        });

        if (!user) {
            throw new HttpException('Email tidak ditemukan', 404);
        }

        // Buat token reset password
        const resetToken = this.jwtService.sign({ email }, { expiresIn: '1h' });
    
        // Kirim email reset password
        const resetPasswordLink = `http://${this.configService.get<string>('HOST')}:3000/auth/verify-reset-password/${resetToken}`;
        await this.mailerService.sendEmail({
            from: {
                name: this.configService.get<string>('APP_NAME'),
                address: this.configService.get<string>('MAIL_USER'),
            },
            receptients: [{
                name: user.name,
                address: email,
            }],
            subject: 'Reset Password',
            html: `<p>Klik <a href="${resetPasswordLink}">link ini</a> untuk mereset password Anda.</p>`,
        });

        return 'Email reset password sudah dikirim';
    }

    async verifyResetPasswordToken(token: string): Promise<boolean> {
        try {
            // Verifikasi token
            this.jwtService.verify(token);
            return true; // Token valid
        } catch (error) {
            throw new HttpException('Token tidak valid atau sudah kadaluarsa', 400);
        }
    }

    async resetPassword(req: ResetPassword): Promise<string> {
        const resetPasswordRequest = this.validationService.validate(AuthValidation.RESETPASSWORD, req);
        try {
            // Verifikasi token
            const payload = this.jwtService.verify(req.token);
            const email = payload.email;

            // Cari user berdasarkan email
            const user = await this.prismaService.user.findFirst({ where: { email } });
            if (!user) {
                throw new HttpException('User tidak ditemukan', 404);
            }

            // Hash password baru dan update di database
            const hashedPassword = await bcrypt.hash(resetPasswordRequest.newPassword, 10);
            await this.prismaService.user.update({
                where: { id: user.id },
                data: { password: hashedPassword },
            });

            return 'Password berhasil diubah';
        } catch (error) {
            throw new HttpException('Token tidak valid atau sudah kadaluarsa', 400);
        }
    }

    async logout(user: CurrentUserRequest): Promise<AuthResponse> {
        const authSelectedFields = this.authSelectedFields();
        const result = await this.prismaService.user.update({
            where: {
                id: user.user.id,
            },
            data: {
                token: null,
            },
            select: authSelectedFields,
        });

        return this.toAuthResponse({
            ...result,
        });
    }

    async checkUserExists(no_pegawai: string, email: string) {
        if (no_pegawai) {
            const totalUserwithSameNoPegawai = await this.prismaService.user.count({
                where: {
                    no_pegawai: no_pegawai,
                }
            });
    
            if (totalUserwithSameNoPegawai != 0) {
                throw new HttpException("No pegawai sudah digunakan", 400);
            }
        }

        const totalUserwithSameEmail = await this.prismaService.user.count({
            where: {
                email: email,
            }
        });

        if(totalUserwithSameEmail != 0) {
            throw new HttpException("Email sudah digunakan", 400);
        }
    }

    authSelectedFields() {
        return {
            id: true,
            no_pegawai: true,
            email: true,
            name: true,
            nik: true,
            dinas: true,
            roleId: true,
            token: true,
        }
    }

    toAuthResponse(user: AuthResponse): AuthResponse {
        return {
            id: user.id,
            no_pegawai: user.no_pegawai,
            email: user.email,
            name: user.name,
            dinas: user.dinas,
            roleId: user.roleId,
            token: user.token,
        };
    }
}