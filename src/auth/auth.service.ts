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
import * as os from 'os';
import { CoreHelper } from "src/common/helpers/core.helper";

@Injectable()
export class AuthService {
    constructor(
        private readonly validationService: ValidationService,
        @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
        private readonly prismaService: PrismaService,
        private readonly jwtService: JwtService,
        private readonly mailerService: MailerService,
        private readonly configService: ConfigService,
        private readonly coreHelper: CoreHelper,
    ) {}

    async register(req: RegisterUserRequest): Promise<string> {
        const registerRequest: RegisterUserRequest = this.validationService.validate(AuthValidation.REGISTER, req);
    
        if (req.roleId) {
            throw new HttpException('Anda tidak berhak menentukan role', 403);
        }
    
        const defaultRole = await this.prismaService.role.findFirst({
            where: { 
                name: { equals: "user", mode: "insensitive" },
            },
        });
    
        if (!defaultRole) {
            throw new HttpException("Role tidak ditemukan", 404);
        }
    
        req.roleId = defaultRole.id;
    
        const participant = await this.prismaService.participant.findUnique({
            where: { nik: req.nik },
        });
    
        if (participant) {
            if (registerRequest.email !== participant.email) {
                throw new HttpException('Email tidak sesuai dengan data peserta', 400);
            }
    
            if (participant.idNumber && registerRequest.idNumber !== participant.idNumber) {
                throw new HttpException('No Pegawai tidak sesuai dengan data peserta', 400);
            }
    
            if (participant.dinas && registerRequest.dinas !== participant.dinas) {
                throw new HttpException('Dinas tidak sesuai dengan data peserta', 400);
            }
    
            req.participantId = participant.id;
        }
    
        await this.checkUserExists(registerRequest.idNumber, registerRequest.email);
    
        registerRequest.password = await bcrypt.hash(registerRequest.password, 10);
    
        const authSelectedFields = this.authSelectedFields();
    
        // Transaksi Prisma
        const [user] = await this.prismaService.$transaction(async (prisma) => {

            await this.coreHelper.ensureUniqueFields('participant', [
                { field: 'idNumber', value: registerRequest.idNumber, message: 'No Pegawai sudah digunakan' },
                { field: 'nik', value: registerRequest.nik, message: 'NIK sudah digunakan' },
                { field: 'email', value: registerRequest.email, message: 'Email sudah digunakan' }
            ])

            // Buat user
            const user = await prisma.user.create({
                data: registerRequest,
                select: authSelectedFields,
            });
    
            // Buat participant
            const createParticipantData = {
                idNumber: registerRequest.idNumber,
                name: registerRequest.name,
                nik: registerRequest.nik,
                email: registerRequest.email,
                dinas: registerRequest.dinas,
            };
    
            const participant = await prisma.participant.create({
                data: createParticipantData,
            });
    
            // Update user dengan participantId
            const updatedUser = await prisma.user.update({
                where: { id: user.id },
                data: { participantId: participant.id },
                select: authSelectedFields,
            });
    
            return [updatedUser, participant];
        });
    
        // Generate token
        const token = await this.jwtService.signAsync({ sub: user.id }, {
            expiresIn: '1d',
        });
    
        // Kirim email verifikasi
        const networkInterfaces = os.networkInterfaces();
        let localIp = 'localhost';
    
        for (const interfaceName in networkInterfaces) {
            const addresses = networkInterfaces[interfaceName];
            if (addresses) {
                for (const addr of addresses) {
                    if (addr.family === 'IPv4' && !addr.internal) {
                        localIp = addr.address;
                        break;
                    }
                }
            }
        }
    
        const verificationLink = `http://${localIp}:3000/auth/verify-email?token=${token}`;
    
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
    
        return 'Register berhasil';
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
                    idNumber: loginRequest.identifier
                }
            });
        }

        if(!user || !user.emailVerified) {
            throw new HttpException('Akun belum diverifikasi', 401);
        }

        const isPasswordValid = await bcrypt.compare(loginRequest.password, user.password);

        if(!isPasswordValid) {
            throw new HttpException('idNumber or email or password is invalid', 401);
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

    async me(user: CurrentUserRequest): Promise<AuthResponse> {
        const findUser = await this.prismaService.user.findUnique({
            where: { 
                id: user.id
            },
            include: {
                role: true,
            }
        });

        if (!findUser) {
            throw new HttpException('User tidak ditemukan', 404);
        }

        return {
            id: findUser.id,
            participantId: findUser.participantId,
            name: findUser.name,
            role: {
                id: findUser.role.id,
                name: findUser.role.name,
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

        if(user) {
            // Buat token reset password
            const resetToken = this.jwtService.sign({ email }, { expiresIn: '1h' });

            // Dapatkan alamat IP lokal secara dinamis untuk tahap pengembangan
            const networkInterfaces = os.networkInterfaces();
            let localIp = 'localhost'; // Default fallback
            
            // Iterasi melalui antarmuka jaringan untuk menemukan alamat IPv4 pertama
            for (const interfaceName in networkInterfaces) {
                const addresses = networkInterfaces[interfaceName];
                if (addresses) {
                    for (const addr of addresses) {
                        if (addr.family === 'IPv4' && !addr.internal) {
                        localIp = addr.address; // Tetapkan alamat IPv4 non-internal pertama
                        break;
                        }
                    }
                }
            }
        
            // Kirim email reset password
            const resetPasswordLink = `http://${localIp}:3000/auth/verify-reset-password/${resetToken}`;
            await this.mailerService.sendEmail({
                from: {
                    name: this.configService.get<string>('APP_NAME'),
                    address: this.configService.get<string>('MAIL_USER'),
                },
                receptients: [{
                    name: user ? user.name : email,
                    address: email,
                }],
                subject: 'Reset Password',
                html: `<p>Klik <a href="${resetPasswordLink}">link ini</a> untuk mereset password Anda.</p>`,
            });
        }

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

    async verifyEmail(token: string): Promise<void> {
        const payload = this.jwtService.verify(token);
        await this.prismaService.user.update({
            where: { id: payload.sub },
            data: {
                token: token,
                emailVerified: true,
            },
        });
    }

    async logout(user: CurrentUserRequest): Promise<string> {
        const authSelectedFields = this.authSelectedFields();
        await this.prismaService.user.update({
            where: {
                id: user.id,
            },
            data: {
                token: null,
            },
            select: authSelectedFields,
        });

        return 'Logout berhasil';
    }

    async checkUserExists(idNumber: string, email: string) {
        if (idNumber) {
            const totalUserwithSameNoPegawai = await this.prismaService.user.count({
                where: {
                    idNumber: idNumber,
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
            participantId: true,
            idNumber: true,
            email: true,
            name: true,
            nik: true,
            dinas: true,
            roleId: true,
            token: true,
            role: true,
        }
    }

    toAuthResponse(user: AuthResponse): AuthResponse {
        return {
            id: user.id,
            participantId: user.participantId,
            idNumber: user.idNumber,
            email: user.email,
            name: user.name,
            dinas: user.dinas,
            roleId: user.roleId,
            token: user.token,
            role: {
                id: user.role.id,
                name: user.role.name
            }
        };
    }
}