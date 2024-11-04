import { HttpException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/service/prisma.service";
import { ValidationService } from "src/common/service/validation.service";
import { CotResponse, CreateCOT, UpdateCot } from "src/model/cot.model";
import { CotValidation } from "./cot.validation";
import { ActionAccessRights, ListRequest, Paging, SearchRequest } from "src/model/web.model";
import { CurrentUserRequest } from "src/model/auth.model";

@Injectable()
export class CotService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly validationService: ValidationService,
    ) { }

    async createCot(request: CreateCOT): Promise<string> {
        request.status = true;
        request.tanggalMulai = new Date(request.tanggalMulai);
        request.tanggalSelesai = new Date(request.tanggalSelesai);

        const createCotRequest = this.validationService.validate(CotValidation.CREATE, request);

        const capabilityCount = await this.prismaService.cOT.count({
            where: {
                capabilityId: request.capabilityId
            }
        });

        if(capabilityCount > 0) {
            throw new HttpException('COT sudah ada', 404);
        }

        const createCot = await this.prismaService.cOT.create({
            data: createCotRequest
        });

        if(createCot) {
            await this.prismaService.participantsCOT.create({
                data: {
                    cotId: createCot.id,
                    participantId: undefined // karena belum ada participant
                }
            });
        };

        return 'Cot berhasil dibuat';
    }

    async getCot(cotId: string): Promise<CotResponse> {
        const cot = await this.prismaService.cOT.findUnique({
            where: {
                id: cotId
            },
            include: {
                Capability: true
            }
        });

        if(!cot) {
            throw new HttpException('COT tidak ditemukan', 404);
        }

        return cot;
    }

    async updateCot(cotId: string, request: UpdateCot): Promise<string> {
        const updateCotRequest = this.validationService.validate(CotValidation.UPDATE, request);
        const cot = await this.prismaService.cOT.findUnique({
            where: {
                id: cotId
            }
        });

        if(!cot) {
            throw new HttpException('COT tidak ditemukan', 404);
        }

        await this.prismaService.cOT.update({
            where: {
                id: cotId
            },
            data: updateCotRequest
        });

        return 'COT berhasil diperbarui';
    }

    async getUnregisteredParticipants(cotId: string, request: ListRequest): Promise<{ data: any[], paging: Paging }> {
        // Ambil total count terpisah
        const totalParticipants = await this.prismaService.participant.count({
            where: {
                NOT: {
                    ParticipantsCOT: {
                        some: {
                            cotId: cotId
                        }
                    }
                }
            }
        });
    
        // Ambil data dengan skip dan take
        const participants = await this.prismaService.participant.findMany({
            where: {
                NOT: {
                    ParticipantsCOT: {
                        some: {
                            cotId: cotId
                        }
                    }
                }
            },
            select: {
                id: true,
                noPegawai: true,
                nama: true,
                dinas: true,
                bidang: true,
                perusahaan: true
            },
            skip: (request.page - 1) * request.size,
            take: request.size
        });
    
        const totalPage = Math.ceil(totalParticipants / request.size);
    
        if (participants.length === 0) {
            throw new HttpException("Data tidak ditemukan", 404);
        }

        console.log(participants)
    
        return {
            data: participants,
            paging: {
                currentPage: request.page,
                totalPage: totalPage,
                size: request.size,
            },
        };
    }

    async addParticipantToCot(cotId: string, participantIds: string[]): Promise<string> {
        if (!Array.isArray(participantIds) || participantIds.length === 0) {
            throw new HttpException('Request format tidak valid. participantIds harus berupa array.', 400);
        }
    
        const cot = await this.prismaService.cOT.findUnique({
            where: { id: cotId },
        });
    
        if (!cot) {
            throw new HttpException('COT tidak ditemukan', 404);
        }
    
        const participants = await this.prismaService.participant.findMany({
            where: {
                id: { in: participantIds },
            },
        });

        const validParticipantIds = participants.map(p => p.id);
        console.log(validParticipantIds)

        // Filter hanya ID yang valid
        if (validParticipantIds.length === 0) {
            throw new HttpException('Tidak ada participant yang valid ditemukan', 404);
        }

        const existingParticipants = await this.prismaService.participantsCOT.findMany({
            where: {
                cotId,
                participantId: { in: validParticipantIds },
            },
        });
    
        const existingParticipantIds = existingParticipants.map(p => p.participantId);
        const newParticipantIds = validParticipantIds.filter(id => !existingParticipantIds.includes(id));
    
        if (newParticipantIds.length === 0) {
            throw new HttpException('Semua participant yang valid sudah terdaftar di COT ini', 400);
        }
    
        const participantData = newParticipantIds.map(participantId => ({
            participantId,
            cotId,
        }));
    
        await this.prismaService.participantsCOT.createMany({
            data: participantData,
        });
    
        return `${newParticipantIds.length} participant berhasil ditambahkan`;
    }

    async getParticipantsCot(cotId: string, request: ListRequest): Promise<any> {
        const participantCot = await this.prismaService.participantsCOT.findMany({
            where: {
                cotId: cotId
            },
            select: {
                cot: {
                    include: {
                        Capability: {
                            select: {
                                kodeRating: true,
                                namaTraining: true
                            }
                        }
                    }
                },
                participant: {
                    select: {
                        id: true,
                        noPegawai: true,
                        nama: true,
                        dinas: true
                    }
                },
            }
        });

        // Transformasi data untuk `cot`
        const transformedCot = participantCot.length > 0 ? participantCot[0].cot : null;

        // Ambil data `participant` dan hitung total
        const totalParticipants = participantCot.length;
        const totalPage = Math.ceil(totalParticipants / request.size);

        // Slice data `participant` berdasarkan `page` dan `size`
        const startIndex = (request.page - 1) * request.size;
        const endIndex = startIndex + request.size;
        const paginatedParticipants = participantCot.slice(startIndex, endIndex).map(item => item.participant);

        return {
            data: {
                cotId: cotId,
                cot: transformedCot,
                participant: paginatedParticipants,
                actions: {
                    canEdit: false,
                    canDelete: true,
                    canView: true,
                    canPrint: true,
                },
                paging: {
                    currentPage: request.page,
                    totalPage: totalPage,
                    size: request.size,
                    totalItems: totalParticipants,
                },
            }
        };
    }

    async deleteParticipantFromCot(participantId: string, cotId: string): Promise<string> {
        const deletedParticipant = await this.prismaService.participantsCOT.deleteMany({
            where: {
                AND: [
                    { participantId: { not: null, equals: participantId } },
                    { cotId: cotId }
                ]
            }
        });

        // Jika tidak ada data yang dihapus
        if (deletedParticipant.count === 0) {
            throw new HttpException('Participant tidak ditemukan dalam COT tersebut', 404);
        }

        return 'Participant berhasil dihapus dari COT';
    }

    async deleteCot(cotId: string): Promise<string> {
        const cot = await this.prismaService.cOT.findUnique({
            where : {
                id: cotId
            },
        });

        if(!cot) {
            throw new HttpException('COT tidak ditemukan', 404);
        }

        await this.prismaService.participantsCOT.deleteMany({
            where: {
                cotId: cot.id
            }
        });

        await this.prismaService.cOT.delete({
            where: {
                id: cot.id
            }
        });
        return 'Berhasil menghapus COT';
    }

    async listCot(request: ListRequest): Promise<{ data: CotResponse[], actions: ActionAccessRights, paging: Paging }> {
        const cot = await this.prismaService.cOT.findMany({
            include: {
                Capability: true
            }
        });

        const totalCot = cot.length;
        const totalPage = Math.ceil(totalCot / request.size);
        const paginateCot = cot.slice(
            (request.page - 1) * request.size,
            request.page * request.size
        );

        if (paginateCot.length === 0) {
            throw new HttpException("Data tidak ditemukan", 404);
        }

        return {
            data: paginateCot,
            actions:{
                canEdit: true,
                canDelete: true,
                canView: true,
            },
            paging: {
                currentPage: request.page,
                totalPage: totalPage,
                size: request.size,
            },
        };
    }

    async searchCot(request: SearchRequest, user: CurrentUserRequest): Promise<{ data: CotResponse[], actions: ActionAccessRights, paging: Paging }> {
        const searchRequest = this.validationService.validate(CotValidation.SEARCH, request);

        const cot = await this.prismaService.cOT.findMany({
            include: {
                Capability: true
            }
        });
        const query = searchRequest.searchQuery.toLowerCase();

        let filteredCot = cot;
        if(searchRequest.searchQuery) {
            filteredCot = cot.filter(cot => 
                cot.kodeCot.toLowerCase().includes(query) ||
                cot.Capability.kodeTraining.toLowerCase().includes(query) ||
                cot.Capability.namaTraining.toLowerCase().includes(query)
            );
        }

        const tottalCot = filteredCot.length;
        const totalPage = Math.ceil(tottalCot / searchRequest.size);
        const paginatedCot = filteredCot.slice(
            (searchRequest.page - 1) * searchRequest.size,
            searchRequest.page * searchRequest.size
        );

        if(paginatedCot.length === 0) {
            throw new HttpException('COT tidak ditemukan', 404);
        }

        const userWithRole = await this.userWithRole(user.user.id);
        const userRole = userWithRole.role.role.toLowerCase();
        const actions = this.validateActions(userRole);

        return {
            data: paginatedCot.map(cot => cot),
            actions: actions,
            paging: {
                currentPage: searchRequest.page,
                totalPage: totalPage,
                size: searchRequest.size,
            }
        }
    }

    private async userWithRole(userId: string) {
        const userRequest = await this.prismaService.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                role: true
            }
        });

        return userRequest;
    }

    private validateActions(userRole: string): ActionAccessRights {
        if(userRole === 'super admin' || userRole === 'lcu') {
            return {
                canEdit: true,
                canDelete: true,
                canView: true,
            }
        } else {
            return {
                canEdit: false,
                canDelete: false,
                canView: true,
            }
        }
    }
}